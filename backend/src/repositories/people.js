import { query, queryOne } from '../config/db.js'
import { mapInstructor, mapStudent } from '../utils/mappers.js'

const moduleIdsFor = async (instructorId) => {
  const rows = await query('SELECT module_id FROM instructor_modules WHERE instructor_id = ?', [
    instructorId,
  ])
  return rows.map((r) => r.module_id)
}

const subjectIdsFor = async (studentId) => {
  const rows = await query('SELECT subject_id FROM student_subjects WHERE student_id = ?', [
    studentId,
  ])
  return rows.map((r) => r.subject_id)
}

/** Instructor joined with its user row, plus module ids. `opts.publicView` hides contact/ban. */
export async function getInstructor(id, { publicView = false } = {}) {
  const r = await queryOne(
    `SELECT i.*, u.email, u.phone, u.banned
     FROM instructors i JOIN users u ON u.id = i.user_id WHERE i.id = ?`,
    [id]
  )
  if (!r) return null
  const mapped = mapInstructor(r, await moduleIdsFor(id))
  if (publicView) {
    delete mapped.email
    delete mapped.phone
    delete mapped.banned
    delete mapped.userId
  }
  return mapped
}

export async function listInstructors({ publicView = false } = {}) {
  const rows = await query(
    `SELECT i.*, u.email, u.phone, u.banned
     FROM instructors i JOIN users u ON u.id = i.user_id ORDER BY i.created_at DESC`
  )
  const links = await query('SELECT instructor_id, module_id FROM instructor_modules')
  const byInstructor = {}
  for (const l of links) (byInstructor[l.instructor_id] ||= []).push(l.module_id)

  return rows.map((r) => {
    const m = mapInstructor(r, byInstructor[r.id] || [])
    if (publicView) {
      delete m.email
      delete m.phone
      delete m.banned
      delete m.userId
    }
    return m
  })
}

export async function getStudent(id) {
  const r = await queryOne(
    `SELECT s.*, u.email, u.phone, u.banned
     FROM students s JOIN users u ON u.id = s.user_id WHERE s.id = ?`,
    [id]
  )
  if (!r) return null
  return mapStudent(r, await subjectIdsFor(id))
}

export async function listStudents() {
  const rows = await query(
    `SELECT s.*, u.email, u.phone, u.banned
     FROM students s JOIN users u ON u.id = s.user_id ORDER BY s.joined_at DESC`
  )
  const links = await query('SELECT student_id, subject_id FROM student_subjects')
  const byStudent = {}
  for (const l of links) (byStudent[l.student_id] ||= []).push(l.subject_id)
  return rows.map((r) => mapStudent(r, byStudent[r.id] || []))
}

/** Resolve the instructor/student profile id for a user id. */
export async function profileIdForUser(userId, role) {
  if (role === 'instructor') {
    const r = await queryOne('SELECT id FROM instructors WHERE user_id = ?', [userId])
    return r?.id || null
  }
  if (role === 'student') {
    const r = await queryOne('SELECT id FROM students WHERE user_id = ?', [userId])
    return r?.id || null
  }
  return null
}

export { moduleIdsFor, subjectIdsFor }
