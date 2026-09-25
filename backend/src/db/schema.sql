-- gurukela.lk LMS schema
-- Character set: utf8mb4 throughout. Run with multipleStatements enabled.
-- Drop order respects foreign keys.

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS paper_submissions;
DROP TABLE IF EXISTS papers;
DROP TABLE IF EXISTS quiz_attempts;
DROP TABLE IF EXISTS quiz_submissions;
DROP TABLE IF EXISTS quiz_questions;
DROP TABLE IF EXISTS seminar_quizzes;
DROP TABLE IF EXISTS ads;
DROP TABLE IF EXISTS materials;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS payouts;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS slot_requests;
DROP TABLE IF EXISTS slots;
DROP TABLE IF EXISTS group_class_lessons;
DROP TABLE IF EXISTS group_classes;
DROP TABLE IF EXISTS instructor_subjects;
DROP TABLE IF EXISTS student_subjects;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS modules;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS streams;
DROP TABLE IF EXISTS instructors;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS otps;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS users;
-- Keep FK checks off through the CREATE statements below so table order does not
-- matter (e.g. lessons references instructors, which is defined later). Re-enabled
-- at the very end of this file.

-- ---------------------------------------------------------------------------
-- Auth: one row per login identity. Profile lives in instructors/students.
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id             VARCHAR(40) PRIMARY KEY,
  role           ENUM('admin','instructor','student') NOT NULL,
  email          VARCHAR(190) NOT NULL,
  phone          VARCHAR(20)  NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  phone_verified TINYINT(1) NOT NULL DEFAULT 0,
  banned         TINYINT(1) NOT NULL DEFAULT 0,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Simple key/value store for platform settings (e.g. commission_rate).
CREATE TABLE settings (
  `key`      VARCHAR(64) PRIMARY KEY,
  `value`    VARCHAR(255) NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One-time passwords for phone verification and password reset.
CREATE TABLE otps (
  id         VARCHAR(40) PRIMARY KEY,
  phone      VARCHAR(20) NOT NULL,
  code_hash  VARCHAR(255) NOT NULL,
  purpose    ENUM('verify','reset') NOT NULL,
  expires_at DATETIME NOT NULL,
  consumed   TINYINT(1) NOT NULL DEFAULT 0,
  attempts   INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_otps_phone (phone, purpose)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Admin catalogue tree: streams -> subjects -> modules(lessons) -> lessons(sub-lessons)
-- ---------------------------------------------------------------------------
CREATE TABLE streams (
  id       VARCHAR(40) PRIMARY KEY,
  name     VARCHAR(120) NOT NULL,
  color    INT,
  position INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE subjects (
  id          VARCHAR(40) PRIMARY KEY,
  stream_id   VARCHAR(40) DEFAULT NULL,  -- the stream this subject sits under
  name        VARCHAR(120) NOT NULL,
  icon        VARCHAR(40),
  color       INT,
  description VARCHAR(255),
  grade       VARCHAR(20) DEFAULT NULL,  -- O/L subjects are pinned to a grade (Grade 6-11); NULL for other streams
  CONSTRAINT fk_subjects_stream FOREIGN KEY (stream_id)
    REFERENCES streams(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE modules (
  id         VARCHAR(40) PRIMARY KEY,
  subject_id VARCHAR(40) NOT NULL,
  code       VARCHAR(40),
  name       VARCHAR(160) NOT NULL,
  level      VARCHAR(40),
  hours      INT,
  CONSTRAINT fk_modules_subject FOREIGN KEY (subject_id)
    REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sub-lessons: the per-lesson syllabus (a Lesson/module -> its sub-lessons).
-- instructor_id NULL  = admin-defined default sub-lesson, visible to everyone.
-- instructor_id SET   = a sub-lesson an instructor added for their own teaching.
CREATE TABLE lessons (
  id            VARCHAR(40) PRIMARY KEY,
  module_id     VARCHAR(40) NOT NULL,
  instructor_id VARCHAR(40) DEFAULT NULL,
  name          VARCHAR(300) NOT NULL,
  hours         INT,
  position      INT NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_lessons_module FOREIGN KEY (module_id)
    REFERENCES modules(id) ON DELETE CASCADE,
  CONSTRAINT fk_lessons_instructor FOREIGN KEY (instructor_id)
    REFERENCES instructors(id) ON DELETE CASCADE,
  KEY idx_lessons_module (module_id, position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------
CREATE TABLE instructors (
  id               VARCHAR(40) PRIMARY KEY,
  user_id          VARCHAR(40) NOT NULL,
  name             VARCHAR(160) NOT NULL,
  title            VARCHAR(160),
  degree           VARCHAR(200),
  photo_url        VARCHAR(500),
  hue              INT DEFAULT 245,
  -- Two-stage verification lifecycle:
  --   pending_basic  : just registered
  --   basic_verified : admin passed the first check; must now submit a video
  --   pending_advanced: instructor submitted a >=5min video, awaiting review
  --   verified       : admin passed the second (advanced) check
  --   rejected       : admin rejected
  verification_status ENUM('pending_basic','basic_verified','pending_advanced','verified','rejected')
                      NOT NULL DEFAULT 'pending_basic',
  video_url        VARCHAR(500),
  video_seconds    INT,
  -- Short demo clip shown on the public profile (<=100 MB). The teacher can
  -- hide it from students at any time without deleting the file.
  demo_video_url   VARCHAR(500),
  demo_video_hidden TINYINT(1) NOT NULL DEFAULT 0,
  is_active        TINYINT(1) NOT NULL DEFAULT 1,
  rating           DECIMAL(3,2) NOT NULL DEFAULT 0,
  review_count     INT NOT NULL DEFAULT 0,
  teaching_hours   INT NOT NULL DEFAULT 0,
  -- Precise accumulator behind teaching_hours, driven by live_sessions.
  teaching_minutes INT NOT NULL DEFAULT 0,
  student_count    INT NOT NULL DEFAULT 0,
  hourly_rate      INT NOT NULL DEFAULT 0,
  response_mins    INT,
  languages        JSON,
  district         VARCHAR(40),
  city             VARCHAR(80),
  experience_years INT,
  bio              TEXT,
  highlights       JSON,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_instructors_user (user_id),
  CONSTRAINT fk_instructors_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE students (
  id         VARCHAR(40) PRIMARY KEY,
  user_id    VARCHAR(40) NOT NULL,
  name       VARCHAR(160) NOT NULL,
  hue        INT DEFAULT 205,
  birthday   DATE,
  grade      VARCHAR(40),
  joined_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_students_user (user_id),
  CONSTRAINT fk_students_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Subjects a student picked at signup.
CREATE TABLE student_subjects (
  student_id VARCHAR(40) NOT NULL,
  subject_id VARCHAR(40) NOT NULL,
  PRIMARY KEY (student_id, subject_id),
  CONSTRAINT fk_ss_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_ss_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Subjects an instructor teaches (from the admin catalogue). Instructors pick
-- subjects (grouped by stream) at registration; the lessons/modules they cover
-- are every module under those subjects.
CREATE TABLE instructor_subjects (
  instructor_id VARCHAR(40) NOT NULL,
  subject_id    VARCHAR(40) NOT NULL,
  PRIMARY KEY (instructor_id, subject_id),
  CONSTRAINT fk_is_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
  CONSTRAINT fk_is_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Free time slots + requests
-- ---------------------------------------------------------------------------
CREATE TABLE slots (
  id            VARCHAR(40) PRIMARY KEY,
  instructor_id VARCHAR(40) NOT NULL,
  date          DATETIME NOT NULL,
  start         VARCHAR(5) NOT NULL,
  end           VARCHAR(5) NOT NULL,
  status        ENUM('open','booked') NOT NULL DEFAULT 'open',
  booked_by     VARCHAR(40),
  price         INT NOT NULL DEFAULT 0,
  meet_link     VARCHAR(500),
  -- In-site Zoom meeting (Meeting SDK embed); passcode is never sent to lists.
  zoom_meeting_id VARCHAR(30) DEFAULT NULL,
  zoom_passcode   VARCHAR(20) DEFAULT NULL,
  -- Instructor toggle: when 0 the slot stays published but students cannot
  -- send new requests for it (lets the instructor pause without deleting).
  accepting_requests TINYINT(1) NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_slots_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
  CONSTRAINT fk_slots_student FOREIGN KEY (booked_by) REFERENCES students(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE slot_requests (
  id          VARCHAR(40) PRIMARY KEY,
  -- NULL until a slot is materialized. A student can request a custom time the
  -- instructor never published; the slot is created only once both sides agree.
  slot_id     VARCHAR(40),
  student_id  VARCHAR(40) NOT NULL,
  -- Set on custom (slot-less) requests so ownership can be resolved without a
  -- slot; NULL for slot-based rows, which resolve via slots.instructor_id.
  instructor_id VARCHAR(40),
  -- The subject the student wants (required from the student side); module_id is
  -- the optional specific lesson under that subject.
  subject_id  VARCHAR(40),
  module_id   VARCHAR(40),
  -- Proposed time (student's ask, then the instructor's counter on reschedule)
  -- and the price the instructor sets on accept/reschedule. Used until slot_id
  -- is filled in.
  req_date    DATETIME,
  req_start   VARCHAR(5),
  req_end     VARCHAR(5),
  req_price   INT,
  status      ENUM('proposed','pending','accepted','rejected','paid','lost','rescheduled') NOT NULL DEFAULT 'pending',
  origin      ENUM('student','instructor') NOT NULL DEFAULT 'student',
  note        VARCHAR(500),
  -- Optional message the instructor attaches to the student when accepting.
  accept_note VARCHAR(500),
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  proposed_at DATETIME,
  accepted_at DATETIME,
  rejected_at DATETIME,
  paid_at     DATETIME,
  CONSTRAINT fk_req_slot FOREIGN KEY (slot_id) REFERENCES slots(id) ON DELETE CASCADE,
  CONSTRAINT fk_req_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_req_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
  CONSTRAINT fk_req_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE SET NULL,
  CONSTRAINT fk_req_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Group classes
-- ---------------------------------------------------------------------------
CREATE TABLE group_classes (
  id            VARCHAR(40) PRIMARY KEY,
  instructor_id VARCHAR(40) NOT NULL,
  subject_id    VARCHAR(40),  -- the subject this batch teaches
  module_id     VARCHAR(40),  -- legacy single lesson; lessons now live in group_class_lessons
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  schedule      VARCHAR(200),
  weeks         INT,
  starts_at     DATETIME,
  seats         INT NOT NULL DEFAULT 0,
  enrolled      INT NOT NULL DEFAULT 0,
  price         INT NOT NULL DEFAULT 0,
  level         VARCHAR(40),
  meet_link     VARCHAR(500),
  -- Group classes are broadcast one-to-many over YouTube Live; the instructor
  -- pastes the stream/watch URL and enrolled students watch it embedded.
  youtube_url   VARCHAR(500),
  zoom_meeting_id VARCHAR(30) DEFAULT NULL,
  zoom_passcode   VARCHAR(20) DEFAULT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_grp_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
  CONSTRAINT fk_grp_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  CONSTRAINT fk_grp_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- The lessons (modules) a group class covers. A batch teaches one subject and
-- the instructor picks which of its lessons the batch will go through.
CREATE TABLE group_class_lessons (
  group_id  VARCHAR(40) NOT NULL,
  module_id VARCHAR(40) NOT NULL,
  position  INT NOT NULL DEFAULT 0,
  PRIMARY KEY (group_id, module_id),
  CONSTRAINT fk_gcl_group FOREIGN KEY (group_id) REFERENCES group_classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_gcl_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------
CREATE TABLE reviews (
  id            VARCHAR(40) PRIMARY KEY,
  instructor_id VARCHAR(40) NOT NULL,
  student_id    VARCHAR(40) NOT NULL,
  rating        INT NOT NULL,
  days_studied  INT,
  text          TEXT,
  verified      TINYINT(1) NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- One review per (student, teacher): a student may edit it later, but never
  -- add a second one for the same instructor no matter how many classes taken.
  CONSTRAINT uq_review_student_instructor UNIQUE (student_id, instructor_id),
  CONSTRAINT fk_rev_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
  CONSTRAINT fk_rev_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Enrollments + payments (money in) + payouts (money out to teachers)
-- ---------------------------------------------------------------------------
CREATE TABLE enrollments (
  id         VARCHAR(40) PRIMARY KEY,
  type       ENUM('slot','group','seminar') NOT NULL,
  ref_id     VARCHAR(40) NOT NULL,
  request_id VARCHAR(40),
  student_id VARCHAR(40) NOT NULL,
  amount     INT NOT NULL DEFAULT 0,
  paid_at    DATETIME,
  started_at DATETIME,
  CONSTRAINT fk_enr_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE payments (
  id                VARCHAR(40) PRIMARY KEY,
  enrollment_id     VARCHAR(40),
  student_id        VARCHAR(40) NOT NULL,
  instructor_id     VARCHAR(40),
  amount            INT NOT NULL DEFAULT 0,
  commission_rate   DECIMAL(5,4) NOT NULL DEFAULT 0,
  commission_amount INT NOT NULL DEFAULT 0,
  instructor_earning INT NOT NULL DEFAULT 0,
  method            VARCHAR(40) DEFAULT 'card',
  status            ENUM('success','failed','refunded') NOT NULL DEFAULT 'success',
  at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pay_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_pay_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Offline payments (LankaQR / bank transfer) that a student submits with proof.
-- These stay 'pending' until an admin verifies the slip and approves, at which
-- point the real enrollment + payment rows are created (method 'qr' or 'bank').
CREATE TABLE manual_payments (
  id          VARCHAR(40) PRIMARY KEY,
  student_id  VARCHAR(40) NOT NULL,
  kind        ENUM('slot','group','seminar') NOT NULL,
  ref_id      VARCHAR(40) NOT NULL,   -- slot_request id / group_class id / seminar id
  method      ENUM('qr','bank') NOT NULL,
  amount      INT NOT NULL DEFAULT 0,
  reference   VARCHAR(120),           -- bank/txn reference the student typed
  slip_url    VARCHAR(255),           -- uploaded receipt image
  status      ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  note        VARCHAR(255),           -- admin note on approve/reject
  reviewed_by VARCHAR(40),
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME,
  KEY idx_manual_status (status, created_at),
  CONSTRAINT fk_manual_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Money paid out to a teacher by the admin.
CREATE TABLE payouts (
  id            VARCHAR(40) PRIMARY KEY,
  instructor_id VARCHAR(40) NOT NULL,
  amount        INT NOT NULL,
  note          VARCHAR(255),
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payout_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Advertisements shown in the side rails of the public home page.
-- `position` drives the display order (1,2,3,4); admin toggles is_active.
-- ---------------------------------------------------------------------------
CREATE TABLE ads (
  id         VARCHAR(40) PRIMARY KEY,
  title      VARCHAR(160),
  text       VARCHAR(500),
  image_url  VARCHAR(500),
  link       VARCHAR(500),
  position   INT NOT NULL DEFAULT 0,
  is_active  TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_ads_order (is_active, position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Course materials: PDFs (uploaded), recordings and links (external URLs)
-- an instructor shares with their students.
-- ---------------------------------------------------------------------------
CREATE TABLE materials (
  id            VARCHAR(40) PRIMARY KEY,
  instructor_id VARCHAR(40) NOT NULL,
  subject_id    VARCHAR(40) DEFAULT NULL,
  module_id     VARCHAR(40) DEFAULT NULL,
  -- Optional session scope: when one of these is set the material belongs to a
  -- specific group class / booked slot / seminar and is shown only to that
  -- session's audience (instead of the instructor's general resource shelf).
  seminar_id    VARCHAR(40) DEFAULT NULL,
  slot_id       VARCHAR(40) DEFAULT NULL,
  group_id      VARCHAR(40) DEFAULT NULL,
  title         VARCHAR(200) NOT NULL,
  kind          ENUM('pdf','recording','link') NOT NULL DEFAULT 'pdf',
  url           VARCHAR(600) NOT NULL,
  description   VARCHAR(500),
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mat_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
  CONSTRAINT fk_mat_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  CONSTRAINT fk_mat_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE SET NULL,
  CONSTRAINT fk_mat_seminar FOREIGN KEY (seminar_id) REFERENCES seminars(id) ON DELETE CASCADE,
  CONSTRAINT fk_mat_slot FOREIGN KEY (slot_id) REFERENCES slots(id) ON DELETE CASCADE,
  CONSTRAINT fk_mat_group FOREIGN KEY (group_id) REFERENCES group_classes(id) ON DELETE CASCADE,
  KEY idx_mat_instructor (instructor_id),
  KEY idx_mat_seminar (seminar_id),
  KEY idx_mat_slot (slot_id),
  KEY idx_mat_group (group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Seminars — one-off live sessions (free or paid) shown on the public site.
-- Students need an account to register/join; the meet link is revealed only
-- to registered students. Paid seminars go through PayHere like group classes.
-- ---------------------------------------------------------------------------
CREATE TABLE seminars (
  id            VARCHAR(40) PRIMARY KEY,
  instructor_id VARCHAR(40) NOT NULL,
  subject_id    VARCHAR(40),
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  banner_url    VARCHAR(500),
  starts_at     DATETIME,
  duration_mins INT NOT NULL DEFAULT 60,
  is_free       TINYINT(1) NOT NULL DEFAULT 1,
  price         INT NOT NULL DEFAULT 0,
  seats         INT NOT NULL DEFAULT 0,   -- 0 = unlimited
  registered    INT NOT NULL DEFAULT 0,
  meet_link     VARCHAR(500),
  -- Seminars are broadcast one-to-many over YouTube Live; the instructor pastes
  -- the stream/watch URL and registered students watch it embedded.
  youtube_url   VARCHAR(500),
  zoom_meeting_id VARCHAR(30) DEFAULT NULL,
  zoom_passcode   VARCHAR(20) DEFAULT NULL,
  status        ENUM('published','ended') NOT NULL DEFAULT 'published',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sem_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
  CONSTRAINT fk_sem_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  KEY idx_sem_instructor (instructor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE seminar_registrations (
  id            VARCHAR(40) PRIMARY KEY,
  seminar_id    VARCHAR(40) NOT NULL,
  student_id    VARCHAR(40) NOT NULL,
  paid          TINYINT(1) NOT NULL DEFAULT 0,
  registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_sem_reg (seminar_id, student_id),
  CONSTRAINT fk_semreg_seminar FOREIGN KEY (seminar_id) REFERENCES seminars(id) ON DELETE CASCADE,
  CONSTRAINT fk_semreg_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Live teaching sessions. The instructor presses "Start session" when a live
-- class begins and "End session" when it ends; the elapsed minutes are counted
-- toward their teaching time (see instructors.teaching_minutes / teaching_hours).
-- ---------------------------------------------------------------------------
CREATE TABLE live_sessions (
  id            VARCHAR(40) PRIMARY KEY,
  type          ENUM('slot','group','seminar') NOT NULL,
  ref_id        VARCHAR(40) NOT NULL,   -- id of the slot / group_class / seminar
  instructor_id VARCHAR(40) NOT NULL,
  started_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at      DATETIME DEFAULT NULL,  -- NULL while the session is live
  minutes       INT NOT NULL DEFAULT 0, -- filled in on end
  CONSTRAINT fk_live_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
  KEY idx_live_instructor (instructor_id),
  KEY idx_live_open (type, ref_id, ended_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Live MCQ tests attached to a seminar. The instructor builds a quiz (draft),
-- then activates it: a single shared countdown starts (started_at .. ends_at).
-- Registered students take it live; when the shared window closes, results
-- (scores + correct answers + leaderboard) become visible to everyone at once.
-- ---------------------------------------------------------------------------
-- MCQ tests. Despite the name, a quiz belongs to EITHER a seminar (many
-- registered students) OR a booked 1-on-1 slot (the one student who booked it).
-- Exactly one of seminar_id / slot_id is set.
CREATE TABLE seminar_quizzes (
  id            VARCHAR(40) PRIMARY KEY,
  seminar_id    VARCHAR(40) DEFAULT NULL,
  slot_id       VARCHAR(40) DEFAULT NULL,
  instructor_id VARCHAR(40) NOT NULL,
  title         VARCHAR(200) NOT NULL,
  duration_secs INT NOT NULL DEFAULT 600,   -- length of the shared live window
  status        ENUM('draft','scheduled','active','ended') NOT NULL DEFAULT 'draft',
  scheduled_at  DATETIME DEFAULT NULL,      -- local wall-clock start time; auto-goes live then
  started_at    DATETIME DEFAULT NULL,      -- set when the quiz actually goes live
  ends_at       DATETIME DEFAULT NULL,      -- started_at + duration_secs
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_quiz_seminar FOREIGN KEY (seminar_id) REFERENCES seminars(id) ON DELETE CASCADE,
  CONSTRAINT fk_quiz_slot FOREIGN KEY (slot_id) REFERENCES slots(id) ON DELETE CASCADE,
  CONSTRAINT fk_quiz_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
  KEY idx_quiz_seminar (seminar_id),
  KEY idx_quiz_slot (slot_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE quiz_questions (
  id            VARCHAR(40) PRIMARY KEY,
  quiz_id       VARCHAR(40) NOT NULL,
  position      INT NOT NULL DEFAULT 0,
  text          TEXT NOT NULL,             -- question text (may be blank when image_url is set)
  image_url     VARCHAR(500) DEFAULT NULL, -- optional question image
  options       JSON NOT NULL,             -- array of { text, imageUrl } answer objects
  correct_index INT NOT NULL DEFAULT 0,    -- first correct option index (legacy / single-answer)
  correct_indexes JSON DEFAULT NULL,       -- array of correct option indexes; never sent to students while active
  CONSTRAINT fk_qq_quiz FOREIGN KEY (quiz_id) REFERENCES seminar_quizzes(id) ON DELETE CASCADE,
  KEY idx_qq_quiz (quiz_id, position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE quiz_submissions (
  id           VARCHAR(40) PRIMARY KEY,
  quiz_id      VARCHAR(40) NOT NULL,
  student_id   VARCHAR(40) NOT NULL,
  answers      JSON NOT NULL,              -- { questionId: chosenIndex }
  score        INT NOT NULL DEFAULT 0,
  total        INT NOT NULL DEFAULT 0,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_quiz_sub (quiz_id, student_id),
  CONSTRAINT fk_qs_quiz FOREIGN KEY (quiz_id) REFERENCES seminar_quizzes(id) ON DELETE CASCADE,
  CONSTRAINT fk_qs_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Records that a student has opened a live quiz, so the lecturer can see how
-- many are "in progress" (started but not yet submitted) in real time. One row
-- per student per quiz; started_at is set on their first open.
CREATE TABLE quiz_attempts (
  id           VARCHAR(40) PRIMARY KEY,
  quiz_id      VARCHAR(40) NOT NULL,
  student_id   VARCHAR(40) NOT NULL,
  started_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_quiz_attempt (quiz_id, student_id),
  CONSTRAINT fk_qa_quiz FOREIGN KEY (quiz_id) REFERENCES seminar_quizzes(id) ON DELETE CASCADE,
  CONSTRAINT fk_qa_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Reusable MCQ question banks. A bank is a standalone set of MCQ questions that
-- an instructor or an admin builds ahead of time. Each bank has a shared import
-- password: any instructor who knows it can copy the bank's questions into a
-- draft quiz of theirs (see the /quizzes/:id/import route). Banks are private —
-- they are only reachable by their owner (for editing) or via the password.
CREATE TABLE question_banks (
  id              VARCHAR(40) PRIMARY KEY,
  owner_user_id   VARCHAR(40) NOT NULL,       -- users.id of the creator
  owner_role      ENUM('instructor','admin') NOT NULL,
  title           VARCHAR(200) NOT NULL,
  import_password VARCHAR(100) NOT NULL,      -- shared key others type to import
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bank_owner FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_bank_password (import_password),
  KEY idx_bank_owner (owner_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Questions inside a bank. Same shape as quiz_questions so they can be copied
-- verbatim into a quiz on import.
CREATE TABLE bank_questions (
  id              VARCHAR(40) PRIMARY KEY,
  bank_id         VARCHAR(40) NOT NULL,
  position        INT NOT NULL DEFAULT 0,
  text            TEXT NOT NULL,
  image_url       VARCHAR(500) DEFAULT NULL,
  options         JSON NOT NULL,
  correct_index   INT NOT NULL DEFAULT 0,
  correct_indexes JSON DEFAULT NULL,
  CONSTRAINT fk_bq_bank FOREIGN KEY (bank_id) REFERENCES question_banks(id) ON DELETE CASCADE,
  KEY idx_bq_bank (bank_id, position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Papers — question papers / handouts (PDF) an instructor attaches to a seminar
-- OR a booked 1-on-1 slot (exactly one of seminar_id / slot_id is set, same as
-- seminar_quizzes). Students in that audience download the paper and, when the
-- instructor allows it, upload their answer (PDF or image); the instructor can
-- then mark it and leave feedback.
-- ---------------------------------------------------------------------------
CREATE TABLE papers (
  id            VARCHAR(40) PRIMARY KEY,
  instructor_id VARCHAR(40) NOT NULL,
  seminar_id    VARCHAR(40) DEFAULT NULL,
  slot_id       VARCHAR(40) DEFAULT NULL,
  title         VARCHAR(200) NOT NULL,
  description   VARCHAR(500) DEFAULT NULL,
  file_url      VARCHAR(600) NOT NULL,      -- the uploaded paper PDF
  -- When 0 the paper is view-only: students can download it but cannot upload
  -- an answer (lets the instructor close submissions after a deadline).
  allow_answers TINYINT(1) NOT NULL DEFAULT 1,
  due_at        DATETIME DEFAULT NULL,      -- optional deadline shown to students
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_paper_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
  CONSTRAINT fk_paper_seminar FOREIGN KEY (seminar_id) REFERENCES seminars(id) ON DELETE CASCADE,
  CONSTRAINT fk_paper_slot FOREIGN KEY (slot_id) REFERENCES slots(id) ON DELETE CASCADE,
  KEY idx_paper_seminar (seminar_id),
  KEY idx_paper_slot (slot_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- A student's answer for a paper. One row per (paper, student); re-uploading
-- replaces the file in place (and clears any previous marking).
CREATE TABLE paper_submissions (
  id           VARCHAR(40) PRIMARY KEY,
  paper_id     VARCHAR(40) NOT NULL,
  student_id   VARCHAR(40) NOT NULL,
  file_url     VARCHAR(600) NOT NULL,
  file_type    ENUM('pdf','image') NOT NULL DEFAULT 'pdf',
  note         VARCHAR(500) DEFAULT NULL,   -- optional student note
  marks        INT DEFAULT NULL,            -- instructor's mark (NULL until graded)
  feedback     VARCHAR(1000) DEFAULT NULL,  -- instructor's written feedback
  graded_at    DATETIME DEFAULT NULL,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_paper_sub (paper_id, student_id),
  CONSTRAINT fk_psub_paper FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
  CONSTRAINT fk_psub_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- All tables created; re-enable foreign key enforcement.
SET FOREIGN_KEY_CHECKS = 1;
