-- ---------------------------------------------------------------------------
-- Live teaching sessions: the instructor presses "Start session" when a live
-- class begins and "End session" when it ends. The elapsed minutes are counted
-- toward the instructor's teaching time (slots, group classes and seminars).
--
-- teaching_minutes is the precise accumulator; teaching_hours (already shown in
-- dashboards/profiles) is kept in sync as ROUND(teaching_minutes / 60).
-- ---------------------------------------------------------------------------

ALTER TABLE instructors
  ADD COLUMN teaching_minutes INT NOT NULL DEFAULT 0 AFTER teaching_hours;

CREATE TABLE IF NOT EXISTS live_sessions (
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
