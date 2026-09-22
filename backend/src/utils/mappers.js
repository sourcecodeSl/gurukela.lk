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
    degree: r.degree,
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
    teachingMinutes: r.teaching_minutes,
    studentCount: r.student_count,
    hourlyRate: r.hourly_rate,
    responseMins: r.response_mins,
    languages: asArray(r.languages),
    district: r.district,
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
    hasZoom: !!r.zoom_meeting_id,
    acceptingRequests: r.accepting_requests == null ? true : !!r.accepting_requests,
    // True while the teacher has an open live session for this slot.
    live: !!r.live,
    // True for a short window after the teacher ended the session, so students
    // see "Session ended" instead of a stale "Join live" button.
    endedRecently: !!r.ended_recently,
  }

export const mapRequest = (r) =>
  r && {
    id: r.id,
    slotId: r.slot_id,
    studentId: r.student_id,
    instructorId: r.instructor_id,
    studentName: r.student_name,
    studentHue: r.student_hue,
    subjectId: r.subject_id,
    moduleId: r.module_id,
    status: r.status,
    origin: r.origin,
    note: r.note,
    // Proposed time/price for a custom (slot-less) request. The frontend falls
    // back to these when there is no slot yet.
    reqDate: r.req_date,
    reqStart: r.req_start,
    reqEnd: r.req_end,
    reqPrice: r.req_price,
    createdAt: r.created_at,
    proposedAt: r.proposed_at,
    acceptedAt: r.accepted_at,
    rejectedAt: r.rejected_at,
    paidAt: r.paid_at,
    // An offline (QR / bank) payment awaiting admin verification, if any. Only
    // populated for the student's own request listing.
    manualPending: r.manual_pending_method != null,
    manualMethod: r.manual_pending_method || null,
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
    youtubeUrl: r.youtube_url,
    hasZoom: !!r.zoom_meeting_id,
    // True while the teacher has an open live session for this class.
    live: !!r.live,
    // True for a short window after the teacher ended the session, so students
    // see "Session ended" instead of a stale "Join live" button.
    endedRecently: !!r.ended_recently,
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
    // The YouTube watch/stream URL. Exposed to everyone (like a group class's
    // link) so the owning instructor can edit it and any registered student can
    // watch; the "Watch live" button is only shown to registered students.
    youtubeUrl: r.youtube_url,
    hasZoom: !!r.zoom_meeting_id,
    // True while the teacher has an open live session for this seminar — the
    // student list uses it to keep a running seminar joinable (not "past").
    live: !!r.live,
    // True for a short window after the teacher ended the session, so students
    // see "Session ended" instead of a stale "Join live" button.
    endedRecently: !!r.ended_recently,
    // Convenience flag for the signed-in student, when the route computes it.
    isRegistered: r.is_registered != null ? !!r.is_registered : undefined,
  }

// A live teaching session. `elapsedSecs` is server-computed for open sessions so
// the client timer doesn't depend on parsing a timezone-less datetime string.
export const mapLiveSession = (r) =>
  r && {
    id: r.id,
    type: r.type,
    refId: r.ref_id,
    instructorId: r.instructor_id,
    startedAt: r.started_at,
    endedAt: r.ended_at,
    minutes: r.minutes,
    elapsedSecs: r.elapsed_secs != null ? Math.max(0, Number(r.elapsed_secs)) : undefined,
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
    updatedAt: r.updated_at,
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

// A pending/decided offline payment (QR or bank transfer). `label` and student
// name are attached by the admin route's JOIN so the panel can render context.
export const mapManualPayment = (r) =>
  r && {
    id: r.id,
    studentId: r.student_id,
    studentName: r.student_name,
    studentHue: r.student_hue,
    kind: r.kind,
    refId: r.ref_id,
    label: r.label || null,
    method: r.method,
    amount: r.amount,
    reference: r.reference,
    slipUrl: r.slip_url,
    status: r.status,
    note: r.note,
    createdAt: r.created_at,
    reviewedAt: r.reviewed_at,
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

// A quiz question. Pass `{ reveal: true }` to include the correct answer index
// (instructor views + ended results). While a quiz is live the routes omit it
// so students can never read the answer key from the network response.
// Options are stored as { text, imageUrl } objects, but older rows may be plain
// strings — normalise both to the object shape the client expects.
const normOption = (o) =>
  o && typeof o === 'object'
    ? { text: o.text ?? '', imageUrl: o.imageUrl ?? null }
    : { text: o == null ? '' : String(o), imageUrl: null }

// The set of correct option indexes for a revealed question — reads the JSON
// array column, falling back to the legacy single correct_index.
const revealCorrect = (r) => {
  const raw = r.correct_indexes && typeof r.correct_indexes === 'string' ? JSON.parse(r.correct_indexes) : r.correct_indexes
  const arr = Array.isArray(raw) ? [...new Set(raw.map(Number).filter(Number.isInteger))].sort((a, b) => a - b) : []
  return arr.length ? arr : [Number(r.correct_index) || 0]
}

export const mapQuestion = (r, { reveal = false } = {}) =>
  r && {
    id: r.id,
    quizId: r.quiz_id,
    position: r.position,
    text: r.text,
    imageUrl: r.image_url ?? null,
    options: asArray(r.options).map(normOption),
    // Tells the taker to show checkboxes + "select all that apply". Reveals only
    // that several answers are correct, never which ones.
    multiSelect: revealCorrect(r).length > 1,
    ...(reveal ? { correctIndex: r.correct_index, correctIndexes: revealCorrect(r) } : {}),
  }

// A quiz. `ends_at` drives the shared countdown; `isEnded` folds in the case
// where the window has elapsed but the row is still flagged 'active'.
export const mapQuiz = (r, { questions } = {}) => {
  if (!r) return r
  const ended = r.status === 'ended' || (r.ends_at != null && new Date(r.ends_at) <= new Date())
  return {
    id: r.id,
    seminarId: r.seminar_id,
    slotId: r.slot_id,
    instructorId: r.instructor_id,
    title: r.title,
    durationSecs: r.duration_secs,
    status: r.status,
    scheduledAt: r.scheduled_at,
    startedAt: r.started_at,
    endsAt: r.ends_at,
    createdAt: r.created_at,
    isEnded: ended,
    // Server-computed remaining seconds — drives the live countdown without the
    // client having to parse a timezone-less datetime string. Clamped at 0.
    secondsLeft:
      r.seconds_left != null ? Math.max(0, Number(r.seconds_left)) : undefined,
    // Convenience counts/flags the routes may attach.
    questionCount: r.question_count != null ? Number(r.question_count) : undefined,
    submissionCount: r.submission_count != null ? Number(r.submission_count) : undefined,
    ...(questions ? { questions } : {}),
  }
}

export const mapSubmission = (r) =>
  r && {
    id: r.id,
    quizId: r.quiz_id,
    studentId: r.student_id,
    studentName: r.student_name,
    studentHue: r.student_hue,
    answers: r.answers && typeof r.answers === 'string' ? JSON.parse(r.answers) : r.answers || {},
    score: r.score,
    total: r.total,
    submittedAt: r.submitted_at,
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
