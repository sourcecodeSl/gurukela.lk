/**
 * Shape DB rows into the camelCase objects the frontend expects
 * (see frontend/src/data/seed.js). JSON columns are already parsed by mysql2.
 */

export const asArray = (v) => {
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

export const mapStream = (r) =>
  r && { id: r.id, name: r.name, color: r.color, position: r.position }

export const mapSubject = (r) =>
  r && {
    id: r.id,
    streamId: r.stream_id,
    streamName: r.stream_name,
    name: r.name,
    icon: r.icon,
    color: r.color,
    description: r.description,
    grade: r.grade || null,
    // Backward-compat: the public registration picker / lecturer filter group
    // subjects by a `streams` name array. A subject now has a single stream.
    streams: r.stream_name ? [r.stream_name] : [],
  }

export const mapModule = (r) =>
  r && {
    id: r.id,
    subjectId: r.subject_id,
    code: r.code,
    name: r.name,
    level: r.level,
    hours: r.hours,
  }

export const mapLesson = (r) =>
  r && {
    id: r.id,
    moduleId: r.module_id,
    instructorId: r.instructor_id,
    name: r.name,
    hours: r.hours,
    position: r.position,
    isDefault: r.instructor_id == null,
  }

export const mapInstructor = (r, subjectIds = []) =>
  r && {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    title: r.title,
    photoUrl: r.photo_url,
    hue: r.hue,
    verified: r.verification_status === 'verified',
    verificationStatus: r.verification_status,
    videoUrl: r.video_url,
    demoVideoUrl: r.demo_video_url,
    demoVideoHidden: !!r.demo_video_hidden,
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
    subjectIds,
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
    meetLink: r.meet_link,
    acceptingRequests: r.accepting_requests == null ? true : !!r.accepting_requests,
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
    origin: r.origin,
    note: r.note,
    createdAt: r.created_at,
    proposedAt: r.proposed_at,
    acceptedAt: r.accepted_at,
    rejectedAt: r.rejected_at,
    paidAt: r.paid_at,
  }

export const mapGroup = (r, lessonIds = []) =>
  r && {
    id: r.id,
    instructorId: r.instructor_id,
    subjectId: r.subject_id,
    moduleId: r.module_id,
    lessonIds,
    title: r.title,
    description: r.description,
    schedule: r.schedule,
    weeks: r.weeks,
    startsAt: r.starts_at,
    seats: r.seats,
    enrolled: r.enrolled,
    price: r.price,
    level: r.level,
    meetLink: r.meet_link,
  }

// A seminar. `meetLink` is included only when the caller is allowed to see it
// (the route decides); public listings pass it through as null.
export const mapSeminar = (r, { registered = false } = {}) =>
  r && {
    id: r.id,
    instructorId: r.instructor_id,
    subjectId: r.subject_id,
    title: r.title,
    description: r.description,
    bannerUrl: r.banner_url,
    startsAt: r.starts_at,
    durationMins: r.duration_mins,
    isFree: !!r.is_free,
    price: r.price,
    seats: r.seats,
    registered: r.registered,
    status: r.status,
    createdAt: r.created_at,
    // Only surfaced to registered students; null otherwise.
    meetLink: registered ? r.meet_link : null,
    // Convenience flag for the signed-in student, when the route computes it.
    isRegistered: r.is_registered != null ? !!r.is_registered : undefined,
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

export const mapMaterial = (r) =>
  r && {
    id: r.id,
    instructorId: r.instructor_id,
    instructorName: r.instructor_name,
    subjectId: r.subject_id,
    moduleId: r.module_id,
    title: r.title,
    kind: r.kind,
    url: r.url,
    description: r.description,
    createdAt: r.created_at,
  }

export const mapAd = (r) =>
  r && {
    id: r.id,
    title: r.title,
    text: r.text,
    imageUrl: r.image_url,
    link: r.link,
    position: r.position,
    isActive: !!r.is_active,
    createdAt: r.created_at,
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
