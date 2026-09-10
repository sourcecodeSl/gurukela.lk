-- Migrate instructor links from module level to subject level.
-- Run once against an existing database (keeps current data).

-- 1. New subject-level link table.
CREATE TABLE IF NOT EXISTS instructor_subjects (
  instructor_id VARCHAR(40) NOT NULL,
  subject_id    VARCHAR(40) NOT NULL,
  PRIMARY KEY (instructor_id, subject_id),
  CONSTRAINT fk_is_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
  CONSTRAINT fk_is_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Carry existing module links over as the subjects those modules belong to.
INSERT IGNORE INTO instructor_subjects (instructor_id, subject_id)
SELECT DISTINCT im.instructor_id, m.subject_id
FROM instructor_modules im
JOIN modules m ON m.id = im.module_id
WHERE m.subject_id IS NOT NULL;

-- 3. Drop the old module-level link table.
DROP TABLE IF EXISTS instructor_modules;
