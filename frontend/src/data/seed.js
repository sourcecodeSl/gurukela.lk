/**
 * Demo dataset.
 *
 * Shaped exactly like the tables a backend would expose, so swapping in a
 * real API later means replacing src/api/client.js only — no page changes.
 */

const daysFromNow = (n, hh = 0, mm = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(hh, mm, 0, 0)
  return d.toISOString()
}

/* ------------------------------------------------------------------ */
/* Admin-managed catalogue: subjects -> modules                        */
/* ------------------------------------------------------------------ */

export const subjects = [
  { id: 'sub-1', name: 'Mathematics', icon: 'sigma', color: 245, description: 'Pure & applied mathematics for O/L and A/L' },
  { id: 'sub-2', name: 'Physics', icon: 'atom', color: 205, description: 'Mechanics, waves, electricity and modern physics' },
  { id: 'sub-3', name: 'Chemistry', icon: 'flask', color: 152, description: 'Organic, inorganic and physical chemistry' },
  { id: 'sub-4', name: 'Information Technology', icon: 'code', color: 275, description: 'Programming, databases and networking' },
  { id: 'sub-5', name: 'English', icon: 'book', color: 348, description: 'Language, literature and spoken English' },
  { id: 'sub-6', name: 'Business Studies', icon: 'chart', color: 35, description: 'Accounting, economics and management' },
]

export const modules = [
  // Mathematics
  { id: 'mod-1', subjectId: 'sub-1', code: 'MATH-101', name: 'Algebra & Functions', level: 'O/L', hours: 24 },
  { id: 'mod-2', subjectId: 'sub-1', code: 'MATH-102', name: 'Trigonometry', level: 'O/L', hours: 18 },
  { id: 'mod-3', subjectId: 'sub-1', code: 'MATH-201', name: 'Differential Calculus', level: 'A/L', hours: 30 },
  { id: 'mod-4', subjectId: 'sub-1', code: 'MATH-202', name: 'Integral Calculus', level: 'A/L', hours: 30 },
  { id: 'mod-5', subjectId: 'sub-1', code: 'MATH-203', name: 'Statistics & Probability', level: 'A/L', hours: 22 },
  // Physics
  { id: 'mod-6', subjectId: 'sub-2', code: 'PHY-101', name: 'Newtonian Mechanics', level: 'A/L', hours: 28 },
  { id: 'mod-7', subjectId: 'sub-2', code: 'PHY-102', name: 'Waves & Oscillations', level: 'A/L', hours: 20 },
  { id: 'mod-8', subjectId: 'sub-2', code: 'PHY-103', name: 'Electricity & Magnetism', level: 'A/L', hours: 26 },
  { id: 'mod-9', subjectId: 'sub-2', code: 'PHY-201', name: 'Modern Physics', level: 'A/L', hours: 18 },
  // Chemistry
  { id: 'mod-10', subjectId: 'sub-3', code: 'CHE-101', name: 'Atomic Structure', level: 'A/L', hours: 16 },
  { id: 'mod-11', subjectId: 'sub-3', code: 'CHE-102', name: 'Organic Chemistry I', level: 'A/L', hours: 32 },
  { id: 'mod-12', subjectId: 'sub-3', code: 'CHE-103', name: 'Chemical Equilibrium', level: 'A/L', hours: 20 },
  // IT
  { id: 'mod-13', subjectId: 'sub-4', code: 'ICT-101', name: 'Programming Fundamentals', level: 'Beginner', hours: 30 },
  { id: 'mod-14', subjectId: 'sub-4', code: 'ICT-102', name: 'Web Development', level: 'Intermediate', hours: 40 },
  { id: 'mod-15', subjectId: 'sub-4', code: 'ICT-103', name: 'Database Systems', level: 'Intermediate', hours: 28 },
  { id: 'mod-16', subjectId: 'sub-4', code: 'ICT-201', name: 'Data Structures & Algorithms', level: 'Advanced', hours: 36 },
  // English
  { id: 'mod-17', subjectId: 'sub-5', code: 'ENG-101', name: 'Spoken English', level: 'Beginner', hours: 24 },
  { id: 'mod-18', subjectId: 'sub-5', code: 'ENG-102', name: 'Grammar & Writing', level: 'Intermediate', hours: 20 },
  { id: 'mod-19', subjectId: 'sub-5', code: 'ENG-201', name: 'IELTS Preparation', level: 'Advanced', hours: 36 },
  // Business
  { id: 'mod-20', subjectId: 'sub-6', code: 'BUS-101', name: 'Financial Accounting', level: 'A/L', hours: 30 },
  { id: 'mod-21', subjectId: 'sub-6', code: 'BUS-102', name: 'Microeconomics', level: 'A/L', hours: 24 },
]

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

export const instructors = [
  {
    id: 'ins-1',
    name: 'Dr. Nimal Perera',
    title: 'Senior Mathematics Lecturer',
    hue: 245,
    verified: true,
    rating: 4.9,
    reviewCount: 128,
    teachingHours: 2340,
    studentCount: 412,
    hourlyRate: 2500,
    responseMins: 12,
    languages: ['Sinhala', 'English'],
    city: 'Colombo',
    experienceYears: 14,
    bio: 'PhD in Applied Mathematics with 14 years guiding A/L students. My classes focus on building intuition first and drilling past papers second.',
    moduleIds: ['mod-1', 'mod-2', 'mod-3', 'mod-4', 'mod-5'],
    highlights: ['Past-paper focused', 'Weekly progress reports', 'Free trial session'],
  },
  {
    id: 'ins-2',
    name: 'Ms. Sanduni Fernando',
    title: 'IT & Software Engineering Coach',
    hue: 275,
    verified: true,
    rating: 4.8,
    reviewCount: 96,
    teachingHours: 1680,
    studentCount: 305,
    hourlyRate: 3000,
    responseMins: 25,
    languages: ['English', 'Sinhala'],
    city: 'Kandy',
    experienceYears: 9,
    bio: 'Full-stack engineer turned educator. I teach programming the way it is actually practised — projects, code reviews and real tooling.',
    moduleIds: ['mod-13', 'mod-14', 'mod-15', 'mod-16'],
    highlights: ['Project based', 'Industry mentor', 'Portfolio review'],
  },
  {
    id: 'ins-3',
    name: 'Mr. Kasun Jayawardena',
    title: 'Physics Specialist',
    hue: 205,
    verified: true,
    rating: 4.7,
    reviewCount: 74,
    teachingHours: 1920,
    studentCount: 268,
    hourlyRate: 2200,
    responseMins: 40,
    languages: ['Sinhala'],
    city: 'Galle',
    experienceYears: 11,
    bio: 'I make physics visual. Every concept starts with a demonstration or simulation before a single equation goes on the board.',
    moduleIds: ['mod-6', 'mod-7', 'mod-8', 'mod-9'],
    highlights: ['Simulation led', 'Lab demonstrations', 'Doubt clearing hours'],
  },
  {
    id: 'ins-4',
    name: 'Mrs. Iresha Silva',
    title: 'Chemistry Educator',
    hue: 152,
    verified: true,
    rating: 4.6,
    reviewCount: 58,
    teachingHours: 1450,
    studentCount: 190,
    hourlyRate: 2400,
    responseMins: 30,
    languages: ['Sinhala', 'English'],
    city: 'Negombo',
    experienceYears: 8,
    bio: 'Organic chemistry does not have to be memorisation. I teach reaction mechanisms as stories you can reason through.',
    moduleIds: ['mod-10', 'mod-11', 'mod-12'],
    highlights: ['Mechanism first', 'Weekly quizzes', 'Note packs included'],
  },
  {
    id: 'ins-5',
    name: 'Mr. Ashan Weerasinghe',
    title: 'English Language Trainer',
    hue: 348,
    verified: false,
    rating: 4.5,
    reviewCount: 41,
    teachingHours: 860,
    studentCount: 143,
    hourlyRate: 1800,
    responseMins: 18,
    languages: ['English'],
    city: 'Colombo',
    experienceYears: 6,
    bio: 'IELTS 8.5 band holder. Conversation-heavy sessions where you speak for most of the hour, not me.',
    moduleIds: ['mod-17', 'mod-18', 'mod-19'],
    highlights: ['Speaking practice', 'Mock interviews', 'Band score tracking'],
  },
  {
    id: 'ins-6',
    name: 'Mr. Ruwan Bandara',
    title: 'Commerce & Accounting Tutor',
    hue: 35,
    verified: true,
    rating: 4.4,
    reviewCount: 33,
    teachingHours: 720,
    studentCount: 98,
    hourlyRate: 2000,
    responseMins: 55,
    languages: ['Sinhala', 'English'],
    city: 'Matara',
    experienceYears: 7,
    bio: 'Chartered accountant sharing the shortcuts that actually work in exam conditions, without skipping the fundamentals.',
    moduleIds: ['mod-20', 'mod-21'],
    highlights: ['Exam techniques', 'Model papers', 'Small batches'],
  },
  {
    id: 'ins-7',
    name: 'Ms. Hiruni Rathnayake',
    title: 'Mathematics & Statistics Tutor',
    hue: 172,
    verified: true,
    rating: 4.8,
    reviewCount: 67,
    teachingHours: 1120,
    studentCount: 176,
    hourlyRate: 2300,
    responseMins: 15,
    languages: ['English', 'Sinhala'],
    city: 'Colombo',
    experienceYears: 6,
    bio: 'Statistics is where most students lose easy marks. I run data-driven sessions with real datasets so the theory sticks.',
    moduleIds: ['mod-1', 'mod-5', 'mod-3'],
    highlights: ['Data driven', 'Fast replies', 'Custom worksheets'],
  },
  {
    id: 'ins-8',
    name: 'Mr. Dilan Gunasekara',
    title: 'Full-Stack Developer & Mentor',
    hue: 8,
    verified: false,
    rating: 4.3,
    reviewCount: 22,
    teachingHours: 540,
    studentCount: 74,
    hourlyRate: 2800,
    responseMins: 60,
    languages: ['English'],
    city: 'Remote',
    experienceYears: 5,
    bio: 'I coach career switchers into their first developer job. Expect homework, and expect it to be reviewed line by line.',
    moduleIds: ['mod-13', 'mod-14', 'mod-16'],
    highlights: ['Career coaching', 'Code reviews', 'Interview prep'],
  },
]

export const students = [
  { id: 'std-1', name: 'Tharindu Vishwa', hue: 205, email: 'tharindu@example.lk', joinedAt: daysFromNow(-210) },
  { id: 'std-2', name: 'Amaya Dissanayake', hue: 275, email: 'amaya@example.lk', joinedAt: daysFromNow(-140) },
  { id: 'std-3', name: 'Sahan Wickrama', hue: 152, email: 'sahan@example.lk', joinedAt: daysFromNow(-95) },
  { id: 'std-4', name: 'Nethmi Ranasinghe', hue: 348, email: 'nethmi@example.lk', joinedAt: daysFromNow(-60) },
  { id: 'std-5', name: 'Chamod Silva', hue: 35, email: 'chamod@example.lk', joinedAt: daysFromNow(-30) },
]

/* ------------------------------------------------------------------ */
/* Reviews — a review only exists once the student paid AND completed  */
/* 30+ days with that instructor. `eligibleAfter` records that gate.   */
/* ------------------------------------------------------------------ */

export const reviews = [
  { id: 'rev-1', instructorId: 'ins-1', studentId: 'std-1', rating: 5, daysStudied: 128, createdAt: daysFromNow(-14), verified: true, text: 'Sir explains calculus in a way that finally made integration click for me. Went from a C to an A in three months.' },
  { id: 'rev-2', instructorId: 'ins-1', studentId: 'std-2', rating: 5, daysStudied: 92, createdAt: daysFromNow(-32), verified: true, text: 'Very organised. Every session has a plan and he shares notes right after. Worth every rupee.' },
  { id: 'rev-3', instructorId: 'ins-1', studentId: 'std-3', rating: 4, daysStudied: 45, createdAt: daysFromNow(-8), verified: true, text: 'Great teaching. Only wish the sessions were a bit longer, one hour goes fast.' },
  { id: 'rev-4', instructorId: 'ins-2', studentId: 'std-2', rating: 5, daysStudied: 110, createdAt: daysFromNow(-21), verified: true, text: 'Built three real projects with her guidance. My GitHub actually looks employable now.' },
  { id: 'rev-5', instructorId: 'ins-2', studentId: 'std-4', rating: 5, daysStudied: 38, createdAt: daysFromNow(-5), verified: true, text: 'Code reviews are brutally honest and that is exactly what I needed. Highly recommended.' },
  { id: 'rev-6', instructorId: 'ins-3', studentId: 'std-1', rating: 5, daysStudied: 75, createdAt: daysFromNow(-40), verified: true, text: 'The simulations make waves and SHM so much easier to picture. Best physics teacher I have had.' },
  { id: 'rev-7', instructorId: 'ins-3', studentId: 'std-5', rating: 4, daysStudied: 34, createdAt: daysFromNow(-3), verified: true, text: 'Very patient with doubts. Replies to messages a bit slowly but always replies.' },
  { id: 'rev-8', instructorId: 'ins-4', studentId: 'std-3', rating: 5, daysStudied: 66, createdAt: daysFromNow(-18), verified: true, text: 'Organic chemistry used to terrify me. Now mechanisms are the part I look forward to.' },
  { id: 'rev-9', instructorId: 'ins-7', studentId: 'std-4', rating: 5, daysStudied: 51, createdAt: daysFromNow(-11), verified: true, text: 'She sends custom worksheets based on exactly what I got wrong last week. Incredible attention.' },
  { id: 'rev-10', instructorId: 'ins-5', studentId: 'std-5', rating: 4, daysStudied: 41, createdAt: daysFromNow(-9), verified: true, text: 'My speaking confidence improved a lot. Mock interviews were the most useful part.' },
]

/* ------------------------------------------------------------------ */
/* Free time slots published by instructors                            */
/* ------------------------------------------------------------------ */

export const slots = [
  { id: 'slt-1', instructorId: 'ins-1', date: daysFromNow(1), start: '19:00', end: '20:00', status: 'open', bookedBy: null, price: 2500 },
  { id: 'slt-2', instructorId: 'ins-1', date: daysFromNow(1), start: '20:00', end: '21:00', status: 'open', bookedBy: null, price: 2500 },
  { id: 'slt-3', instructorId: 'ins-1', date: daysFromNow(2), start: '19:00', end: '21:00', status: 'open', bookedBy: null, price: 5000 },
  { id: 'slt-4', instructorId: 'ins-1', date: daysFromNow(3), start: '21:00', end: '22:00', status: 'booked', bookedBy: 'std-2', price: 2500 },
  { id: 'slt-5', instructorId: 'ins-2', date: daysFromNow(1), start: '18:00', end: '19:30', status: 'open', bookedBy: null, price: 4500 },
  { id: 'slt-6', instructorId: 'ins-2', date: daysFromNow(2), start: '20:00', end: '21:30', status: 'open', bookedBy: null, price: 4500 },
  { id: 'slt-7', instructorId: 'ins-2', date: daysFromNow(4), start: '19:00', end: '20:00', status: 'open', bookedBy: null, price: 3000 },
  { id: 'slt-8', instructorId: 'ins-3', date: daysFromNow(2), start: '17:00', end: '18:00', status: 'open', bookedBy: null, price: 2200 },
  { id: 'slt-9', instructorId: 'ins-3', date: daysFromNow(3), start: '19:00', end: '20:00', status: 'open', bookedBy: null, price: 2200 },
  { id: 'slt-10', instructorId: 'ins-4', date: daysFromNow(1), start: '16:00', end: '17:00', status: 'open', bookedBy: null, price: 2400 },
  { id: 'slt-11', instructorId: 'ins-7', date: daysFromNow(2), start: '18:00', end: '19:00', status: 'open', bookedBy: null, price: 2300 },
  { id: 'slt-12', instructorId: 'ins-5', date: daysFromNow(3), start: '20:00', end: '21:00', status: 'open', bookedBy: null, price: 1800 },
]

/**
 * Slot requests. Lifecycle:
 *   pending -> accepted -> (first student to pay) -> paid  |  lost
 *   pending -> rejected
 * Several students may hold an `accepted` request for the same slot; the
 * first payment wins and the rest flip to `lost`.
 */
export const slotRequests = [
  { id: 'req-1', slotId: 'slt-1', studentId: 'std-2', moduleId: 'mod-3', status: 'pending', note: 'I need help with related rates problems before the term test.', createdAt: daysFromNow(0, 9, 12) },
  { id: 'req-2', slotId: 'slt-1', studentId: 'std-3', moduleId: 'mod-4', status: 'pending', note: 'Struggling with integration by parts.', createdAt: daysFromNow(0, 10, 40) },
  { id: 'req-3', slotId: 'slt-5', studentId: 'std-4', moduleId: 'mod-14', status: 'accepted', note: 'Would like a React fundamentals walkthrough.', createdAt: daysFromNow(-1, 15, 0), acceptedAt: daysFromNow(-1, 18, 0) },
  { id: 'req-4', slotId: 'slt-8', studentId: 'std-5', moduleId: 'mod-7', status: 'rejected', note: 'SHM doubts.', createdAt: daysFromNow(-2, 11, 0) },
]

/* ------------------------------------------------------------------ */
/* Pre-scheduled group classes — pay and join directly, no request     */
/* ------------------------------------------------------------------ */

export const groupClasses = [
  {
    id: 'grp-1', instructorId: 'ins-1', moduleId: 'mod-3',
    title: 'A/L Calculus Intensive — Batch 2026',
    description: 'Eight-week intensive covering limits, differentiation and applications with weekly past-paper drills.',
    schedule: 'Mon & Wed, 7:00 PM - 8:30 PM', weeks: 8,
    startsAt: daysFromNow(5), seats: 30, enrolled: 23, price: 12000, level: 'A/L',
  },
  {
    id: 'grp-2', instructorId: 'ins-2', moduleId: 'mod-14',
    title: 'Full-Stack Web Development Bootcamp',
    description: 'Build and deploy three production-style projects using React, Node and MySQL. Code reviewed every week.',
    schedule: 'Sat & Sun, 9:00 AM - 12:00 PM', weeks: 12,
    startsAt: daysFromNow(9), seats: 25, enrolled: 25, price: 35000, level: 'Intermediate',
  },
  {
    id: 'grp-3', instructorId: 'ins-3', moduleId: 'mod-6',
    title: 'Mechanics Masterclass',
    description: 'Newtonian mechanics from first principles, with live simulations and a weekly problem set.',
    schedule: 'Tue & Thu, 5:00 PM - 6:30 PM', weeks: 6,
    startsAt: daysFromNow(3), seats: 40, enrolled: 18, price: 9000, level: 'A/L',
  },
  {
    id: 'grp-4', instructorId: 'ins-4', moduleId: 'mod-11',
    title: 'Organic Chemistry Mechanisms',
    description: 'Reaction mechanisms taught as reasoning patterns instead of memorisation, plus a printed note pack.',
    schedule: 'Fri, 6:00 PM - 8:00 PM', weeks: 10,
    startsAt: daysFromNow(7), seats: 35, enrolled: 12, price: 11000, level: 'A/L',
  },
  {
    id: 'grp-5', instructorId: 'ins-5', moduleId: 'mod-19',
    title: 'IELTS Band 7+ Preparation',
    description: 'All four modules with two full mock tests and individual speaking feedback.',
    schedule: 'Mon, Wed & Fri, 8:00 PM - 9:00 PM', weeks: 6,
    startsAt: daysFromNow(2), seats: 20, enrolled: 17, price: 18000, level: 'Advanced',
  },
  {
    id: 'grp-6', instructorId: 'ins-7', moduleId: 'mod-5',
    title: 'Statistics & Probability Crash Course',
    description: 'Four weekends to close the gap on the statistics section, using real datasets throughout.',
    schedule: 'Sun, 2:00 PM - 5:00 PM', weeks: 4,
    startsAt: daysFromNow(6), seats: 30, enrolled: 9, price: 7500, level: 'A/L',
  },
  {
    id: 'grp-7', instructorId: 'ins-6', moduleId: 'mod-20',
    title: 'Financial Accounting Foundations',
    description: 'Double entry through to final accounts, drilled with model papers every session.',
    schedule: 'Tue & Sat, 4:00 PM - 5:30 PM', weeks: 8,
    startsAt: daysFromNow(11), seats: 28, enrolled: 6, price: 10000, level: 'A/L',
  },
  {
    id: 'grp-8', instructorId: 'ins-2', moduleId: 'mod-16',
    title: 'Data Structures & Algorithms for Interviews',
    description: 'Pattern-based problem solving with weekly timed mock interviews.',
    schedule: 'Sat, 7:00 PM - 9:00 PM', weeks: 10,
    startsAt: daysFromNow(14), seats: 20, enrolled: 14, price: 22000, level: 'Advanced',
  },
]

/* ------------------------------------------------------------------ */
/* What the signed-in demo student already has                         */
/* ------------------------------------------------------------------ */

export const enrollments = [
  { id: 'enr-1', type: 'group', refId: 'grp-3', studentId: 'std-1', paidAt: daysFromNow(-45), amount: 9000, startedAt: daysFromNow(-45) },
  { id: 'enr-2', type: 'slot', refId: 'slt-4', studentId: 'std-2', paidAt: daysFromNow(-2), amount: 2500, startedAt: daysFromNow(-2) },
]

export const payments = [
  { id: 'pay-1', enrollmentId: 'enr-1', studentId: 'std-1', amount: 9000, method: 'card', status: 'success', at: daysFromNow(-45) },
  { id: 'pay-2', enrollmentId: 'enr-2', studentId: 'std-2', amount: 2500, method: 'card', status: 'success', at: daysFromNow(-2) },
]

export const seed = {
  subjects,
  modules,
  instructors,
  students,
  reviews,
  slots,
  slotRequests,
  groupClasses,
  enrollments,
  payments,
}

export default seed
