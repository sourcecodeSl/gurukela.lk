-- ---------------------------------------------------------------------------
-- A slot request now captures the subject the student wants (required from the
-- student side); the specific lesson (module_id) stays optional. Older rows get
-- NULL and are unaffected.
--
-- Column position is not specified (no AFTER) so this runs on any existing DB.
-- ---------------------------------------------------------------------------

ALTER TABLE slot_requests
  ADD COLUMN subject_id VARCHAR(40) DEFAULT NULL,
  ADD CONSTRAINT fk_req_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL;
