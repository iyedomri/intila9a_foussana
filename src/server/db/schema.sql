-- ========================================================
-- Intila9a Foussana Elementary School Database Schema
-- Compatible with PostgreSQL (Supabase, Neon, Vercel Postgres, AWS RDS)
-- ========================================================

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(20) NOT NULL CHECK (role IN ('DIRECTOR', 'TEACHER', 'STUDENT', 'PARENT')),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(320) UNIQUE NOT NULL,
  username VARCHAR(64) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  must_change_password BOOLEAN DEFAULT FALSE,
  failed_login_attempts INT DEFAULT 0,
  login_locked_until TIMESTAMPTZ(3),
  last_login_at TIMESTAMPTZ(3),
  session_version INT DEFAULT 0,
  created_at TIMESTAMPTZ(3) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_role_active ON users (role, is_active);

-- 2. Grades table (1 to 6)
CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level SMALLINT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ(3) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(3) DEFAULT CURRENT_TIMESTAMP
);

-- 3. School Classes table
CREATE TABLE IF NOT EXISTS school_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id UUID NOT NULL REFERENCES grades (id) ON DELETE RESTRICT,
  name VARCHAR(24) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ(3) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(3) DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(grade_id, name)
);

CREATE INDEX IF NOT EXISTS idx_school_classes_grade_active ON school_classes (grade_id, is_active);

-- 4. Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(80) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ(3) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(3) DEFAULT CURRENT_TIMESTAMP
);

-- 5. Posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  author_name VARCHAR(200) NOT NULL,
  author_role VARCHAR(20) NOT NULL CHECK (author_role IN ('DIRECTOR', 'TEACHER', 'STUDENT', 'PARENT')),
  type VARCHAR(30) NOT NULL CHECK (type IN ('EXERCISE', 'EXAM', 'LESSON_NOTE', 'ANNOUNCEMENT')),
  audience VARCHAR(20) NOT NULL DEFAULT 'ALL' CHECK (audience IN ('ALL', 'STUDENTS', 'PARENTS', 'TEACHERS')),
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  subject VARCHAR(100) NOT NULL,
  grade SMALLINT NOT NULL DEFAULT 0, -- 0 = Toute l'école, 1..6 = Année spécifique
  status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  deleted_at TIMESTAMPTZ(3),
  deleted_by_id UUID REFERENCES users (id) ON DELETE RESTRICT,
  delete_reason VARCHAR(500),
  created_at TIMESTAMPTZ(3) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_posts_author ON posts (author_id, created_at);
CREATE INDEX IF NOT EXISTS idx_posts_grade_audience ON posts (grade, audience);
CREATE INDEX IF NOT EXISTS idx_posts_deleted_created ON posts (deleted_at, created_at);

-- 6. Post Files table (attachment support for PDF documents)
CREATE TABLE IF NOT EXISTS post_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(127) NOT NULL,
  size INT NOT NULL,
  data_base64 TEXT,
  storage_key VARCHAR(512),
  scan_status VARCHAR(20) NOT NULL DEFAULT 'CLEAN' CHECK (scan_status IN ('PENDING', 'CLEAN', 'REJECTED')),
  created_at TIMESTAMPTZ(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_post_files_post_id ON post_files (post_id);
