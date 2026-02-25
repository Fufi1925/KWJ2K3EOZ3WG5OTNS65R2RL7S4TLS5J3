import { promises as fs } from 'node:fs';
import crypto from 'node:crypto';

const DB_PATH = process.env.DB_PATH || './data.json';

const GAME_POOLS = {
  reaction: ['Neon Click', 'Blitz Reflex', 'Pulse Tap', 'Quick Pixel', 'Turbo Finger'],
  memory: ['Card Recall', 'Mind Mirror', 'Twin Hunt', 'Echo Pair', 'Memory Storm'],
  aim: ['Dot Hunter', 'Sniper Pop', 'Target Rush', 'Aim Pulse', 'Focus Shot'],
  math: ['Zahlen Sprint', 'Plus Master', 'Brain Calc', 'Rapid Sum', 'Logic Count'],
  sequence: ['Pattern Flow', 'Code Track', 'Signal Chain', 'Order Lock', 'Rhythm Path']
};

const FIXED_USER = {
  id: 1,
  username: 'Test67',
  passwordHash: hashPassword('676767'),
  createdAt: new Date().toISOString()
};

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function buildGames() {
  const types = Object.keys(GAME_POOLS);
  const games = [];
  let id = 1;

  for (const type of types) {
    for (let level = 1; level <= 24; level += 1) {
      const baseName = GAME_POOLS[type][(level - 1) % GAME_POOLS[type].length];
      const slug = `${type}-${level}`;
      games.push({
        id,
        slug,
        title: `${baseName} ${level}`,
        type,
        difficulty: level,
        description: `${baseName} · Schwierigkeit ${level}`,
        coverImage: `/assets/covers/${slug}.svg`,
        playPath: `/play/${slug}.html`
      });
      id += 1;
    }
  }

  return games;
}

async function writeDb(db) {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

export async function initDb() {
  let db;
  try {
    db = JSON.parse(await fs.readFile(DB_PATH, 'utf8'));
  } catch {
    db = { users: [], games: [] };
  }

  db.users = [FIXED_USER];
  db.games = buildGames();

  await writeDb(db);

  return {
    async findUserByUsername(username) {
      return db.users.find((u) => u.username.toLowerCase() === String(username).toLowerCase()) || null;
    },
    async getGames() {
      return db.games;
    }
  };
}
