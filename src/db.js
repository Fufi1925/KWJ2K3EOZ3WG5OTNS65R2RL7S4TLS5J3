import { promises as fs } from 'node:fs';
import crypto from 'node:crypto';

const DB_PATH = './data.json';

function buildGames() {
  const games = [];
  const bases = ['https://www.crazygames.com/game/', 'https://poki.com/en/g/', 'https://www.miniclip.com/games/'];
  for (let i = 1; i <= 120; i += 1) {
    games.push({
      id: i,
      title: `Game ${i}`,
      genre: ['Action', 'Puzzle', 'Racing', 'Arcade'][i % 4],
      url: `${bases[i % bases.length]}demo-${i}`
    });
  }
  return games;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, originalHash] = stored.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(originalHash));
}

async function writeDb(db) {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

export async function initDb() {
  let db;
  try {
    const raw = await fs.readFile(DB_PATH, 'utf8');
    db = JSON.parse(raw);
  } catch {
    db = { users: [], games: [] };
  }

  if (!Array.isArray(db.users)) db.users = [];
  if (!Array.isArray(db.games)) db.games = [];

  const hasDemo = db.users.some((u) => u.email === 'demo@arcade.com');
  if (!hasDemo) {
    db.users.push({
      id: 1,
      email: 'demo@arcade.com',
      passwordHash: hashPassword('Demo1234!'),
      createdAt: new Date().toISOString()
    });
  }

  if (db.games.length < 100) {
    db.games = buildGames();
  }

  await writeDb(db);

  return {
    async findUserByEmail(email) {
      return db.users.find((u) => u.email === email) || null;
    },
    async getGames() {
      return db.games;
    },
    verifyPassword,
    async save() {
      await writeDb(db);
    }
  };
}
