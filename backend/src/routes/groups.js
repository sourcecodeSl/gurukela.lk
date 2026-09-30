import { Router } from 'express'
import { query, queryOne, tx } from '../config/db.js'
import { uid } from '../utils/ids.js'
import { asyncH, notFound, forbidden, badRequest, conflict } from '../utils/http.js'
import { requireFields } from '../utils/validate.js'
import { mapGroup } from '../utils/mappers.js'
import { authenticate, requireRole, requireVerifiedInstructor, optionalAuth } from '../middleware/auth.js'
import { recordPayment } from '../repositories/payments.js'

const router = Router()

// The module ids (lessons) a group class covers, in order.
const lessonIdsOf = async (groupId) =>
  (
    await query('SELECT module_id FROM group_class_lessons WHERE group_id = ? ORDER BY position', [
      groupId,
    ])
  ).map((r) => r.module_id)

// Replace a group's lesson set with the given module ids.
const setLessons = async (groupId, lessonIds) => {
  await query('DELETE FROM group_class_lessons WHERE group_id = ?', [groupId])
  const ids = [...new Set((lessonIds || []).filter(Boolean))]
  for (let i = 0; i < ids.length; i++)
    await query(
      'INSERT INTO group_class_lessons (group_id, module_id, position) VALUES (?, ?, ?)',
      [groupId, ids[i], i]
    )
}

const groupWithLessons = async (id) => {
  const g = await queryOne('SELECT * FROM group_classes WHERE id = ?', [id])
  return g ? mapGroup(g, await lessonIdsOf(id)) : null
}

router.get(
  '/',
  optionalAuth,
  asyncH(async (req, res) => {
    const { instructorId } = req.query
    // `live` = the teacher has an open (not-ended) live session for this class,
    // so enrolled students can join it right now. `ended_recently` = the last
    // session ended within the past 15 minutes (and none is open), so students
    // see a transient "Session ended" instead of a stale "Join live" button.
    const liveCol =
      "EXISTS(SELECT 1 FROM live_sessions ls WHERE ls.type='group' AND ls.ref_id = g.id AND ls.ended_at IS NULL) AS live," +
      "EXISTS(SELECT 1 FROM live_sessions ls WHERE ls.type='group' AND ls.ref_id = g.id AND ls.ended_at IS NOT NULL AND ls.ended_at >= NOW() - INTERVAL 15 MINUTE) AS ended_recently"
    // Hidden drafts (published = 0) are visible only to their owning instructor
    // and to students already enrolled (so hiding a class never strips access
    // from people who paid). Everyone else sees a class once it is published.
    // Anonymous viewers have no ids, so the '' placeholders match nothing.
    const viewerInstructorId = req.user?.role === 'instructor' ? req.user.profileId : ''
    const viewerStudentId = req.user?.role === 'student' ? req.user.profileId : ''
    const params = []
    const conds = []
    if (instructorId) {
      conds.push('g.instructor_id = ?')
      params.push(instructorId)
    }
    conds.push(
      `(g.published = 1 OR g.instructor_id = ? OR EXISTS(
        SELECT 1 FROM enrollments e WHERE e.type = 'group' AND e.ref_id = g.id AND e.student_id = ?
      ))`
    )
    params.push(viewerInstructorId, viewerStudentId)
    const where = `WHERE ${conds.join(' AND ')}`
    const rows = await query(
      `SELECT g.*, ${liveCol} FROM group_classes g ${where} ORDER BY g.starts_at`,
      params
    )
    res.json(await Promise.all(rows.map(async (r) => mapGroup(r, await lessonIdsOf(r.id)))))
  })
)

router.get(
  '/:id',
  asyncH(async (req, res) => {
    const g = await groupWithLessons(req.params.id)
    if (!g) throw notFound('Group class not found')
    res.json(g)
  })
)

const instructorOnly = [authenticate, requireRole('instructor')]

router.post(
  '/',
  [...instructorOnly, requireVerifiedInstructor],
  asyncH(async (req, res) => {
    const b = req.body
    requireFields(b, ['title'])
    const id = uid('grp')
    await query(
      `INSERT INTO group_classes
        (id, instructor_id, subject_id, module_id, title, description, schedule, weeks, starts_at, seats, enrolled, price, level, meet_link, youtube_url, published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
      [
        id,
        req.user.profileId,
        b.subjectId || null,
        b.moduleId || null,
        b.title,
        b.description || null,
        b.schedule || null,
        b.weeks ?? null,
        b.startsAt || null,
        b.seats ?? 0,
        b.price ?? 0,
        b.level || null,
        b.meetLink || null,
        b.youtubeUrl || null,
        // Default to public; a teacher can create a hidden draft by sending false.
        b.published === false ? 0 : 1,
      ]
    )
    await setLessons(id, b.lessonIds)
    res.status(201).json(await groupWithLessons(id))
  })
)

const assertOwner = async (req) => {
  const g = await queryOne('SELECT * FROM group_classes WHERE id = ?', [req.params.id])
  if (!g) throw notFound('Group class not found')
  if (g.instructor_id !== req.user.profileId) throw forbidden('Not your class')
  return g
}

router.put(
  '/:id',
  instructorOnly,
  asyncH(async (req, res) => {
    const g = await assertOwner(req)
    const b = { ...g, ...req.body }
    await query(
      `UPDATE group_classes SET subject_id = ?, module_id = ?, title = ?, description = ?, schedule = ?, weeks = ?,
        starts_at = ?, seats = ?, price = ?, level = ?, meet_link = ?, youtube_url = ?, published = ? WHERE id = ?`,
      [
        b.subjectId ?? g.subject_id,
        b.moduleId ?? g.module_id,
        b.title,
        b.description,
        b.schedule,
        b.weeks,
        b.startsAt ?? g.starts_at,
        b.seats,
        b.price,
        b.level,
        b.meetLink !== undefined ? (b.meetLink || null) : g.meet_link,
        req.body.youtubeUrl !== undefined ? (req.body.youtubeUrl || null) : g.youtube_url,
        req.body.published !== undefined ? (req.body.published ? 1 : 0) : g.published,
        req.params.id,
      ]
    )
    if (req.body.lessonIds !== undefined) await setLessons(req.params.id, req.body.lessonIds)
    res.json(await groupWithLessons(req.params.id))
  })
)

router.delete(
  '/:id',
  instructorOnly,
  asyncH(async (req, res) => {
    await assertOwner(req)
    await query('DELETE FROM group_classes WHERE id = ?', [req.params.id])
    res.json({ message: 'Group class removed' })
  })
)

// Flip a class between public and hidden without touching the rest of its
// fields — powers the instant show/hide toggle on the instructor's Classes list.
router.patch(
  '/:id/publish',
  instructorOnly,
  asyncH(async (req, res) => {
    await assertOwner(req)
    await query('UPDATE group_classes SET published = ? WHERE id = ?', [
      req.body.published ? 1 : 0,
      req.params.id,
    ])
    res.json(await groupWithLessons(req.params.id))
  })
)

// Student pays and joins directly (no approval).
router.post(
  '/:id/join',
  authenticate,
  requireRole('student'),
  asyncH(async (req, res) => {
    const result = await tx(async (c) => {
      const [[g]] = await c.query('SELECT * FROM group_classes WHERE id = ? FOR UPDATE', [
        req.params.id,
      ])
      if (!g) throw notFound('Group class not found')
      if (!g.published) throw notFound('Group class not found')
      if (g.enrolled >= g.seats) throw conflict('This class is full')

      const [[dupe]] = await c.query(
        `SELECT id FROM enrollments WHERE type = 'group' AND ref_id = ? AND student_id = ?`,
        [g.id, req.user.profileId]
      )
      if (dupe) throw badRequest('You have already joined this class')

      const pay = await recordPayment(c, {
        type: 'group',
        refId: g.id,
        studentId: req.user.profileId,
        instructorId: g.instructor_id,
        amount: g.price,
        method: req.body.method,
      })
      await c.query('UPDATE group_classes SET enrolled = enrolled + 1 WHERE id = ?', [g.id])
      return pay
    })
    res.json({ message: 'Joined the class.', ...result })
  })
)

export default router
