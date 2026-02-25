import { promises as fs } from 'node:fs';
import crypto from 'node:crypto';

const DB_PATH = process.env.DB_PATH || './data.json';

const IDEAS = [
  'Pixel-Krieger','Zombie-Turmverteidiger','Laser-Rettung','Dschungel-Runner','Cyberpunk-Shooter','Meteor-Schlacht','Drachen-Reiter','Geisterjäger','Ninja-Springer','Arena-Kämpfer',
  'Explosions-Ritter','Schwertmagier','Eis-Boss-Battle','Mutanten-Krieger','Wasser-Pistolenkampf','Weltraum-Retter','Vulkan-Survival','Flammen-Zauberer','Sternen-Pilot','Robo-Kriegsführung',
  'Kampf der Gladiatoren','Dämonenjäger','Schlangenkrieger','Turbo-Racer Shooter','Katapult-Belagerung','Meteoriten-Survival','Ritterlauf','Stealth-Agent','Monsterjäger 2D','Hindernis-Labyrinth',
  'Laser-Kampfzone','Sturm-Reiter','Explosions-Kettenreaktion','Vampirjäger','Magische Festung','Luftschiff-Battle','Schießstand Challenge','Roboter-Kampfturnier','Tornado-Jäger','Blitz Ninja',
  'Monster-Kart','Alien-Invasion Defense','Spiegel-Labyrinth','Laser-Labyrinth','Schwert vs Laser','Schleuder-Helden','Eiszeit-Abenteuer','Zeitreise-Kämpfer','Geheime Mission','Explosion Mania'
];

const MODES = ['reaction', 'memory', 'aim', 'math', 'sequence'];

const STOCK_IMAGES = {
  reaction: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80',
  memory: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=900&q=80',
  aim: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80',
  math: 'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?auto=format&fit=crop&w=900&q=80',
  sequence: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80'
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

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildGames() {
  return IDEAS.map((title, index) => {
    const id = index + 1;
    const mode = MODES[index % MODES.length];
    const slug = `${id.toString().padStart(2, '0')}-${slugify(title)}`;
    return {
      id,
      slug,
      title,
      type: mode,
      difficulty: (index % 10) + 1,
      description: `Game ${id} · ${title}`,
      coverImage: STOCK_IMAGES[mode],
      playPath: `/play/${slug}.html`
    };
  });
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
