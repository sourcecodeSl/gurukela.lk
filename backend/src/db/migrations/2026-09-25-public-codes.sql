-- Public account codes (friendly display id) for students & instructors.
-- The internal primary keys (students.id / instructors.id — the std-… / ins-…
-- strings) are NOT touched, so every foreign key keeps working. We only add a
-- separate numeric label:
--   student  → 8 digits starting with 1  (10000001, 10000002, …)
--   teacher  → 8 digits starting with 9  (90000001, 90000002, …)
--
-- MariaDB syntax (ADD COLUMN / KEY IF NOT EXISTS). Idempotent — safe to re-run.
-- Take a database backup before running on the live database.

-- 1) Add the code columns + unique guards (no-op if already present).
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS code VARCHAR(8) AFTER id;
ALTER TABLE instructors ADD UNIQUE KEY IF NOT EXISTS uq_instructors_code (code);

ALTER TABLE students ADD COLUMN IF NOT EXISTS code VARCHAR(8) AFTER id;
ALTER TABLE students ADD UNIQUE KEY IF NOT EXISTS uq_students_code (code);

-- 2) Backfill existing rows in stable join order (only rows still missing a code).
SET @n := 90000000;
UPDATE instructors SET code = (@n := @n + 1) WHERE code IS NULL ORDER BY created_at, id;

SET @m := 10000000;
UPDATE students SET code = (@m := @m + 1) WHERE code IS NULL ORDER BY joined_at, id;

-- 3) Seed / advance the counters the app bumps on each new registration, so new
--    sign-ups continue the sequence after the highest code already issued.
SELECT COALESCE(MAX(CAST(code AS UNSIGNED)), 90000000) INTO @ins_max FROM instructors;
INSERT INTO settings (`key`, `value`) VALUES ('instructor_code_seq', @ins_max)
  ON DUPLICATE KEY UPDATE `value` = GREATEST(CAST(`value` AS UNSIGNED), @ins_max);

SELECT COALESCE(MAX(CAST(code AS UNSIGNED)), 10000000) INTO @std_max FROM students;
INSERT INTO settings (`key`, `value`) VALUES ('student_code_seq', @std_max)
  ON DUPLICATE KEY UPDATE `value` = GREATEST(CAST(`value` AS UNSIGNED), @std_max);
