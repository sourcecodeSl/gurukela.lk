-- ---------------------------------------------------------------------------
-- In-site Zoom live classes. Each slot / group class / seminar can have a Zoom
-- meeting (created via the Zoom API) that runs embedded inside the site through
-- the Zoom Meeting SDK. We store the meeting number + passcode; the join
-- signature and host start token are minted per request, never stored.
--
-- Column position is not specified (no AFTER) so this runs on any existing DB.
-- ---------------------------------------------------------------------------

ALTER TABLE slots
  ADD COLUMN zoom_meeting_id VARCHAR(30) DEFAULT NULL,
  ADD COLUMN zoom_passcode   VARCHAR(20) DEFAULT NULL;

ALTER TABLE group_classes
  ADD COLUMN zoom_meeting_id VARCHAR(30) DEFAULT NULL,
  ADD COLUMN zoom_passcode   VARCHAR(20) DEFAULT NULL;

ALTER TABLE seminars
  ADD COLUMN zoom_meeting_id VARCHAR(30) DEFAULT NULL,
  ADD COLUMN zoom_passcode   VARCHAR(20) DEFAULT NULL;
