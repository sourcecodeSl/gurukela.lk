-- gurukela.lk LMS schema
-- Character set: utf8mb4 throughout. Run with multipleStatements enabled.
-- Drop order respects foreign keys.

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS payouts;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS slot_requests;
DROP TABLE IF EXISTS slots;
DROP TABLE IF EXISTS group_classes;
DROP TABLE IF EXISTS instructor_modules;
DROP TABLE IF EXISTS student_subjects;
DROP TABLE IF EXISTS modules;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS instructors;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS otps;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

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
-- Admin catalogue: subjects -> modules
-- ---------------------------------------------------------------------------
CREATE TABLE subjects (
  id          VARCHAR(40) PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  icon        VARCHAR(40),
  color       INT,
  description VARCHAR(255)
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

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------
CREATE TABLE instructors (
  id               VARCHAR(40) PRIMARY KEY,
  user_id          VARCHAR(40) NOT NULL,
  name             VARCHAR(160) NOT NULL,
  title            VARCHAR(160),
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
  is_active        TINYINT(1) NOT NULL DEFAULT 1,
  rating           DECIMAL(3,2) NOT NULL DEFAULT 0,
  review_count     INT NOT NULL DEFAULT 0,
  teaching_hours   INT NOT NULL DEFAULT 0,
  student_count    INT NOT NULL DEFAULT 0,
  hourly_rate      INT NOT NULL DEFAULT 0,
  response_mins    INT,
  languages        JSON,
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

-- Modules an instructor teaches (from the admin catalogue).
CREATE TABLE instructor_modules (
  instructor_id VARCHAR(40) NOT NULL,
  module_id     VARCHAR(40) NOT NULL,
  PRIMARY KEY (instructor_id, module_id),
  CONSTRAINT fk_im_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
  CONSTRAINT fk_im_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
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
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_slots_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
  CONSTRAINT fk_slots_student FOREIGN KEY (booked_by) REFERENCES students(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE slot_requests (
  id          VARCHAR(40) PRIMARY KEY,
  slot_id     VARCHAR(40) NOT NULL,
  student_id  VARCHAR(40) NOT NULL,
  module_id   VARCHAR(40),
  status      ENUM('pending','accepted','rejected','paid','lost') NOT NULL DEFAULT 'pending',
  note        VARCHAR(500),
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  accepted_at DATETIME,
  rejected_at DATETIME,
  paid_at     DATETIME,
  CONSTRAINT fk_req_slot FOREIGN KEY (slot_id) REFERENCES slots(id) ON DELETE CASCADE,
  CONSTRAINT fk_req_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_req_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Group classes
-- ---------------------------------------------------------------------------
CREATE TABLE group_classes (
  id            VARCHAR(40) PRIMARY KEY,
  instructor_id VARCHAR(40) NOT NULL,
  module_id     VARCHAR(40),
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  schedule      VARCHAR(200),
  weeks         INT,
  starts_at     DATETIME,
  seats         INT NOT NULL DEFAULT 0,
  enrolled      INT NOT NULL DEFAULT 0,
  price         INT NOT NULL DEFAULT 0,
  level         VARCHAR(40),
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_grp_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
  CONSTRAINT fk_grp_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE SET NULL
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
  CONSTRAINT fk_rev_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
  CONSTRAINT fk_rev_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Enrollments + payments (money in) + payouts (money out to teachers)
-- ---------------------------------------------------------------------------
CREATE TABLE enrollments (
  id         VARCHAR(40) PRIMARY KEY,
  type       ENUM('slot','group') NOT NULL,
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

-- Money paid out to a teacher by the admin.
CREATE TABLE payouts (
  id            VARCHAR(40) PRIMARY KEY,
  instructor_id VARCHAR(40) NOT NULL,
  amount        INT NOT NULL,
  note          VARCHAR(255),
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payout_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
