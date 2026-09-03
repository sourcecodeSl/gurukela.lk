/**
 * Public website content.
 *
 * Everything the marketing site renders lives here as plain data so the pages
 * stay presentational. No API calls — the backend is deliberately not wired
 * yet; swapping these exports for fetches later touches this file only.
 */

/* ------------------------------------------------------------------ */
/* Identity                                                            */
/* ------------------------------------------------------------------ */

export const site = {
  name: 'Gurukela',
  domain: 'gurukela.lk',
  tagline: 'Online academy for the modern generation',
  motto: 'Innovation through collaboration',
  intro:
    'Sri Lanka’s island-wide online classroom for Ordinary Level and Advanced Level students — live lessons, ' +
    'recorded revision, tutes at your door and a lecturer panel certified across every stream.',
}

/**
 * TODO — replace every value here with Gurukela's own details before launch.
 * These are deliberate placeholders: nothing on this site may carry another
 * academy's address, hotlines, WhatsApp number or social accounts.
 */
export const contact = {
  address: 'Colombo, Sri Lanka',
  phones: ['+94 11 000 0000', '+94 77 000 0000'],
  tuteLine: '+94 11 000 0001',
  complaintsLine: '+94 11 000 0002',
  email: 'hello@gurukela.lk',
  whatsapp: '94110000000',
  hours: 'Monday – Saturday · 8.00 a.m. to 8.00 p.m.',
  // Add Gurukela's own accounts here when they exist, e.g.
  // { id: 'facebook', label: 'Facebook', href: 'https://facebook.com/gurukela' }
  socials: [],
}

/* ------------------------------------------------------------------ */
/* Streams — mirrors the four categories the reference site sells      */
/* ------------------------------------------------------------------ */

export const streams = [
  {
    id: 'al-science',
    short: 'Science',
    name: 'A/L — Science Stream',
    level: 'Advanced Level',
    blurb: 'Biology, Physics, Chemistry and Combined Mathematics, theory through revision.',
    subjects: ['Biology', 'Physics', 'Chemistry', 'Combined Mathematics', 'Agriculture'],
  },
  {
    id: 'al-technology',
    short: 'Technology',
    name: 'A/L — Technology Stream',
    level: 'Advanced Level',
    blurb: 'Engineering & Bio-systems Technology, Science for Technology and ICT.',
    subjects: ['Engineering Technology', 'Bio-systems Technology', 'Science for Technology', 'ICT'],
  },
  {
    id: 'al-commerce',
    short: 'Commerce',
    name: 'A/L — Commerce Stream',
    level: 'Advanced Level',
    blurb: 'Accounting, Business Studies, Economics and B.S.T. with weekly paper practice.',
    subjects: ['Accounting', 'Business Studies', 'Economics', 'Business Statistics'],
  },
  {
    id: 'ordinary-level',
    short: 'O/L',
    name: 'Ordinary Level',
    level: 'Grade 6 — 11',
    blurb: 'Mathematics, Science, English, Sinhala, History, ICT and Commerce.',
    subjects: ['Mathematics', 'Science', 'English', 'Sinhala', 'History', 'ICT', 'Commerce'],
  },
]

export const streamById = (id) => streams.find((s) => s.id === id)

/* ------------------------------------------------------------------ */
/* Lecturer panel                                                      */
/* ------------------------------------------------------------------ */

const L = (id, name, subject, stream, medium, title, years, extra = {}) => ({
  id,
  name,
  subject,
  stream,
  medium,
  title,
  years,
  rating: extra.rating ?? 4.8,
  students: extra.students ?? 900,
  featured: extra.featured ?? false,
  bio:
    extra.bio ??
    `${name} teaches ${subject} for the ${streamById(stream).name} and brings ${years} years in the classroom, ` +
      'covering the full syllabus from first theory lesson to past-paper discussion.',
  qualifications: extra.qualifications ?? [
    'B.Sc. (Hons) — University of Colombo',
    'Postgraduate Diploma in Education',
    `${years} years of A/L and O/L teaching experience`,
  ],
  classes: extra.classes ?? ['Theory', 'Revision', 'Paper Class'],
})

export const lecturers = [
  // ---- A/L Science ----
  L('rohana-wickramasinghe', 'Rohana Wickramasinghe', 'Chemistry', 'al-science', 'Sinhala', 'Founder · Chief Chemistry Lecturer', 24, {
    rating: 5.0,
    students: 12400,
    featured: true,
    bio:
      'Founder of Gurukela and a chemistry lecturer with more than twenty years in Sri Lankan education, who has ' +
      'guided thousands of Advanced Level students into state university faculties.',
    qualifications: [
      'B.Sc. (Special) Chemistry — University of Peradeniya',
      'M.Sc. Analytical Chemistry',
      'Twenty-four years of Advanced Level teaching',
    ],
    classes: ['Theory', 'Revision', 'Paper Class', 'Seminar'],
  }),
  L('sanjaya-bandara', 'Sanjaya Bandara', 'Physics', 'al-science', 'Sinhala', 'Senior Physics Lecturer', 18, { rating: 4.9, students: 7300, featured: true }),
  L('dilrukshi-wijesinghe', 'Dilrukshi Wijesinghe', 'Biology', 'al-science', 'Sinhala', 'Senior Biology Lecturer', 16, { rating: 4.9, students: 6100, featured: true }),
  L('kasun-ratnayake', 'Kasun Ratnayake', 'Combined Mathematics', 'al-science', 'Sinhala', 'Combined Maths Lecturer', 14, { rating: 4.8, students: 5400, featured: true }),
  L('anusha-jayaweera', 'Anusha Jayaweera', 'Chemistry', 'al-science', 'English', 'Chemistry Lecturer — English Medium', 11, { rating: 4.8, students: 2600 }),
  L('roshan-fernando', 'Roshan Fernando', 'Physics', 'al-science', 'English', 'Physics Lecturer — English Medium', 12, { rating: 4.7, students: 2300 }),
  L('maheshi-gunaratne', 'Maheshi Gunaratne', 'Biology', 'al-science', 'English', 'Biology Lecturer — English Medium', 10, { rating: 4.8, students: 2100 }),
  L('thilina-alwis', 'Thilina Alwis', 'Combined Mathematics', 'al-science', 'English', 'Combined Maths — English Medium', 9, { rating: 4.7, students: 1800 }),
  L('nadeeka-silva', 'Nadeeka Silva', 'Agriculture', 'al-science', 'Sinhala', 'Agricultural Science Lecturer', 13, { rating: 4.8, students: 1500 }),
  L('chamara-weerasekara', 'Chamara Weerasekara', 'Physics', 'al-science', 'Sinhala', 'Physics Revision Specialist', 15, { rating: 4.9, students: 4400 }),

  // ---- A/L Technology ----
  L('ruwan-pathirana', 'Ruwan Pathirana', 'Engineering Technology', 'al-technology', 'Sinhala', 'Engineering Technology Lecturer', 12, { rating: 4.9, students: 3900, featured: true }),
  L('hasitha-kumarasinghe', 'Hasitha Kumarasinghe', 'Science for Technology', 'al-technology', 'Sinhala', 'S.F.T. Lecturer', 10, { rating: 4.8, students: 3100 }),
  L('ishara-madushani', 'Ishara Madushani', 'Bio-systems Technology', 'al-technology', 'Sinhala', 'Bio-systems Technology Lecturer', 9, { rating: 4.8, students: 2400 }),
  L('dinesh-abeywickrama', 'Dinesh Abeywickrama', 'ICT', 'al-technology', 'English', 'ICT Lecturer — English Medium', 11, { rating: 4.9, students: 4200, featured: true }),
  L('lakmal-perera', 'Lakmal Perera', 'ICT', 'al-technology', 'Sinhala', 'ICT & Software Fundamentals', 8, { rating: 4.7, students: 2000 }),

  // ---- A/L Commerce ----
  L('sunil-rajapaksha', 'Sunil Rajapaksha', 'Accounting', 'al-commerce', 'Sinhala', 'Senior Accounting Lecturer', 20, { rating: 4.9, students: 6800, featured: true }),
  L('shanika-de-silva', 'Shanika de Silva', 'Business Studies', 'al-commerce', 'Sinhala', 'Business Studies Lecturer', 13, { rating: 4.8, students: 3600 }),
  L('gayan-herath', 'Gayan Herath', 'Economics', 'al-commerce', 'Sinhala', 'Economics Lecturer', 15, { rating: 4.9, students: 4100, featured: true }),
  L('tharindu-mendis', 'Tharindu Mendis', 'Business Statistics', 'al-commerce', 'English', 'B.S.T. Lecturer — English Medium', 9, { rating: 4.7, students: 1600 }),
  L('priyanka-samarasinghe', 'Priyanka Samarasinghe', 'Accounting', 'al-commerce', 'English', 'Accounting — English Medium', 10, { rating: 4.8, students: 1900 }),

  // ---- Ordinary Level ----
  L('ajith-kumara', 'Ajith Kumara', 'Mathematics', 'ordinary-level', 'Sinhala', 'O/L Mathematics Lecturer', 17, { rating: 4.9, students: 8200, featured: true }),
  L('nilanthi-peiris', 'Nilanthi Peiris', 'Science', 'ordinary-level', 'Sinhala', 'O/L Science Lecturer', 14, { rating: 4.9, students: 6900, featured: true }),
  L('samantha-cooray', 'Samantha Cooray', 'English', 'ordinary-level', 'English', 'O/L English Lecturer', 12, { rating: 4.8, students: 5200 }),
  L('mahinda-dissanayake', 'Mahinda Dissanayake', 'Sinhala', 'ordinary-level', 'Sinhala', 'O/L Sinhala Language & Literature', 19, { rating: 4.9, students: 4700 }),
  L('kumudu-ranasinghe', 'Kumudu Ranasinghe', 'History', 'ordinary-level', 'Sinhala', 'O/L History Lecturer', 11, { rating: 4.7, students: 2900 }),
  L('buddhika-silva', 'Buddhika Silva', 'ICT', 'ordinary-level', 'Sinhala', 'O/L ICT Lecturer', 8, { rating: 4.8, students: 3300 }),
  L('renuka-amarasinghe', 'Renuka Amarasinghe', 'Commerce', 'ordinary-level', 'Sinhala', 'O/L Commerce Lecturer', 12, { rating: 4.8, students: 2700 }),
  L('vishaka-nanayakkara', 'Vishaka Nanayakkara', 'Mathematics', 'ordinary-level', 'English', 'O/L Mathematics — English Medium', 9, { rating: 4.8, students: 2200 }),
]

export const lecturerById = (id) => lecturers.find((l) => l.id === id)
export const lecturersOf = (streamId) => lecturers.filter((l) => l.stream === streamId)

/* ------------------------------------------------------------------ */
/* Home page copy                                                      */
/* ------------------------------------------------------------------ */

export const stats = [
  { value: 48, suffix: '+', label: 'Lecturer panel' },
  { value: 12500, suffix: '+', label: 'Success stories' },
  { value: 24, suffix: '+', label: 'Years of teaching excellence' },
  { value: 98, suffix: '%', label: 'Satisfaction rate' },
]

/* ------------------------------------------------------------------ */
/* Result posters — the auto-scrolling congratulations rail            */
/* ------------------------------------------------------------------ */

/**
 * Demo data. Each entry renders as one designed poster in the results
 * marquee; `variant` picks the layout. Replace with real results (and get
 * each student's consent) before launch.
 */
export const results = [
  {
    id: 'r1',
    variant: 'island',
    exam: 'Advanced Level',
    year: '2025',
    rank: 'Island 1st',
    name: 'Hasini Wickramasinghe',
    index: '6781330',
    district: 'Anuradhapura',
    stream: 'Science Stream',
    tone: 'gold',
  },
  {
    id: 'r2',
    variant: 'grades',
    exam: 'Advanced Level',
    year: '2025',
    name: 'Sahan Gunawardena',
    index: '3059588',
    district: 'Colombo',
    stream: 'Commerce Stream',
    grades: [
      ['Accounting', 'A'],
      ['Business Studies', 'A'],
      ['Economics', 'A'],
    ],
    zScore: '2.5188',
    note: 'District rank 05',
  },
  {
    id: 'r3',
    variant: 'district',
    exam: 'Advanced Level',
    year: '2025',
    rank: 'District 1st',
    name: 'Yasiru Ekanayake',
    district: 'Colombo',
    stream: 'Technology Stream',
    subject: 'Engineering Technology',
    tone: 'green',
  },
  {
    id: 'r4',
    variant: 'toppers',
    exam: 'Advanced Level',
    year: '2025',
    title: 'Top rankers',
    subtitle: 'Science Stream · island-wide',
    people: [
      { rank: '01', name: 'H. Wickramasinghe', district: 'Anuradhapura' },
      { rank: '02', name: 'M. Rathnayake', district: 'Kandy' },
      { rank: '04', name: 'S. Gunawardena', district: 'Colombo' },
      { rank: '05', name: 'K. Dissanayake', district: 'Galle' },
      { rank: '07', name: 'T. Fernando', district: 'Gampaha' },
      { rank: '09', name: 'N. Bandara', district: 'Kurunegala' },
    ],
  },
  {
    id: 'r5',
    variant: 'ol',
    exam: 'Ordinary Level',
    year: '2025',
    passes: '9A',
    name: 'Oneli Jayasuriya',
    district: 'Gampaha',
    detail: 'Nine A passes · all subjects',
  },
  {
    id: 'r6',
    variant: 'island',
    exam: 'Advanced Level',
    year: '2024',
    rank: 'Island 7th',
    name: 'Movindu Rathnayake',
    index: '6702914',
    district: 'Kandy',
    stream: 'Science Stream',
    tone: 'silver',
  },
  {
    id: 'r7',
    variant: 'batch',
    exam: 'Advanced Level',
    year: '2025',
    stat: '68%',
    label: 'of our A/L batch passed with 3A',
    detail: 'Against a national average of 6.4%',
  },
  {
    id: 'r8',
    variant: 'grades',
    exam: 'Advanced Level',
    year: '2025',
    name: 'Ishani Perera',
    index: '4418207',
    district: 'Matara',
    stream: 'Science Stream',
    grades: [
      ['Biology', 'A'],
      ['Physics', 'A'],
      ['Chemistry', 'A'],
    ],
    zScore: '2.4471',
    note: 'Medical faculty selection',
  },
  {
    id: 'r9',
    variant: 'district',
    exam: 'Ordinary Level',
    year: '2025',
    rank: 'District 2nd',
    name: 'Dulaj Senanayake',
    district: 'Kurunegala',
    stream: 'Grade 11',
    subject: 'Mathematics · A',
    tone: 'green',
  },
  {
    id: 'r10',
    variant: 'batch',
    exam: 'All streams',
    year: '2025',
    stat: '1,240',
    label: 'students entered a state university',
    detail: 'From every one of the 25 districts',
  },
]

export const testimonials = [
  {
    id: 't1',
    name: 'Hasini Wickramasinghe',
    role: 'A/L 2025 — Science Stream',
    quote:
      'I joined Gurukela in Grade 12 from Anuradhapura and never travelled to Colombo for a single class. The ' +
      'revision papers and the marking notes are what moved me from a B to an A in chemistry.',
  },
  {
    id: 't2',
    name: 'Sahan Gunawardena',
    role: 'A/L 2025 — Commerce Stream',
    quote:
      'Accounting finally made sense when I could rewind the lesson. Three replays sounds small, but re-watching ' +
      'the hard twenty minutes twice before the paper changed everything.',
  },
  {
    id: 't3',
    name: 'Oneli Jayasuriya',
    role: 'O/L 2025 — Gampaha',
    quote:
      'The tutes came home by courier every month, so my parents could see exactly what I was studying. My maths ' +
      'teacher answered my message at 9 p.m. the night before the paper.',
  },
  {
    id: 't4',
    name: 'Yasiru Ekanayake',
    role: 'A/L 2025 — Technology',
    quote:
      'There is almost no Engineering Technology support outside the big cities. Gurukela gave me a lecturer who ' +
      'actually works in the field, and a one-to-one slot whenever I needed one.',
  },
]

export const heroSlides = [
  {
    id: 'h1',
    art: 'classroom',
    kicker: 'Enrolments open · 2027 A/L theory',
    title: 'Sri Lanka’s classroom, wherever you are.',
    text:
      'Live lessons from the island’s most experienced lecturer panel — Science, Technology, Commerce and ' +
      'Ordinary Level, all behind one login.',
    cta: { label: 'See the lecturer panel', to: '/lecturers' },
    alt: { label: 'How Gurukela works', to: '/about' },
  },
  {
    id: 'h2',
    art: 'trial',
    kicker: 'Free trial week',
    title: 'Sit the first week of any class free.',
    text:
      'Pick a lecturer, join the live lesson, take the tute. Pay only if you want to stay for the month — no card ' +
      'needed to try.',
    cta: { label: 'Start the free week', to: '/campaign' },
    alt: { label: 'Browse subjects', to: '/lecturers' },
  },
  {
    id: 'h3',
    art: 'delivery',
    kicker: 'Island-wide tute delivery',
    title: 'Your tutes arrive before the lesson does.',
    text:
      'Printed, full-colour and couriered to every district, so nobody studies from a blurry photograph of ' +
      'somebody else’s notes again.',
    cta: { label: 'Talk to us', to: '/contact' },
    alt: { label: 'Read the guidelines', to: '/guidelines' },
  },
]

/* ------------------------------------------------------------------ */
/* Campaign flyers                                                     */
/* ------------------------------------------------------------------ */

export const campaigns = [
  {
    id: 'free-week',
    art: 'trial',
    badge: 'Free',
    title: 'Free Trial Week',
    subtitle: 'Every stream · every lecturer',
    detail: 'Join any class free for seven days. Live lessons, the tute and one model paper included — decide afterwards.',
    period: 'Open all year',
    price: 'Rs. 0',
    was: null,
  },
  {
    id: 'al-2027-theory',
    art: 'theory',
    badge: 'New batch',
    title: 'A/L 2027 Theory Batch',
    subtitle: 'Science · Technology · Commerce',
    detail: 'The full syllabus from chapter one, twice a week, with monthly tutes and a marked paper every month.',
    period: 'Starts 6 January',
    price: 'Rs. 2,500 / month',
    was: 'Rs. 3,000',
  },
  {
    id: 'ol-2026-revision',
    art: 'revision',
    badge: 'Revision',
    title: 'O/L 2026 Revision',
    subtitle: 'Mathematics · Science · English',
    detail: 'Chapter-by-chapter revision with a timed paper every Sunday and marking notes the same week.',
    period: 'March — November',
    price: 'Rs. 1,800 / month',
    was: 'Rs. 2,400',
  },
  {
    id: 'scholarship',
    art: 'scholarship',
    badge: 'Scholarship',
    title: 'Gurukela Merit Scholarship',
    subtitle: '100 fully-funded seats',
    detail: 'Sit one aptitude paper. The top hundred students study free for a full year, tutes and papers included.',
    period: 'Applications close 28 February',
    price: 'Fully funded',
    was: null,
  },
  {
    id: 'paper-marathon',
    art: 'paper',
    badge: 'Paper class',
    title: 'Past Paper Marathon',
    subtitle: 'A/L 2026 sitting',
    detail: 'Twenty past papers in ten weeks, discussed question by question with the marking scheme on screen.',
    period: 'Weekends · 8.00 a.m.',
    price: 'Rs. 3,200 / month',
    was: 'Rs. 4,000',
  },
  {
    id: 'free-seminar',
    art: 'seminar',
    badge: 'Free seminar',
    title: 'Island-wide Free Seminar',
    subtitle: 'Chemistry · Organic reactions',
    detail: 'A three-hour open seminar with Rohana Wickramasinghe, streamed free to every district. Recording open for a week.',
    period: '14 February · 2.00 p.m.',
    price: 'Free',
    was: null,
  },
]

/* ------------------------------------------------------------------ */
/* How it works                                                        */
/* ------------------------------------------------------------------ */

export const steps = [
  { n: '01', title: 'Create your account', text: 'Register with your phone number and verify the OTP. One account carries you from Grade 6 to A/L.' },
  { n: '02', title: 'Choose your lecturers', text: 'Filter the panel by stream, subject and medium, then read the profile before you commit to anyone.' },
  { n: '03', title: 'Pay for the month', text: 'Card, bank transfer or eZ Cash. Access opens the moment the payment clears — no waiting for approval.' },
  { n: '04', title: 'Learn and be marked', text: 'Attend live, re-watch up to three times, submit your paper and get it back marked by the lecturer who taught it.' },
]

/* ------------------------------------------------------------------ */
/* About                                                               */
/* ------------------------------------------------------------------ */

export const about = {
  founder: {
    name: 'Rohana Wickramasinghe',
    role: 'Founder & Chief Chemistry Lecturer',
    text:
      'Gurukela was founded by Rohana Wickramasinghe, a chemistry lecturer with more than twenty years inside Sri ' +
      'Lankan classrooms, who has helped thousands of Advanced Level students win state university places. ' +
      'Gurukela began with one question he kept hearing from parents outside Colombo: why should a child’s ' +
      'postcode decide which lecturer they get?',
  },
  vision:
    'A Sri Lanka where the quality of a student’s teaching is decided by their effort — never by the district they ' +
    'happened to be born in.',
  mission:
    'To put the island’s most experienced lecturers in front of every student who wants them — live, affordable ' +
    'and accountable — and to give parents an honest view of the progress they are paying for.',
  values: [
    { title: 'Innovation through collaboration', text: 'Our motto. Lecturers build the syllabus plan together instead of each guarding their own notes.' },
    { title: 'Teach, then prove it', text: 'Every subject ends in a marked paper. If the mark is not moving, the teaching plan changes.' },
    { title: 'Honest pricing', text: 'One monthly fee per subject. No admission trap, no compulsory bundles, no surprise seminar charges.' },
    { title: 'Reachable humans', text: 'A named coordinator for every batch, answering on WhatsApp during working hours — not a ticket queue.' },
  ],
  timeline: [
    { year: '2019', text: 'The first online chemistry batch runs for forty students during the Colombo transport strikes.' },
    { year: '2021', text: 'The panel opens to Physics, Biology and Combined Mathematics; island-wide tute delivery begins.' },
    { year: '2023', text: 'Commerce and Technology streams are added. The Gurukela LMS replaces ad-hoc Zoom links.' },
    { year: '2025', text: 'Ordinary Level launches for Grades 6–11; 12,500 students have now sat an exam with us.' },
    { year: '2026', text: 'The merit scholarship programme begins funding a hundred free seats a year.' },
  ],
}

/* ------------------------------------------------------------------ */
/* Legal pages                                                         */
/* ------------------------------------------------------------------ */

export const legal = {
  terms: {
    title: 'Terms & Conditions',
    updated: '1 January 2026',
    intro:
      'These terms govern your use of gurukela.lk and the Gurukela learning management system. By registering for ' +
      'a class you accept them for the whole period of your subscription.',
    sections: [
      {
        heading: 'Registration and fees',
        items: [
          'Registration must be completed before you can access any class.',
          'Mass classes and group classes carry separate admission fees, payable once at enrolment.',
          'Class fees are charged monthly and fall due before the first lesson of that month.',
          'Fees are non-refundable once the payment has been processed, except as set out in the Refund Policy.',
        ],
      },
      {
        heading: 'Access and account security',
        items: [
          'The online access given to you by the platform authorises a single user only.',
          'Sharing your login, your screen or a class link with another person is prohibited and ends your access without refund.',
          'You are responsible for keeping your password secure and for all activity under your account.',
          'Access is granted for educational purposes only; any other use is forbidden.',
        ],
      },
      {
        heading: 'Class content',
        items: [
          'You receive up to three access attempts for each class recording or video.',
          'A technical failure during playback counts as one used attempt; contact support the same day if this happens and it is restored.',
          'You are strongly prohibited from downloading, copying, altering, distorting or redistributing any class material.',
          'Screen recording, re-streaming and photographing tutes for distribution are all treated as distribution.',
        ],
      },
      {
        heading: 'Conduct in class',
        items: [
          'Join with your real name so the lecturer can mark your attendance.',
          'Keep your microphone muted unless the lecturer invites you to speak.',
          'Chat is for the lesson. Abusive, commercial or off-topic messages remove you from the class.',
          'Impersonating a lecturer or a member of staff ends your account immediately.',
        ],
      },
      {
        heading: 'Intellectual property',
        items: [
          'All lessons, recordings, tutes, papers and marking schemes are the copyrighted property of Gurukela.',
          'Violations are pursued under the Intellectual Property Act No. 36 of 2003 of Sri Lanka.',
        ],
      },
    ],
  },

  privacy: {
    title: 'Privacy Policy',
    updated: '1 January 2026',
    intro:
      'This policy explains what Gurukela collects when you use gurukela.lk, why we collect it, and what you can ' +
      'ask us to do with it.',
    sections: [
      {
        heading: 'What we collect',
        items: [
          'Account details: name, phone number, email address, district, grade and stream.',
          'Payment records: the amount, date, method and reference of each payment. Card numbers are handled by the payment gateway and never reach our servers.',
          'Learning records: attendance, replay counts, paper submissions and marks.',
          'Technical data: device type, browser and IP address, used to keep single-user access honest.',
        ],
      },
      {
        heading: 'Why we collect it',
        items: [
          'To give you the classes you paid for, and to keep that access to one user.',
          'To send timetable changes, payment reminders and exam notices by SMS or WhatsApp.',
          'To show you, and your parent or guardian, an accurate progress record.',
          'To meet our accounting and tax obligations in Sri Lanka.',
        ],
      },
      {
        heading: 'Who we share it with',
        items: [
          'Your lecturer sees your name, attendance and marks for their own class only.',
          'Payment gateways and the courier handling tute delivery receive only what they need to complete that task.',
          'We do not sell, rent or trade student data to anyone, at any price.',
        ],
      },
      {
        heading: 'Students under eighteen',
        items: [
          'A parent or guardian must register the account for any student under eighteen.',
          'Guardians may request a copy of the full learning record at any time.',
        ],
      },
      {
        heading: 'Your choices',
        items: [
          'Ask us for a copy of your data, or for a correction, by writing to hello@gurukela.lk.',
          'You may ask for your account to be deleted once your final payment is settled; accounting records are kept for as long as the law requires.',
          'You can opt out of promotional messages and still receive class and payment notices.',
        ],
      },
    ],
  },

  refund: {
    title: 'Refund Policy',
    updated: '1 January 2026',
    intro:
      'Please read this before you pay. Gurukela does not process refunds once a payment has been made, apart from ' +
      'the limited situations set out below.',
    sections: [
      {
        heading: 'The general rule',
        items: [
          'Once you have made a payment, a refund cannot be processed.',
          'Where you have paid more than the required fee, the excess amount is refunded to you.',
        ],
      },
      {
        heading: 'What is never refunded',
        items: [
          'Registration and admission fees.',
          'Advance payments made to hold a seat in a batch.',
          'Payments made to unlock previously recorded programmes, once that access has opened.',
        ],
      },
      {
        heading: 'Transfers instead of refunds',
        items: [
          'Contact support and a payment can usually be transferred to another course, another month, or another student in the same family.',
          'Transfers must be requested before the second lesson of the month you paid for.',
        ],
      },
      {
        heading: 'How long a refund takes',
        items: [
          'An applicable refund is processed within seven business days of us receiving your complaint.',
          'Your bank or card provider may take further time to show the money in your account.',
          'Refunds return to the method you paid with; we cannot pay a card refund into a different account.',
        ],
      },
    ],
  },

  guidelines: {
    title: 'LMS Guidelines',
    updated: '1 January 2026',
    intro:
      'A short guide to getting the most out of the Gurukela LMS, from your first login to the night before the paper.',
    sections: [
      {
        heading: 'Guideline 01 — Before your first class',
        items: [
          'Log in at least fifteen minutes early and check your camera, microphone and connection.',
          'Download the tute for the lesson from the class page and keep it printed or open beside you.',
          'Use a laptop or tablet where you can. The LMS works on a phone, but submitting a paper is easier on a bigger screen.',
        ],
      },
      {
        heading: 'Guideline 02 — During the lesson',
        items: [
          'Join with your real name so your attendance is recorded.',
          'Keep your microphone muted and use the raise-hand button to ask a question.',
          'Do not share the class link. One login is one student, and shared logins are disabled automatically.',
        ],
      },
      {
        heading: 'Guideline 03 — Recordings and replays',
        items: [
          'Each recording plays three times. Plan them: one right after class, one before the paper.',
          'If playback fails through a fault on our side, message support the same day and the attempt is restored.',
          'Recordings expire at the end of the month they belong to.',
        ],
      },
      {
        heading: 'Guideline 04 — Papers and marking',
        items: [
          'Submit answer scripts as a single clear PDF, or as photographs taken in good light.',
          'Marked scripts return within seven days with written notes from your lecturer.',
          'Marks appear on your dashboard, where a parent or guardian can see them too.',
        ],
      },
      {
        heading: 'Guideline 05 — Getting help',
        items: [
          `Technical problems and tute delivery: ${contact.tuteLine}.`,
          `Complaints and suggestions: ${contact.complaintsLine}.`,
          'Your batch coordinator answers on WhatsApp between 8.00 a.m. and 8.00 p.m.',
        ],
      },
    ],
  },
}

export const faqs = [
  {
    q: 'Do I need to travel to the office for anything?',
    a: 'No. Every class, paper and mark is online. The office is there if you would rather hand in cash or collect tutes yourself, but nothing requires it.',
  },
  {
    q: 'What internet speed do I need?',
    a: 'A steady 2 Mbps connection carries the live class. If your connection drops the recording covers you — and a drop on our side does not cost you a replay.',
  },
  {
    q: 'Can I join a batch in the middle of the year?',
    a: 'Yes. You get the recordings of the lessons already covered that month, so you can catch up before the next live class.',
  },
  {
    q: 'How are the tutes delivered?',
    a: 'By courier to your home address, island-wide, before the lesson they belong to. Delivery is included in the monthly fee.',
  },
  {
    q: 'Can my parents see my progress?',
    a: 'Yes. Attendance, replay counts and paper marks sit on one dashboard, and you can add a guardian’s number for the monthly summary.',
  },
  {
    q: 'What happens if I miss a payment?',
    a: 'Access pauses at the start of the next month rather than mid-lesson. Settle the fee and it opens again immediately — your recordings and marks are kept.',
  },
]
