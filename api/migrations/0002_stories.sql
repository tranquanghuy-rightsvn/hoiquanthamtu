-- Truyện độc giả gửi qua form "Đăng truyện" (link Google Docs công khai).
CREATE TABLE stories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  author TEXT NOT NULL,
  email TEXT NOT NULL,
  doc_url TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ip TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX stories_ip ON stories(ip, created_at);
