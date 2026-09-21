-- ---------------------------------------------------------------------------
-- YouTube Live for group classes and seminars. Unlike one-on-one slots (which
-- run over Daily.co as a two-way call), group classes and seminars are a
-- one-to-many broadcast: the instructor pastes the YouTube Live watch/stream
-- URL and enrolled/registered students watch it embedded inside the site.
--
-- Column position is not specified (no AFTER) so this runs on any existing DB.
-- ---------------------------------------------------------------------------

ALTER TABLE group_classes
  ADD COLUMN youtube_url VARCHAR(500) DEFAULT NULL;

ALTER TABLE seminars
  ADD COLUMN youtube_url VARCHAR(500) DEFAULT NULL;
