import http from 'node:http';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import crypto from 'node:crypto';
import { initDb } from './src/db.js';

const PORT = Number(process.env.PORT || 3000);
const SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const db = await initDb();

const sessions = new Map();

function json(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  return Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((pair) => {
        const i = pair.indexOf('=');
        return [pair.slice(0, i), decodeURIComponent(pair.slice(i + 1))];
      })
  );
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) {
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function createSession(user) {
  const random = crypto.randomBytes(32).toString('hex');
  const signature = crypto.createHmac('sha256', SECRET).update(random).digest('hex');
  const token = `${random}.${signature}`;
  sessions.set(token, { id: user.id, email: user.email, expires: Date.now() + 8 * 60 * 60 * 1000 });
  return token;
}

function getSession(req) {
  const cookies = parseCookies(req);
  const token = cookies.session;
  const session = token ? sessions.get(token) : null;
  if (!session) return null;
  if (session.expires < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return { token, user: { id: session.id, email: session.email } };
}

async function serveStatic(req, res) {
  let pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
  if (pathname === '/') pathname = '/index.html';
  const filePath = path.join(PUBLIC_DIR, pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const ext = path.extname(filePath);
    const map = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8'
    };
    const content = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': map[ext] || 'application/octet-stream' });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && pathname === '/api/health') {
    return json(res, 200, { status: 'ok' });
  }

  if (req.method === 'POST' && pathname === '/api/login') {
    try {
      const body = await readBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      if (!email || !password) return json(res, 400, { error: 'E-Mail und Passwort sind erforderlich.' });

      const user = await db.findUserByEmail(email);
      if (!user || !db.verifyPassword(password, user.passwordHash)) {
        return json(res, 401, { error: 'Login fehlgeschlagen.' });
      }

      const token = createSession(user);
      res.setHeader('Set-Cookie', `session=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=28800; SameSite=Lax`);
      return json(res, 200, { success: true });
    } catch {
      return json(res, 400, { error: 'Ungültige Anfrage' });
    }
  }

  if (req.method === 'POST' && pathname === '/api/logout') {
    const session = getSession(req);
    if (session) sessions.delete(session.token);
    res.setHeader('Set-Cookie', 'session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
    return json(res, 200, { success: true });
  }

  if (req.method === 'GET' && pathname === '/api/me') {
    const session = getSession(req);
    if (!session) return json(res, 401, { error: 'Nicht eingeloggt' });
    return json(res, 200, { user: session.user });
  }

  if (req.method === 'GET' && pathname === '/api/games') {
    const session = getSession(req);
    if (!session) return json(res, 401, { error: 'Nicht eingeloggt' });
    const games = await db.getGames();
    return json(res, 200, { games });
  }

  return serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
