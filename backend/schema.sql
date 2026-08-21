CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  student_name TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 80 AND score <= 100),
  course_version TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_certificates_completed_at ON certificates(completed_at);

CREATE TABLE IF NOT EXISTS course_progress (
  resume_code TEXT PRIMARY KEY,
  progress_json TEXT NOT NULL,
  course_version TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_course_progress_updated_at ON course_progress(updated_at);
