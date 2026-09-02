/**
 * Shape DB rows into the camelCase objects the frontend expects
 * (see frontend/src/data/seed.js). JSON columns are already parsed by mysql2.
 */

const asArray = (v) => {
  if (Array.isArray(v)) return v
  if (v == null) return []
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

export const mapSubject = (r) =>
  r && { id: r.id, name: r.name, icon: r.icon, color: r.color, description: r.description }

export const mapModule = (r) =>
  r && {
    id: r.id,
    subjectId: r.subject_id,
    code: r.code,
    name: r.name,
    level: r.level,
    hours: r.hours,
  }

export const mapInstructor = (r, moduleIds = []) =>
  r && {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    title: r.title,
    hue: r.hue,
    verified: r.verification_status === 'verified',
    verificationStatus: r.verification_status,
    videoUrl: r.video_url,
    isActive: !!r.is_active,
    banned: r.banned != null ? !!r.banned : undefined,
    rating: Number(r.rating),
    reviewCount: r.review_count,
    teachingHours: r.teaching_hours,
    studentCount: r.student_count,
    hourlyRate: r.hourly_rate,
    responseMins: r.response_mins,
    languages: asArray(r.languages),
    city: r.city,
    experienceYears: r.experience_years,
    bio: r.bio,
    highlights: asArray(r.highlights),
    email: r.email,
    phone: r.phone,
    moduleIds,
  }

export const mapStudent = (r, subjectIds = []) =>
  r && {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    hue: r.hue,
    email: r.email,
    phone: r.phone,
    birthday: r.birthday,
    grade: r.grade,
    banned: r.banned != null ? !!r.banned : undefined,
    joinedAt: r.joined_at,
    subjectIds,
  }

export const mapSlot = (r) =>
  r && {
    id: r.id,
    instructorId: r.instructor_id,
    date: r.date,
    start: r.start,
    end: r.end,
    status: r.status,
    bookedBy: r.booked_by,
    price: r.price,
  }

export const mapRequest = (r) =>
  r && {
    id: r.id,
    slotId: r.slot_id,
    studentId: r.student_id,
    studentName: r.student_name,
    studentHue: r.student_hue,
    moduleId: r.module_id,
    status: r.status,
    note: r.note,
    createdAt: r.created_at,
    acceptedAt: r.accepted_at,
    rejectedAt: r.rejected_at,
    paidAt: r.paid_at,
  }

export const mapGroup = (r) =>
  r && {
    id: r.id,
    instructorId: r.instructor_id,
    moduleId: r.module_id,
    title: r.title,
    description: r.description,
    schedule: r.schedule,
    weeks: r.weeks,
    startsAt: r.starts_at,
    seats: r.seats,
    enrolled: r.enrolled,
    price: r.price,
    level: r.level,
  }

export const mapReview = (r) =>
  r && {
    id: r.id,
    instructorId: r.instructor_id,
    studentId: r.student_id,
    studentName: r.student_name,
    studentHue: r.student_hue,
    rating: r.rating,
    daysStudied: r.days_studied,
    text: r.text,
    verified: !!r.verified,
    createdAt: r.created_at,
  }

export const mapPayment = (r) =>
  r && {
    id: r.id,
    enrollmentId: r.enrollment_id,
    studentId: r.student_id,
    instructorId: r.instructor_id,
    amount: r.amount,
    commissionRate: Number(r.commission_rate),
    commissionAmount: r.commission_amount,
    instructorEarning: r.instructor_earning,
    method: r.method,
    status: r.status,
    at: r.at,
  }

export const mapEnrollment = (r) =>
  r && {
    id: r.id,
    type: r.type,
    refId: r.ref_id,
    requestId: r.request_id,
    studentId: r.student_id,
    studentName: r.student_name,
    studentHue: r.student_hue,
    amount: r.amount,
    paidAt: r.paid_at,
    startedAt: r.started_at,
  }
