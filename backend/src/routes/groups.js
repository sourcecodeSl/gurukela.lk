import { Router } from 'express'
import { query, queryOne, tx } from '../config/db.js'
import { uid } from '../utils/ids.js'
import { asyncH, notFound, forbidden, badRequest, conflict } from '../utils/http.js'
import { requireFields } from '../utils/validate.js'
import { mapGroup } from '../utils/mappers.js'
import { authenticate, requireRole, requireVerifiedInstructor } from '../middleware/auth.js'
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
  asyncH(async (req, res) => {
    const { instructorId } = req.query
    const rows = instructorId
      ? await query('SELECT * FROM group_classes WHERE instructor_id = ? ORDER BY starts_at', [
          instructorId,
        ])
      : await query('SELECT * FROM group_classes ORDER BY starts_at')
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
        (id, instructor_id, subject_id, module_id, title, description, schedule, weeks, starts_at, seats, enrolled, price, level, meet_link)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
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
        starts_at = ?, seats = ?, price = ?, level = ?, meet_link = ? WHERE id = ?`,
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
