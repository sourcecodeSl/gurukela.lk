-- Adds the instructor profile picture column to an existing database.
-- Safe to run once on a live DB (the full schema.sql would drop data).
-- Usage (example):
--   mysql -u <user> -p <database> < src/db/add-instructor-photo.sql

ALTER TABLE instructors
  ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500) AFTER title;
