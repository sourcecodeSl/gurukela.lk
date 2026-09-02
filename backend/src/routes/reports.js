import { Router } from 'express'
import { query, queryOne } from '../config/db.js'
import { uid } from '../utils/ids.js'
import { asyncH, notFound, badRequest } from '../utils/http.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()
router.use(authenticate, requireRole('admin'))

const dateFilter = (req) => {
  const { from, to } = req.query
  const where = ["status = 'success'"]
  const params = []
  if (from) {
    where.push('at >= ?')
    params.push(from)
  }
  if (to) {
    where.push('at <= ?')
    params.push(to)
  }
  return { clause: 'WHERE ' + where.join(' AND '), params }
}

/**
 * Revenue report: gross income, platform commission, and instructor earnings,
 * with a monthly breakdown. Optional ?from=&to= (ISO dates).
 */
router.get(
  '/revenue',
  asyncH(async (req, res) => {
    const { clause, params } = dateFilter(req)
    const totals = await queryOne(
      `SELECT COUNT(*) AS transactions,
              COALESCE(SUM(amount),0) AS gross,
              COALESCE(SUM(commission_amount),0) AS commission,
              COALESCE(SUM(instructor_earning),0) AS instructorEarnings
       FROM payments ${clause}`,
      params
    )
    const byMonth = await query(
      `SELECT DATE_FORMAT(at, '%Y-%m') AS month,
              COUNT(*) AS transactions,
              SUM(amount) AS gross,
              SUM(commission_amount) AS commission,
              SUM(instructor_earning) AS instructorEarnings
       FROM payments ${clause}
       GROUP BY month ORDER BY month`,
      params
    )
    const byType = await query(
      `SELECT e.type, COUNT(*) AS transactions, SUM(p.amount) AS gross
       FROM payments p JOIN enrollments e ON e.id = p.enrollment_id
       ${clause.replace(/at /g, 'p.at ')}
       GROUP BY e.type`,
      params
    )
    res.json({ totals, byMonth, byType })
  })
)

/**
 * Teacher payment report: per-instructor earnings, what has been paid out,
 * and the outstanding balance owed.
 */
router.get(
  '/teacher-payments',
  asyncH(async (req, res) => {
    const rows = await query(
      `SELECT i.id AS instructorId, i.name,
              COALESCE(earn.transactions,0) AS transactions,
              COALESCE(earn.gross,0) AS gross,
              COALESCE(earn.commission,0) AS commission,
              COALESCE(earn.earned,0) AS earned,
              COALESCE(paid.paidOut,0) AS paidOut,
              COALESCE(earn.earned,0) - COALESCE(paid.paidOut,0) AS balance
       FROM instructors i
       LEFT JOIN (
         SELECT instructor_id,
                COUNT(*) AS transactions,
                SUM(amount) AS gross,
                SUM(commission_amount) AS commission,
                SUM(instructor_earning) AS earned
         FROM payments WHERE status = 'success' GROUP BY instructor_id
       ) earn ON earn.instructor_id = i.id
       LEFT JOIN (
         SELECT instructor_id, SUM(amount) AS paidOut FROM payouts GROUP BY instructor_id
       ) paid ON paid.instructor_id = i.id
       ORDER BY balance DESC`
    )
    res.json(rows)
  })
)

/** Commission report: platform commission collected, current rate, monthly split. */
router.get(
  '/commission',
  asyncH(async (req, res) => {
    const { clause, params } = dateFilter(req)
    const totals = await queryOne(
      `SELECT COALESCE(SUM(amount),0) AS gross,
              COALESCE(SUM(commission_amount),0) AS commission
       FROM payments ${clause}`,
      params
    )
    const byMonth = await query(
      `SELECT DATE_FORMAT(at, '%Y-%m') AS month,
              SUM(amount) AS gross,
              SUM(commission_amount) AS commission,
              AVG(commission_rate) AS avgRate
       FROM payments ${clause}
       GROUP BY month ORDER BY month`,
      params
    )
    res.json({ totals, byMonth })
  })
)

/* ------------------------- payouts to teachers ------------------------- */
router.get(
  '/payouts',
  asyncH(async (req, res) => {
    const { instructorId } = req.query
    const rows = instructorId
      ? await query('SELECT * FROM payouts WHERE instructor_id = ? ORDER BY created_at DESC', [
          instructorId,
        ])
      : await query('SELECT * FROM payouts ORDER BY created_at DESC')
    res.json(rows)
  })
)

// Record a payout made to a teacher.
router.post(
  '/payouts',
  asyncH(async (req, res) => {
    const { instructorId, amount, note } = req.body
    if (!instructorId) throw badRequest('instructorId is required')
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0) throw badRequest('amount must be a positive number')
    const ins = await queryOne('SELECT id FROM instructors WHERE id = ?', [instructorId])
    if (!ins) throw notFound('Instructor not found')

    const id = uid('pout')
    await query('INSERT INTO payouts (id, instructor_id, amount, note) VALUES (?, ?, ?, ?)', [
      id,
      instructorId,
      Math.round(amt),
      note || null,
    ])
    res.status(201).json(await queryOne('SELECT * FROM payouts WHERE id = ?', [id]))
  })
)

export default router
