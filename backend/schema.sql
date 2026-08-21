CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  student_name TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 80 AND score <= 100),
  course_version TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_certificates_completed_at ON certificates(completed_at);
