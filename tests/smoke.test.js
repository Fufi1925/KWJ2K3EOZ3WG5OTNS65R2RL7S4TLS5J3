import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const PORT = 3199;
let server;

function waitForServer() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Server start timeout')), 10000);
    server.stdout.on('data', (chunk) => {
      if (chunk.toString().includes('Server läuft')) {
        clearTimeout(timeout);
        resolve();
      }
    });
    server.on('error', reject);
  });
}

test.before(async () => {
  server = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: String(PORT), JWT_SECRET: 'test-secret' }
  });
  await waitForServer();
});

test.after(() => {
  server.kill('SIGTERM');
});

test('health endpoint works', async () => {
  const response = await fetch(`http://127.0.0.1:${PORT}/api/health`);
  assert.equal(response.status, 200);
});

test('login and games endpoint work', async () => {
  const loginRes = await fetch(`http://127.0.0.1:${PORT}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@arcade.com', password: 'Demo1234!' })
  });

  assert.equal(loginRes.status, 200);
  const cookie = loginRes.headers.get('set-cookie');
  assert.ok(cookie);

  const gamesRes = await fetch(`http://127.0.0.1:${PORT}/api/games`, {
    headers: { Cookie: cookie }
  });

  assert.equal(gamesRes.status, 200);
  const payload = await gamesRes.json();
  assert.ok(Array.isArray(payload.games));
  assert.ok(payload.games.length >= 100);
});
