import { promises as fs } from 'node:fs';

const DB_PATH = process.env.DB_PATH || './data.json';

const gameFamilies = [
  { type: 'reaction', title: 'Reaction Grid' },
  { type: 'memory', title: 'Memory Flip' },
  { type: 'aim', title: 'Aim Trainer' },
  { type: 'math', title: 'Math Rush' },
  { type: 'sequence', title: 'Sequence Tap' }
];

function buildGames() {
  const games = [];
  let id = 1;
  for (const family of gameFamilies) {
    for (let level = 1; level <= 24; level += 1) {
      games.push({
        id,
        slug: `${family.type}-${level}`,
        title: `${family.title} ${level}`,
        type: family.type,
        difficulty: level,
        description: `Level ${level} - spiele direkt auf der Seite.`
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

  if (!Array.isArray(db.users)) db.users = [];
  if (!Array.isArray(db.games) || db.games.length < 100) db.games = buildGames();

  await writeDb(db);

  return {
    async allUsers() {
      return db.users;
    },
    async findUserByEmail(email) {
      return db.users.find((u) => u.email === email) || null;
    },
    async addUser(user) {
      const nextId = db.users.length ? Math.max(...db.users.map((u) => u.id)) + 1 : 1;
      const entry = { id: nextId, ...user, createdAt: new Date().toISOString() };
      db.users.push(entry);
      await writeDb(db);
      return entry;
    },
    async getGames() {
      return db.games;
    }
  };
}
