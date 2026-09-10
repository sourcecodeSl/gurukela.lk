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
  tagline: {
    en: 'Online academy for the modern generation',
    si: 'නවීන පරපුරට ඔන්ලයින් ආයතනයක්',
  },
  motto: {
    en: 'Innovation through collaboration',
    si: 'සහයෝගීතාවෙන් නවෝත්පාදනය',
  },
  intro: {
    en:
      'Sri Lanka’s island-wide online classroom for Ordinary Level and Advanced Level students: live lessons, ' +
      'recorded revision, PDF tutes inside the LMS and a lecturer panel certified across every stream.',
    si:
      'සාමාන්‍ය පෙළ හා උසස් පෙළ ශිෂ්‍යයන් සඳහා දිවයින පුරා විහිදුණු ඔන්ලයින් පන්ති කාමරය: සජීවී පාඩම්, ' +
      'පටිගත කළ පුනරීක්ෂණ, LMS තුළ PDF ටියුට් සහ සෑම ධාරාවකටම සුදුසුකම් ලත් ගුරු මණ්ඩලයක්.',
  },
}

/**
 * TODO — replace every value here with Gurukela's own details before launch.
 * These are deliberate placeholders: nothing on this site may carry another
 * academy's address, hotlines, WhatsApp number or social accounts.
 */
export const contact = {
  address: { en: 'Colombo, Sri Lanka', si: 'කොළඹ, ශ්‍රී ලංකාව' },
  phones: ['+94 11 000 0000', '+94 77 000 0000'],
  tuteLine: '+94 11 000 0001',
  complaintsLine: '+94 11 000 0002',
  email: 'hello@gurukela.lk',
  whatsapp: '94110000000',
  hours: {
    en: 'Monday – Saturday · 8.00 a.m. to 8.00 p.m.',
    si: 'සඳුදා – සෙනසුරාදා · පෙ.ව. 8.00 සිට ප.ව. 8.00 දක්වා',
  },
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
    name: { en: 'A/L Science Stream', si: 'උසස් පෙළ විද්‍යා අංශය' },
    level: { en: 'Advanced Level', si: 'උසස් පෙළ' },
    blurb: {
      en: 'Biology, Physics, Chemistry and Combined Mathematics, theory through revision.',
      si: 'ජීව විද්‍යාව, භෞතික විද්‍යාව, රසායන විද්‍යාව සහ සංයුක්ත ගණිතය, න්‍යායේ සිට පුනරීක්ෂණය දක්වා.',
    },
    subjects: ['Biology', 'Physics', 'Chemistry', 'Combined Mathematics', 'Agriculture'],
  },
  {
    id: 'al-technology',
    short: 'Technology',
    name: { en: 'A/L Technology Stream', si: 'උසස් පෙළ තාක්ෂණ අංශය' },
    level: { en: 'Advanced Level', si: 'උසස් පෙළ' },
    blurb: {
      en: 'Engineering & Bio-systems Technology, Science for Technology and ICT.',
      si: 'ඉංජිනේරු හා ජෛව පද්ධති තාක්ෂණය, තාක්ෂණය සඳහා විද්‍යාව සහ තොරතුරු තාක්ෂණය.',
    },
    subjects: ['Engineering Technology', 'Bio-systems Technology', 'Science for Technology', 'ICT'],
  },
  {
    id: 'al-commerce',
    short: 'Commerce',
    name: { en: 'A/L Commerce Stream', si: 'උසස් පෙළ වාණිජ අංශය' },
    level: { en: 'Advanced Level', si: 'උසස් පෙළ' },
    blurb: {
      en: 'Accounting, Business Studies, Economics and B.S.T. with weekly paper practice.',
      si: 'ගිණුම්කරණය, ව්‍යාපාර අධ්‍යයනය, ආර්ථික විද්‍යාව සහ ව්‍යාපාර සංඛ්‍යානය, සතිපතා ප්‍රශ්න පත්‍ර පුහුණුව සමඟ.',
    },
    subjects: ['Accounting', 'Business Studies', 'Economics', 'Business Statistics'],
  },
  {
    id: 'ordinary-level',
    short: 'O/L',
    name: { en: 'Ordinary Level', si: 'සාමාන්‍ය පෙළ' },
    level: { en: 'Grade 6 to 11', si: '6 සිට 11 ශ්‍රේණි' },
    blurb: {
      en: 'Mathematics, Science, English, Sinhala, History, ICT and Commerce.',
      si: 'ගණිතය, විද්‍යාව, ඉංග්‍රීසි, සිංහල, ඉතිහාසය, තොරතුරු තාක්ෂණය සහ වාණිජ්‍යය.',
    },
    subjects: ['Mathematics', 'Science', 'English', 'Sinhala', 'History', 'ICT', 'Commerce'],
  },
  {
    id: 'other',
    short: 'Other',
    name: { en: 'Other Courses', si: 'වෙනත් පාඨමාලා' },
    level: { en: 'Language & professional', si: 'භාෂා හා වෘත්තීය' },
    blurb: {
      en: 'IELTS, PTE Pearson, Edexcel and Cambridge, spoken English and professional certificates.',
      si: 'IELTS, PTE Pearson, Edexcel හා Cambridge, කථන ඉංග්‍රීසි සහ වෘත්තීය සහතික පත්‍ර.',
    },
    subjects: ['IELTS', 'PTE Pearson', 'Edexcel', 'Cambridge IGCSE', 'Spoken English', 'Business English'],
  },
]

export const streamById = (id) => streams.find((s) => s.id === id)

/* ------------------------------------------------------------------ */
/* Lecturer panel                                                      */
/* ------------------------------------------------------------------ */

/* The lecturer panel is no longer hard-coded. The public site reads the
 * academy's real registered instructors from the API — see
 * LecturersContext.jsx (GET /instructors, joined with /subjects and /modules). */

/* ------------------------------------------------------------------ */
/* Home page copy                                                      */
/* ------------------------------------------------------------------ */

export const stats = [
  { value: 48, suffix: '+', label: { en: 'Lecturer panel', si: 'ගුරු මණ්ඩලය' } },
  { value: 12500, suffix: '+', label: { en: 'Success stories', si: 'සාර්ථක කතා' } },
  { value: 24, suffix: '+', label: { en: 'Years of teaching excellence', si: 'ඉගැන්වීමේ වසර' } },
  { value: 98, suffix: '%', label: { en: 'Satisfaction rate', si: 'තෘප්තිමත් අනුපාතය' } },
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
    role: 'A/L 2025 · Science Stream',
    quote:
      'I joined Gurukela in Grade 12 from Anuradhapura and never travelled to Colombo for a single class. The ' +
      'revision papers and the marking notes are what moved me from a B to an A in chemistry.',
  },
  {
    id: 't2',
    name: 'Sahan Gunawardena',
    role: 'A/L 2025 · Commerce Stream',
    quote:
      'Accounting finally made sense when I could rewind the lesson. Three replays sounds small, but re-watching ' +
      'the hard twenty minutes twice before the paper changed everything.',
  },
  {
    id: 't3',
    name: 'Oneli Jayasuriya',
    role: 'O/L 2025 · Gampaha',
    quote:
      'Every tute was in the LMS as a PDF the same day, so my parents could see exactly what I was studying. My ' +
      'maths teacher answered my message at 9 p.m. the night before the paper.',
  },
  {
    id: 't4',
    name: 'Yasiru Ekanayake',
    role: 'A/L 2025 · Technology',
    quote:
      'There is almost no Engineering Technology support outside the big cities. Gurukela gave me a lecturer who ' +
      'actually works in the field, and a one-to-one slot whenever I needed one.',
  },
]

export const heroSlides = [
  {
    id: 'h1',
    art: 'classroom',
    kicker: { en: 'Enrolments open · 2027 A/L theory', si: 'ලියාපදිංචිය විවෘතයි · 2027 උ.පෙළ න්‍යාය' },
    title: { en: 'Sri Lanka’s classroom, wherever you are.', si: 'ඔබ කොහේ සිටියත්, ශ්‍රී ලංකාවේ පන්ති කාමරය.' },
    text: {
      en:
        'Live lessons from the island’s most experienced lecturer panel: Science, Technology, Commerce and ' +
        'Ordinary Level, all behind one login.',
      si: 'සජීවී පාඩම් දිවයිනේ වඩාත්ම පළපුරුදු ගුරු මණ්ඩලයෙන්: විද්‍යා, තාක්ෂණ, වාණිජ සහ සාමාන්‍ය පෙළ, සියල්ල එකම පිවිසුමකින්.',
    },
    cta: { label: { en: 'See the lecturer panel', si: 'ගුරු මණ්ඩලය බලන්න' }, to: '/lecturers' },
    alt: { label: { en: 'How Gurukela works', si: 'Gurukela ක්‍රියා කරන ආකාරය' }, to: '/about' },
  },
  {
    id: 'h3',
    art: 'lms',
    kicker: { en: 'Integrated LMS', si: 'ඒකාබද්ධ LMS' },
    title: {
      en: 'Instant access to all your tutes.',
      si: 'ඔබේ සියලු ටියුට් වහාම අතේ.',
    },
    text: {
      en:
        'Access high-quality PDF notes directly through our Learning Management System. No more waiting for ' +
        'deliveries. Download and study instantly from any device.',
      si: 'අපගේ ඉගෙනුම් කළමනාකරණ පද්ධතිය හරහා උසස් තත්ත්වයේ PDF සටහන් වෙත කෙලින්ම පිවිසෙන්න. බෙදාහැරීමක් බලාගෙන සිටීමක් නැත. ඕනෑම උපාංගයකින් වහාම බාගත කර ඉගෙන ගන්න.',
    },
    cta: { label: { en: 'Talk to us', si: 'අප හා කතා කරන්න' }, to: '/contact' },
    alt: { label: { en: 'Read the guidelines', si: 'මාර්ගෝපදේශ කියවන්න' }, to: '/guidelines' },
  },
]

/* ------------------------------------------------------------------ */
/* Campaign flyers                                                     */
/* ------------------------------------------------------------------ */

export const campaigns = [
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
    period: 'March to November',
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
  { n: '01', title: { en: 'Create your account', si: 'ඔබේ ගිණුම සාදන්න' }, text: { en: 'Register with your phone number and verify the OTP. One account carries you from Grade 6 to A/L.', si: 'දුරකථන අංකයෙන් ලියාපදිංචි වී OTP කේතය තහවුරු කරන්න. 6 ශ්‍රේණියේ සිට උසස් පෙළ දක්වා එකම ගිණුමකි.' } },
  { n: '02', title: { en: 'Choose your lecturers', si: 'ගුරුවරු තෝරන්න' }, text: { en: 'Filter the panel by stream, subject and medium, then read the profile before you commit to anyone.', si: 'ධාරාව, විෂය හා මාධ්‍යය අනුව පෙරහන් කර, තෝරා ගැනීමට පෙර ගුරුවරයාගේ විස්තර කියවන්න.' } },
  { n: '03', title: { en: 'Pay for the month', si: 'මාසය සඳහා ගෙවන්න' }, text: { en: 'Card, bank transfer or eZ Cash. Access opens the moment the payment clears. No waiting for approval.', si: 'කාඩ්පත, බැංකු හුවමාරුව හෝ eZ Cash. ගෙවීම සම්පූර්ණ වූ සැණින් ප්‍රවේශය විවෘත වේ. අනුමැතියක් බලාගෙන සිටීමක් නැත.' } },
  { n: '04', title: { en: 'Learn and be marked', si: 'ඉගෙන ගෙන ලකුණු ලබා ගන්න' }, text: { en: 'Attend live, re-watch up to three times, submit your paper and get it back marked by the lecturer who taught it.', si: 'සජීවීව සහභාගී වන්න, තුන් වතාවක් නැවත බලන්න, ප්‍රශ්න පත්‍රය ඉදිරිපත් කර උගැන්වූ ගුරුවරයාගෙන්ම ලකුණු ලබා ගන්න.' } },
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
  problem: {
    title: 'The gap we bridge',
    paras: [
      'Every week, thousands of O/L and A/L students miss crucial school or tuition lectures due to illness, ' +
        'sports, or family commitments. In mass tuition classes with hundreds of students, re-watching a ' +
        '4-hour video isn’t always enough, and asking questions is almost impossible.',
      'We built Gurukela to bridge this exact gap. Instead of paying for full monthly courses or struggling ' +
        'alone, students can instantly book 1-on-1 micro-sessions with top talented teachers to master the ' +
        'exact lesson unit they missed.',
    ],
  },
  vision:
    'To become the leading on-demand learning network that transforms how students catch up, review, and excel ' +
    'in high-stakes exams.',
  mission:
    'To ensure no student falls behind by making targeted, personal lesson recovery accessible, affordable and ' +
    'instant for every learner.',
  values: [
    { title: 'Innovation through collaboration', text: 'Our motto. Lecturers build the syllabus plan together instead of each guarding their own notes.' },
    { title: 'Teach, then prove it', text: 'Every subject ends in a marked paper. If the mark is not moving, the teaching plan changes.' },
    { title: 'Honest pricing', text: 'One monthly fee per subject. No admission trap, no compulsory bundles, no surprise seminar charges.' },
    { title: 'Reachable humans', text: 'A named coordinator for every batch, answering on WhatsApp during working hours, not a ticket queue.' },
  ],
  timeline: [
    { year: '2019', text: 'The first online chemistry batch runs for forty students during the Colombo transport strikes.' },
    { year: '2021', text: 'The panel opens to Physics, Biology and Combined Mathematics; every tute moves into the LMS as a PDF.' },
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
          'Payment gateways receive only what they need to complete that transaction.',
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
        heading: 'Guideline 01: Before your first class',
        items: [
          'Log in at least fifteen minutes early and check your camera, microphone and connection.',
          'Download the lesson’s PDF tute from the class page and keep it open beside you, or print your own copy.',
          'Use a laptop or tablet where you can. The LMS works on a phone, but submitting a paper is easier on a bigger screen.',
        ],
      },
      {
        heading: 'Guideline 02: During the lesson',
        items: [
          'Join with your real name so your attendance is recorded.',
          'Keep your microphone muted and use the raise-hand button to ask a question.',
          'Do not share the class link. One login is one student, and shared logins are disabled automatically.',
        ],
      },
      {
        heading: 'Guideline 03: Recordings and replays',
        items: [
          'Each recording plays three times. Plan them: one right after class, one before the paper.',
          'If playback fails through a fault on our side, message support the same day and the attempt is restored.',
          'Recordings expire at the end of the month they belong to.',
        ],
      },
      {
        heading: 'Guideline 04: Papers and marking',
        items: [
          'Submit answer scripts as a single clear PDF, or as photographs taken in good light.',
          'Marked scripts return within seven days with written notes from your lecturer.',
          'Marks appear on your dashboard, where a parent or guardian can see them too.',
        ],
      },
      {
        heading: 'Guideline 05: Getting help',
        items: [
          `Technical problems and LMS access: ${contact.tuteLine}.`,
          `Complaints and suggestions: ${contact.complaintsLine}.`,
          'Your batch coordinator answers on WhatsApp between 8.00 a.m. and 8.00 p.m.',
        ],
      },
    ],
  },
}

export const faqs = [
  {
    q: { en: 'Do I need to travel to the office for anything?', si: 'කිසිවකට කාර්යාලයට යාමට අවශ්‍යද?' },
    a: {
      en: 'No. Every class, paper and mark is online. The office is there if you would rather hand in cash or collect tutes yourself, but nothing requires it.',
      si: 'නැත. සෑම පන්තියක්ම, ප්‍රශ්න පත්‍රයක්ම හා ලකුණු ඔන්ලයින්. මුදල් අතින් භාර දීමට හෝ ටියුට් තමන්ම ගැනීමට කැමති නම් කාර්යාලය තිබේ, නමුත් එය අවශ්‍ය නොවේ.',
    },
  },
  {
    q: { en: 'What internet speed do I need?', si: 'අන්තර්ජාල වේගය කොපමණ අවශ්‍යද?' },
    a: {
      en: 'A steady 2 Mbps connection carries the live class. If your connection drops the recording covers you, and a drop on our side does not cost you a replay.',
      si: 'ස්ථාවර 2 Mbps සම්බන්ධතාවයකින් සජීවී පන්තිය ධාවනය වේ. සම්බන්ධතාවය කැඩුණොත් පටිගත කිරීම තිබේ; අපගේ පැත්තෙන් ඇති වූ බාධාවක් නිසා නැවත බැලීමක් අහිමි නොවේ.',
    },
  },
  {
    q: { en: 'Can I join a batch in the middle of the year?', si: 'වසර මැදදී කණ්ඩායමකට එකතු විය හැකිද?' },
    a: {
      en: 'Yes. You get the recordings of the lessons already covered that month, so you can catch up before the next live class.',
      si: 'ඔව්. එම මාසයේ දැනටමත් ආවරණය කළ පාඩම්වල පටිගත කිරීම් ලැබේ, එබැවින් ඊළඟ සජීවී පන්තියට පෙර සමාන විය හැක.',
    },
  },
  {
    q: { en: 'How do I get the tutes?', si: 'ටියුට් ලබා ගන්නේ කෙසේද?' },
    a: {
      en: 'As PDFs in the LMS, on the class page, before the lesson they belong to. Download them to any device. They are included in the monthly fee.',
      si: 'LMS එකේ පන්ති පිටුවේ PDF ලෙස, අදාළ පාඩමට පෙර. ඕනෑම උපාංගයකට බාගත කරගත හැක. මාසික ගාස්තුවට ඇතුළත් වේ.',
    },
  },
  {
    q: { en: 'Can my parents see my progress?', si: 'මගේ දෙමාපියන්ට ප්‍රගතිය බලාගත හැකිද?' },
    a: {
      en: 'Yes. Attendance, replay counts and paper marks sit on one dashboard, and you can add a guardian’s number for the monthly summary.',
      si: 'ඔව්. පැමිණීම, නැවත බැලීම් ගණන හා ප්‍රශ්න පත්‍ර ලකුණු එකම පුවරුවක තිබේ; මාසික සාරාංශය සඳහා භාරකරුවෙකුගේ අංකයක්ද එක් කළ හැක.',
    },
  },
  {
    q: { en: 'What happens if I miss a payment?', si: 'ගෙවීමක් අතපසු වුවහොත් කුමක් වේද?' },
    a: {
      en: 'Access pauses at the start of the next month rather than mid-lesson. Settle the fee and it opens again immediately; your recordings and marks are kept.',
      si: 'පාඩම මැදදී නොව, ඊළඟ මාසය ආරම්භයේදී ප්‍රවේශය නවතී. ගාස්තුව ගෙවූ විගස නැවත විවෘත වේ; ඔබේ පටිගත කිරීම් හා ලකුණු ආරක්ෂිතව තිබේ.',
    },
  },
]
