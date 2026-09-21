import { Router } from 'express'
import { query, queryOne, tx } from '../config/db.js'
import { uid } from '../utils/ids.js'
import { asyncH, notFound, forbidden, badRequest } from '../utils/http.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { mapLiveSession } from '../utils/mappers.js'
import { createRoom, meetingToken, roomUrl, dailyConfigured } from '../services/daily.js'

/**
 * Live teaching sessions. An instructor presses "Start session" when a live
 * class begins and "End session" when it ends; the elapsed minutes are added to
 * their teaching time. Works for one-on-one slots, group classes and seminars.
 */
const router = Router()

// Which table owns each session type, so we can verify the caller owns it.
const OWNER_TABLE = { slot: 'slots', group: 'group_classes', seminar: 'seminars' }

// Returns the owning instructor id, or undefined when the target row is missing.
async function ownerOf(type, id) {
  const table = OWNER_TABLE[type]
  if (!table) return undefined
  const row = await queryOne(`SELECT instructor_id FROM ${table} WHERE id = ?`, [id])
  return row ? row.instructor_id : undefined
}

const instructorOnly = [authenticate, requireRole('instructor')]

// The signed-in instructor's currently-open sessions, so the UI can restore the
// running timer after a reload.
router.get(
  '/active',
  instructorOnly,
  asyncH(async (req, res) => {
    const rows = await query(
      `SELECT *, TIMESTAMPDIFF(SECOND, started_at, NOW()) AS elapsed_secs
         FROM live_sessions
        WHERE instructor_id = ? AND ended_at IS NULL
        ORDER BY started_at`,
      [req.user.profileId]
    )
    res.json(rows.map(mapLiveSession))
  })
)

// Start a live session for a slot / group class / seminar. Idempotent: if one is
// already open for this target, it is returned instead of creating a duplicate.
router.post(
  '/:type/:id/start',
  instructorOnly,
  asyncH(async (req, res) => {
    const { type, id } = req.params
    if (!OWNER_TABLE[type]) throw badRequest('Invalid session type')

    const owner = await ownerOf(type, id)
    if (owner === undefined) throw notFound('Session target not found')
    if (owner !== req.user.profileId) throw forbidden('Not your session')

    const existing = await queryOne(
      `SELECT *, TIMESTAMPDIFF(SECOND, started_at, NOW()) AS elapsed_secs
         FROM live_sessions
        WHERE type = ? AND ref_id = ? AND instructor_id = ? AND ended_at IS NULL`,
      [type, id, req.user.profileId]
    )
    if (existing) return res.json(mapLiveSession(existing))

    const sid = uid('live')
    await query(
      `INSERT INTO live_sessions (id, type, ref_id, instructor_id, started_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [sid, type, id, req.user.profileId]
    )
    res
      .status(201)
      .json(
        mapLiveSession(
          await queryOne(
            `SELECT *, TIMESTAMPDIFF(SECOND, started_at, NOW()) AS elapsed_secs
               FROM live_sessions WHERE id = ?`,
            [sid]
          )
        )
      )
  })
)

// End the open session for this target and count its minutes toward the
// instructor's teaching time (minimum 1 minute).
router.post(
  '/:type/:id/end',
  instructorOnly,
  asyncH(async (req, res) => {
    const { type, id } = req.params
    if (!OWNER_TABLE[type]) throw badRequest('Invalid session type')

    const session = await queryOne(
      `SELECT * FROM live_sessions
        WHERE type = ? AND ref_id = ? AND instructor_id = ? AND ended_at IS NULL
        ORDER BY started_at DESC LIMIT 1`,
      [type, id, req.user.profileId]
    )
    if (!session) throw notFound('No active session to end')

    await tx(async (c) => {
      await c.query(
        `UPDATE live_sessions
            SET ended_at = NOW(),
                minutes = GREATEST(1, TIMESTAMPDIFF(MINUTE, started_at, NOW()))
          WHERE id = ?`,
        [session.id]
      )
      const [rows] = await c.query('SELECT minutes FROM live_sessions WHERE id = ?', [session.id])
      const mins = rows[0].minutes
      // Two statements so teaching_hours reads the already-incremented minutes.
      await c.query(
        'UPDATE instructors SET teaching_minutes = teaching_minutes + ? WHERE id = ?',
        [mins, req.user.profileId]
      )
      await c.query(
        'UPDATE instructors SET teaching_hours = ROUND(teaching_minutes / 60) WHERE id = ?',
        [req.user.profileId]
      )
    })

    // Forget the Zoom meeting for this target so the next "Start live class"
    // mints a fresh meeting instead of reusing this one — a reused id points at
    // an ended (and on the Free plan, unusable) meeting. Ignored on databases
    // without the zoom columns.
    try {
      await query(
        `UPDATE ${OWNER_TABLE[type]} SET zoom_meeting_id = NULL, zoom_passcode = NULL WHERE id = ?`,
        [id]
      )
    } catch (e) {
      if (!/Unknown column/i.test(e.message)) throw e
    }

    res.json(mapLiveSession(await queryOne('SELECT * FROM live_sessions WHERE id = ?', [session.id])))
  })
)

/* -------------------------------------------------------------------------- */
/*  Zoom in-site live classes                                                 */
/* -------------------------------------------------------------------------- */

// Build the topic / start time / duration for a Zoom meeting from the target row.
async function meetingSpec(type, id) {
  if (type === 'slot') {
    const s = await queryOne('SELECT * FROM slots WHERE id = ?', [id])
    if (!s) return null
    const dur = (() => {
      const [sh, sm] = String(s.start).split(':').map(Number)
      const [eh, em] = String(s.end).split(':').map(Number)
      const mins = eh * 60 + em - (sh * 60 + sm)
      return mins > 0 ? mins : 60
    })()
    return { row: s, topic: `1-on-1 session · ${s.start}–${s.end}`, startTime: null, duration: dur }
  }
  if (type === 'group') {
    const g = await queryOne('SELECT * FROM group_classes WHERE id = ?', [id])
    if (!g) return null
    return { row: g, topic: g.title, startTime: null, duration: 60 }
  }
  const s = await queryOne('SELECT * FROM seminars WHERE id = ?', [id])
  if (!s) return null
  return { row: s, topic: s.title, startTime: null, duration: s.duration_mins || 60 }
}

// Can this student join the given live class?
async function studentMayJoin(type, id, studentId) {
  if (type === 'slot') {
    return !!(await queryOne('SELECT 1 FROM slots WHERE id = ? AND booked_by = ?', [id, studentId]))
  }
  if (type === 'group') {
    return !!(await queryOne(
      "SELECT 1 FROM enrollments WHERE type = 'group' AND ref_id = ? AND student_id = ?",
      [id, studentId]
    ))
  }
  return !!(await queryOne(
    'SELECT 1 FROM seminar_registrations WHERE seminar_id = ? AND student_id = ?',
    [id, studentId]
  ))
}

const displayName = async (user) => {
  if (user.role === 'instructor') {
    const r = await queryOne('SELECT name FROM instructors WHERE id = ?', [user.profileId])
    return r?.name || 'Teacher'
  }
  if (user.role === 'student') {
    const r = await queryOne('SELECT name FROM students WHERE id = ?', [user.profileId])
    return r?.name || 'Student'
  }
  return 'Guest'
}

// Whether in-site live classes are available (used by the client to show/hide UI).
// Path kept as /zoom/status so the existing frontend flag keeps working.
router.get(
  '/zoom/status',
  asyncH(async (req, res) => {
    res.json({ enabled: dailyConfigured() })
  })
)

// Owner creates (or reuses) the Zoom meeting for a slot / class / seminar.
router.post(
  '/:type/:id/meeting',
  instructorOnly,
  asyncH(async (req, res) => {
    const { type, id } = req.params
    if (!OWNER_TABLE[type]) throw badRequest('Invalid session type')
    if (!dailyConfigured()) throw badRequest('Live classes are not configured on the server')

    const spec = await meetingSpec(type, id)
    if (!spec) throw notFound('Session target not found')
    if (spec.row.instructor_id !== req.user.profileId) throw forbidden('Not your session')

    // `force` (from the "New meeting" button) always mints a brand-new meeting,
    // even mid-session — the teacher's escape hatch when the stored meeting is
    // dead/expired (e.g. a stale "Live now" session left over from last time).
    const force = req.body?.force === true

    // Otherwise reuse the stored meeting only while a live session is actually
    // open for this target — i.e. the class is in progress and we mustn't create
    // a duplicate. Once the previous session has ended (or its scheduled time is
    // over and it was never reused), the stored id points at a dead/expired
    // meeting, so a fresh "Start live class" mints a brand-new meeting for the
    // same seminar instead of reopening the old one.
    const openSession = await queryOne(
      `SELECT id FROM live_sessions
        WHERE type = ? AND ref_id = ? AND instructor_id = ? AND ended_at IS NULL
        LIMIT 1`,
      [type, id, req.user.profileId]
    )
    if (!force && spec.row.zoom_meeting_id && openSession) {
      return res.json({ meetingId: spec.row.zoom_meeting_id, reused: true })
    }

    // A fresh Daily room. Its name is stored in the (reused) zoom_meeting_id
    // column; the join URL is rebuilt from the name + configured domain.
    const room = await createRoom(spec)
    try {
      await query(
        `UPDATE ${OWNER_TABLE[type]} SET zoom_meeting_id = ?, zoom_passcode = ? WHERE id = ?`,
        [room.roomName, '', id]
      )
    } catch (e) {
      if (/Unknown column/i.test(e.message))
        throw badRequest(
          'Database is missing the zoom_meeting_id / zoom_passcode columns — run the ' +
            '2026-09-14-zoom-meetings.sql migration on this database.'
        )
      throw e
    }
    res.status(201).json({ meetingId: room.roomName, reused: false })
  })
)

// Join config for the embedded Daily client. The owner joins as host (role 1,
// owner token — can manage/record); permitted students join as guests (role 0).
router.get(
  '/:type/:id/join',
  authenticate,
  asyncH(async (req, res) => {
    const { type, id } = req.params
    if (!OWNER_TABLE[type]) throw badRequest('Invalid session type')
    if (!dailyConfigured()) throw badRequest('Live classes are not configured on the server')

    const spec = await meetingSpec(type, id)
    if (!spec) throw notFound('Session target not found')
    const roomName = spec.row.zoom_meeting_id
    if (!roomName)
      throw badRequest('The live class has not been started by the teacher yet')

    const isOwner =
      req.user.role === 'instructor' && spec.row.instructor_id === req.user.profileId
    if (!isOwner) {
      if (req.user.role !== 'student' || !(await studentMayJoin(type, id, req.user.profileId)))
        throw forbidden('You are not allowed to join this live class')
    }

    const userName = await displayName(req.user)
    res.json({
      roomUrl: roomUrl(roomName),
      token: await meetingToken({ roomName, isOwner, userName }),
      role: isOwner ? 1 : 0,
      userName,
    })
  })
)

export default router
