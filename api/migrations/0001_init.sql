-- Tài khoản người dùng: đăng nhập bằng email + mật khẩu (PBKDF2-SHA256, có salt).
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  pass_hash TEXT NOT NULL,
  pass_salt TEXT NOT NULL,
  avatar BLOB,
  avatar_type TEXT,
  avatar_ver INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- Phiên đăng nhập: chỉ lưu SHA-256 của token, token thật nằm trong cookie HttpOnly.
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_user ON sessions(user_id);

-- Đếm số lần đăng nhập sai để chặn dò mật khẩu.
CREATE TABLE login_attempts (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  first_at INTEGER NOT NULL
);
