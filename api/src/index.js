/* API tài khoản của Hội Quán Thám Tử: đăng ký, đăng nhập, đăng xuất, trang cá nhân.
   Chạy trên Cloudflare Workers, dữ liệu ở D1. Chỉ phục vụ đường dẫn /api/*. */

const COOKIE = 'hq_session';
const SESSION_DAYS = 30;
const PBKDF2_ITERATIONS = 100000; // giới hạn tối đa của PBKDF2 trên Workers
const MAX_FAILS = 8; // số lần đăng nhập sai cho phép trong một cửa sổ
const FAIL_WINDOW = 15 * 60; // giây
const AVATAR_MAX = 300 * 1024;
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOC_RE = /^https:\/\/docs\.google\.com\/document\/\S+$/;
const STORY_TYPES = ['Truyện ngắn', 'Truyện dài'];
const STORY_MAX = 5; // số truyện tối đa một địa chỉ IP được gửi trong một giờ

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (request.method === 'POST' && !sameOrigin(request, url)) {
        return json({ error: 'Yêu cầu không hợp lệ.' }, 403);
      }
      const route = request.method + ' ' + url.pathname.replace(/\/+$/, '');
      switch (route) {
        case 'POST /api/register': return await register(request, env);
        case 'POST /api/login': return await login(request, env);
        case 'POST /api/logout': return await logout(request, env);
        case 'GET /api/me': return await me(request, env);
        case 'POST /api/profile': return await updateProfile(request, env);
        case 'POST /api/avatar': return await uploadAvatar(request, env);
        case 'POST /api/avatar/delete': return await deleteAvatar(request, env);
        case 'POST /api/password': return await changePassword(request, env);
        case 'POST /api/story': return await submitStory(request, env);
      }
      const avatar = url.pathname.match(/^\/api\/avatar\/(\d+)$/);
      if (request.method === 'GET' && avatar) return await getAvatar(env, Number(avatar[1]));
      return json({ error: 'Không tìm thấy.' }, 404);
    } catch (err) {
      console.error(err);
      return json({ error: 'Máy chủ đang gặp sự cố, bạn thử lại sau nhé.' }, 500);
    }
  }
};

/* ---------- Các API ---------- */

async function register(request, env) {
  const body = await readJson(request);
  const name = cleanName(body.name);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!name) return json({ error: 'Tên hiển thị cần từ 2 đến 40 ký tự.' }, 400);
  if (!EMAIL_RE.test(email) || email.length > 254) return json({ error: 'Email chưa đúng định dạng.' }, 400);
  if (password.length < 8 || password.length > 200) return json({ error: 'Mật khẩu cần tối thiểu 8 ký tự.' }, 400);

  const exists = await env.DB.prepare('SELECT 1 FROM users WHERE email = ?').bind(email).first();
  if (exists) return json({ error: 'Email này đã được dùng để đăng ký.' }, 409);

  const salt = randomHex(16);
  const hash = await hashPassword(password, salt);
  const row = await env.DB.prepare(
    'INSERT INTO users (email, name, pass_hash, pass_salt, created_at) VALUES (?, ?, ?, ?, ?) RETURNING *'
  ).bind(email, name, hash, salt, now()).first();
  return withSession(env, row.id, json({ user: publicUser(row) }, 201));
}

async function login(request, env) {
  const body = await readJson(request);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const key = email + '|' + ip;

  const attempt = await env.DB.prepare('SELECT count, first_at FROM login_attempts WHERE key = ?').bind(key).first();
  if (attempt && attempt.count >= MAX_FAILS && now() - attempt.first_at < FAIL_WINDOW) {
    return json({ error: 'Bạn đăng nhập sai quá nhiều lần. Thử lại sau 15 phút nhé.' }, 429);
  }

  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  // Vẫn băm mật khẩu khi không có tài khoản để thời gian phản hồi không lộ email nào đã đăng ký.
  const hash = await hashPassword(password, user ? user.pass_salt : '00');
  if (!user || !timingSafeEqual(hash, user.pass_hash)) {
    await recordFail(env, key, attempt);
    return json({ error: 'Email hoặc mật khẩu chưa đúng.' }, 401);
  }
  await env.DB.prepare('DELETE FROM login_attempts WHERE key = ?').bind(key).run();
  return withSession(env, user.id, json({ user: publicUser(user) }));
}

async function logout(request, env) {
  const token = readCookie(request, COOKIE);
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run();
  return json({ ok: true }, 200, { 'Set-Cookie': cookie('', 0) });
}

async function me(request, env) {
  const user = await currentUser(request, env);
  if (!user) return json({ user: null }, 401);
  return json({ user: publicUser(user) });
}

async function updateProfile(request, env) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: 'Bạn cần đăng nhập.' }, 401);
  const name = cleanName((await readJson(request)).name);
  if (!name) return json({ error: 'Tên hiển thị cần từ 2 đến 40 ký tự.' }, 400);
  const row = await env.DB.prepare('UPDATE users SET name = ? WHERE id = ? RETURNING *').bind(name, user.id).first();
  return json({ user: publicUser(row) });
}

async function uploadAvatar(request, env) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: 'Bạn cần đăng nhập.' }, 401);
  const type = (request.headers.get('Content-Type') || '').split(';')[0].trim();
  if (!AVATAR_TYPES.includes(type)) return json({ error: 'Ảnh cần là JPG, PNG hoặc WebP.' }, 415);
  const data = await request.arrayBuffer();
  if (!data.byteLength || data.byteLength > AVATAR_MAX) return json({ error: 'Ảnh quá lớn, tối đa 300KB.' }, 413);
  const row = await env.DB.prepare(
    'UPDATE users SET avatar = ?, avatar_type = ?, avatar_ver = avatar_ver + 1 WHERE id = ? RETURNING *'
  ).bind(data, type, user.id).first();
  return json({ user: publicUser(row) });
}

async function deleteAvatar(request, env) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: 'Bạn cần đăng nhập.' }, 401);
  const row = await env.DB.prepare(
    'UPDATE users SET avatar = NULL, avatar_type = NULL, avatar_ver = avatar_ver + 1 WHERE id = ? RETURNING *'
  ).bind(user.id).first();
  return json({ user: publicUser(row) });
}

async function getAvatar(env, id) {
  const row = await env.DB.prepare('SELECT avatar, avatar_type FROM users WHERE id = ?').bind(id).first();
  if (!row || !row.avatar) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(row.avatar), {
    headers: {
      'Content-Type': row.avatar_type,
      // URL ảnh có ?v=<phiên bản>, đổi ảnh là đổi URL nên được phép lưu lâu.
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

async function changePassword(request, env) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: 'Bạn cần đăng nhập.' }, 401);
  const body = await readJson(request);
  const current = String(body.current || '');
  const next = String(body.next || '');
  if (!timingSafeEqual(await hashPassword(current, user.pass_salt), user.pass_hash)) {
    return json({ error: 'Mật khẩu hiện tại chưa đúng.' }, 400);
  }
  if (next.length < 8 || next.length > 200) return json({ error: 'Mật khẩu mới cần tối thiểu 8 ký tự.' }, 400);
  const salt = randomHex(16);
  await env.DB.prepare('UPDATE users SET pass_hash = ?, pass_salt = ? WHERE id = ?')
    .bind(await hashPassword(next, salt), salt, user.id).run();
  // Đổi mật khẩu thì đăng xuất mọi nơi khác, giữ lại phiên hiện tại.
  const token = readCookie(request, COOKIE);
  await env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?')
    .bind(user.id, await sha256(token)).run();
  return json({ ok: true });
}

async function submitStory(request, env) {
  const body = await readJson(request);
  const title = String(body.title || '').replace(/\s+/g, ' ').trim();
  const author = String(body.author || '').replace(/\s+/g, ' ').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const doc = String(body.doc || '').trim();
  const type = STORY_TYPES.includes(body.type) ? body.type : STORY_TYPES[0];
  if (!title || title.length > 200) return json({ error: 'Tên truyện cần từ 1 đến 200 ký tự.' }, 400);
  if (!author || author.length > 60) return json({ error: 'Bút danh cần từ 1 đến 60 ký tự.' }, 400);
  if (!EMAIL_RE.test(email) || email.length > 254) return json({ error: 'Email chưa đúng định dạng.' }, 400);
  if (!DOC_RE.test(doc) || doc.length > 500) return json({ error: 'Link cần là link Google Docs (https://docs.google.com/document/...).' }, 400);

  const ip = request.headers.get('CF-Connecting-IP') || '';
  const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM stories WHERE ip = ? AND created_at > ?')
    .bind(ip, now() - 3600).first();
  if (recent.n >= STORY_MAX) return json({ error: 'Bạn đã gửi nhiều truyện trong một giờ qua. Thử lại sau nhé.' }, 429);

  const user = await currentUser(request, env);
  await env.DB.prepare(
    'INSERT INTO stories (title, type, author, email, doc_url, user_id, ip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(title, type, author, email, doc, user ? user.id : null, ip, now()).run();
  return json({ ok: true }, 201);
}

/* ---------- Phiên đăng nhập ---------- */

async function currentUser(request, env) {
  const token = readCookie(request, COOKIE);
  if (!token) return null;
  return env.DB.prepare(
    'SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?'
  ).bind(await sha256(token), now()).first();
}

async function withSession(env, userId, response) {
  const token = randomHex(32);
  const t = now();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(t),
    env.DB.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
      .bind(await sha256(token), userId, t, t + SESSION_DAYS * 86400)
  ]);
  response.headers.append('Set-Cookie', cookie(token, SESSION_DAYS * 86400));
  return response;
}

function cookie(value, maxAge) {
  return `${COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

function readCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  const m = header.match(new RegExp('(?:^|;\\s*)' + name + '=([a-f0-9]{64})'));
  return m ? m[1] : null;
}

async function recordFail(env, key, attempt) {
  const t = now();
  if (!attempt || t - attempt.first_at >= FAIL_WINDOW) {
    await env.DB.prepare('INSERT OR REPLACE INTO login_attempts (key, count, first_at) VALUES (?, 1, ?)').bind(key, t).run();
  } else {
    await env.DB.prepare('UPDATE login_attempts SET count = count + 1 WHERE key = ?').bind(key).run();
  }
}

/* ---------- Tiện ích ---------- */

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar_type ? `/api/avatar/${row.id}?v=${row.avatar_ver}` : null,
    createdAt: row.created_at * 1000
  };
}

function cleanName(value) {
  const name = String(value || '').replace(/\s+/g, ' ').trim();
  return name.length >= 2 && name.length <= 40 ? name : '';
}

/* Chặn gửi form từ trang khác (CSRF): request POST phải đến từ cùng tên miền. */
function sameOrigin(request, url) {
  const origin = request.headers.get('Origin');
  return !origin || origin === url.origin;
}

async function readJson(request) {
  try {
    const data = await request.json();
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }
  });
}

function now() {
  return Math.floor(Date.now() / 1000);
}

function randomHex(bytes) {
  return toHex(crypto.getRandomValues(new Uint8Array(bytes)));
}

function toHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(text) {
  return toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
}

async function hashPassword(password, saltHex) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const salt = new Uint8Array(saltHex.match(/../g).map((h) => parseInt(h, 16)));
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERATIONS }, key, 256);
  return toHex(bits);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
