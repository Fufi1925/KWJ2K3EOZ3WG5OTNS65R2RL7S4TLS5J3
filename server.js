import http from 'node:http';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import crypto from 'node:crypto';
import { initDb } from './src/db.js';

const PORT = Number(process.env.PORT || 3000);
const SECRET = process.env.JWT_SECRET || 'change-this-secret';
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const db = await initDb();
const sessions = new Map();

function json(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function parseCookies(req) {
  const raw = req.headers.cookie || '';
  return Object.fromEntries(
    raw
      .split(';')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const i = p.indexOf('=');
        return [p.slice(0, i), decodeURIComponent(p.slice(i + 1))];
      })
  );
}

function verifyPassword(password, stored) {
  const [salt, original] = String(stored).split(':');
  if (!salt || !original) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(original));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) reject(new Error('too large'));
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('invalid json'));
      }
    });
    req.on('error', reject);
  });
}

function createSession(user) {
  const raw = crypto.randomBytes(32).toString('hex');
  const sig = crypto.createHmac('sha256', SECRET).update(raw).digest('hex');
  const token = `${raw}.${sig}`;
  sessions.set(token, { id: user.id, username: user.username, expires: Date.now() + 8 * 60 * 60 * 1000 });
  return token;
}

function getSession(req) {
  const token = parseCookies(req).session;
  const session = token ? sessions.get(token) : null;
  if (!session) return null;
  if (session.expires < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return { token, user: { id: session.id, username: session.username } };
}

function clientInfo(req) {
  const ipHeader = req.headers['x-forwarded-for'];
  const ip = typeof ipHeader === 'string' ? ipHeader.split(',')[0].trim() : req.socket.remoteAddress || 'unknown';
  const ua = req.headers['user-agent'] || 'unknown';
  return { ip, ua };
}

async function sendDiscordLog(title, details) {
  if (!DISCORD_WEBHOOK_URL) return;
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Fufihub Logger',
        embeds: [
          {
            title,
            description: details,
            color: 5814783,
            timestamp: new Date().toISOString()
          }
        ]
      })
    });
  } catch {
    // ignore webhook errors
  }
}

async function serveStatic(req, res) {
  let pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
  if (pathname === '/') pathname = '/index.html';
  const filePath = path.join(PUBLIC_DIR, pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) return json(res, 403, { error: 'Forbidden' });

  try {
    const ext = path.extname(filePath);
    const content = await fs.readFile(filePath);
    const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.svg': 'image/svg+xml; charset=utf-8' };
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && pathname === '/api/health') return json(res, 200, { status: 'ok' });

  if (req.method === 'POST' && pathname === '/api/login') {
    try {
      const body = await readBody(req);
      const username = String(body.username || '').trim();
      const password = String(body.password || '');
      const user = await db.findUserByUsername(username);

      if (!user || !verifyPassword(password, user.passwordHash)) {
        return json(res, 401, { error: 'Login fehlgeschlagen.' });
      }

      const token = createSession(user);
      const info = clientInfo(req);
      await sendDiscordLog('🔐 Login', `User: **${user.username}**\nIP: ${info.ip}\nUA: ${info.ua}`);
      res.setHeader('Set-Cookie', `session=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=28800; SameSite=Lax`);
      return json(res, 200, { success: true });
    } catch {
      return json(res, 400, { error: 'Ungültige Anfrage' });
    }
  }

  if (req.method === 'POST' && pathname === '/api/event') {
    const s = getSession(req);
    if (!s) return json(res, 401, { error: 'Nicht eingeloggt' });

    try {
      const body = await readBody(req);
      const event = String(body.event || 'unknown');
      const game = String(body.game || '');
      const info = clientInfo(req);
      await sendDiscordLog('🎮 Event', `User: **${s.user.username}**\nEvent: **${event}**\nGame: ${game || '-'}\nIP: ${info.ip}`);
      return json(res, 200, { success: true });
    } catch {
      return json(res, 400, { error: 'Ungültige Anfrage' });
    }
  }

  if (req.method === 'POST' && pathname === '/api/logout') {
    const s = getSession(req);
    if (s) sessions.delete(s.token);
    res.setHeader('Set-Cookie', 'session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
    return json(res, 200, { success: true });
  }

  if (req.method === 'GET' && pathname === '/api/me') {
    const s = getSession(req);
    if (!s) return json(res, 401, { error: 'Nicht eingeloggt' });
    return json(res, 200, { user: s.user });
  }

  if (req.method === 'GET' && pathname === '/api/games') {
    const s = getSession(req);
    if (!s) return json(res, 401, { error: 'Nicht eingeloggt' });
    return json(res, 200, { games: await db.getGames() });
  }

  return serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
