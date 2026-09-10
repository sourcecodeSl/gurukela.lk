-- Migration: task 5/6/8 schema changes (non-destructive, keeps existing data)
-- Run once against the live DB, e.g.  mysql -u root -p gurukela < this_file.sql

-- ── Task 8: per-slot accepting_requests toggle ──────────────────────────────
ALTER TABLE slots
  ADD COLUMN accepting_requests TINYINT(1) NOT NULL DEFAULT 1 AFTER meet_link;

-- ── Task 6: group classes → subject + multiple lessons ──────────────────────
ALTER TABLE group_classes
  ADD COLUMN subject_id VARCHAR(40) NULL AFTER instructor_id,
  ADD CONSTRAINT fk_grp_subject FOREIGN KEY (subject_id)
    REFERENCES subjects(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS group_class_lessons (
  group_id  VARCHAR(40) NOT NULL,
  module_id VARCHAR(40) NOT NULL,
  position  INT NOT NULL DEFAULT 0,
  PRIMARY KEY (group_id, module_id),
  CONSTRAINT fk_gcl_group  FOREIGN KEY (group_id)  REFERENCES group_classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_gcl_module FOREIGN KEY (module_id) REFERENCES modules(id)        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Backfill: derive each class's subject from its old module, and seed that
-- module as the class's first lesson so existing batches keep their lesson.
UPDATE group_classes gc
  JOIN modules m ON m.id = gc.module_id
  SET gc.subject_id = m.subject_id
  WHERE gc.subject_id IS NULL AND gc.module_id IS NOT NULL;

INSERT IGNORE INTO group_class_lessons (group_id, module_id, position)
  SELECT id, module_id, 0 FROM group_classes WHERE module_id IS NOT NULL;
