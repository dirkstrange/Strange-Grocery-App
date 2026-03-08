-- Grocery App — MariaDB Schema
-- Run this after creating the database:
--   CREATE DATABASE grocery_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--   USE grocery_app;

SET FOREIGN_KEY_CHECKS = 0;

-- -------------------------------------------------------
-- Departments
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
  id         INT          NOT NULL AUTO_INCREMENT,
  name       VARCHAR(100) NOT NULL,
  sort_order INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO departments (name, sort_order) VALUES
  ('Produce',               1),
  ('Meat & Seafood',        2),
  ('Dairy & Eggs',          3),
  ('Bakery & Bread',        4),
  ('Frozen',                5),
  ('Pantry / Dry Goods',    6),
  ('Beverages',             7),
  ('Snacks',                8),
  ('Household / Cleaning',  9),
  ('Personal Care',        10),
  ('Other / Uncategorized',11);

-- -------------------------------------------------------
-- Users
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT          NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100) NOT NULL,
  session_token VARCHAR(255) NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_session_token (session_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
-- Trips (grocery trips — one active at a time)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS trips (
  id           INT          NOT NULL AUTO_INCREMENT,
  name         VARCHAR(255),
  status       ENUM('active','completed') NOT NULL DEFAULT 'active',
  created_by   INT          NOT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  PRIMARY KEY (id),
  KEY idx_trips_status (status),
  CONSTRAINT fk_trips_created_by FOREIGN KEY (created_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
-- List Items
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS list_items (
  id            INT            NOT NULL AUTO_INCREMENT,
  trip_id       INT            NOT NULL,
  name          VARCHAR(255)   NOT NULL,
  quantity      DECIMAL(8,2),
  unit          VARCHAR(50),
  department_id INT            NOT NULL,
  checked       BOOLEAN        NOT NULL DEFAULT FALSE,
  added_by      INT            NOT NULL,
  created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_list_items_trip (trip_id),
  KEY idx_list_items_department (department_id),
  CONSTRAINT fk_items_trip       FOREIGN KEY (trip_id)       REFERENCES trips       (id) ON DELETE CASCADE,
  CONSTRAINT fk_items_department FOREIGN KEY (department_id) REFERENCES departments (id),
  CONSTRAINT fk_items_added_by   FOREIGN KEY (added_by)      REFERENCES users       (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
-- Learned Categories (Claude categorization cache)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS learned_categories (
  item_name     VARCHAR(255) NOT NULL,
  department_id INT          NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (item_name),
  CONSTRAINT fk_learned_dept FOREIGN KEY (department_id) REFERENCES departments (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
-- Chat Messages
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
  id         INT      NOT NULL AUTO_INCREMENT,
  trip_id    INT      NOT NULL,
  role       ENUM('user','assistant') NOT NULL,
  content    TEXT     NOT NULL,
  user_id    INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_chat_trip (trip_id),
  CONSTRAINT fk_chat_trip    FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_user_id FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
