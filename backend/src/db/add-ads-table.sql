-- Run once against the EXISTING gurukela database to add the ads table
-- without wiping data. Safe to re-run (IF NOT EXISTS).
--   mysql -u <user> -p <database> < backend/src/db/add-ads-table.sql
CREATE TABLE IF NOT EXISTS ads (
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
