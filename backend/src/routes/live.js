import { Router } from 'express'
import { query, queryOne, tx } from '../config/db.js'
import { uid } from '../utils/ids.js'
import { asyncH, notFound, forbidden, badRequest } from '../utils/http.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { mapLiveSession } from '../utils/mappers.js'
import env from '../config/env.js'
import {
  createMeeting,
  hostZak,
  sdkSignature,
  zoomEmbedConfigured,
  zoomApiConfigured,
} from '../services/zoom.js'

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

// Whether Zoom in-site classes are available (used by the client to show/hide UI).
router.get(
  '/zoom/status',
  asyncH(async (req, res) => {
    res.json({ enabled: zoomEmbedConfigured() && zoomApiConfigured() })
  })
)

// Owner creates (or reuses) the Zoom meeting for a slot / class / seminar.
router.post(
  '/:type/:id/meeting',
  instructorOnly,
  asyncH(async (req, res) => {
    const { type, id } = req.params
    if (!OWNER_TABLE[type]) throw badRequest('Invalid session type')
    if (!zoomApiConfigured()) throw badRequest('Zoom is not configured on the server')

    const spec = await meetingSpec(type, id)
    if (!spec) throw notFound('Session target not found')
    if (spec.row.instructor_id !== req.user.profileId) throw forbidden('Not your session')

    // Reuse an existing meeting so we don't create duplicates.
    if (spec.row.zoom_meeting_id) {
      return res.json({ meetingId: spec.row.zoom_meeting_id, reused: true })
    }

    const meeting = await createMeeting(spec)
    await query(
      `UPDATE ${OWNER_TABLE[type]} SET zoom_meeting_id = ?, zoom_passcode = ? WHERE id = ?`,
      [meeting.meetingId, meeting.passcode, id]
    )
    res.status(201).json({ meetingId: meeting.meetingId, reused: false })
  })
)

// Join config for the embedded Zoom client. The owner joins as host (role 1,
// can record); permitted students join as attendees (role 0, cannot record).
router.get(
  '/:type/:id/join',
  authenticate,
  asyncH(async (req, res) => {
    const { type, id } = req.params
    if (!OWNER_TABLE[type]) throw badRequest('Invalid session type')
    if (!zoomEmbedConfigured()) throw badRequest('Zoom is not configured on the server')

    const spec = await meetingSpec(type, id)
    if (!spec) throw notFound('Session target not found')
    if (!spec.row.zoom_meeting_id)
      throw badRequest('The live class has not been started by the teacher yet')

    const isOwner =
      req.user.role === 'instructor' && spec.row.instructor_id === req.user.profileId
    if (!isOwner) {
      if (req.user.role !== 'student' || !(await studentMayJoin(type, id, req.user.profileId)))
        throw forbidden('You are not allowed to join this live class')
    }

    const role = isOwner ? 1 : 0
    res.json({
      sdkKey: env.zoom.sdkKey,
      signature: sdkSignature(spec.row.zoom_meeting_id, role),
      meetingNumber: spec.row.zoom_meeting_id,
      passcode: spec.row.zoom_passcode || '',
      role,
      userName: await displayName(req.user),
      // Host start token — only ever sent to the owning teacher.
      zak: isOwner ? await hostZak() : undefined,
    })
  })
)

export default router
