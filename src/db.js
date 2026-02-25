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

const MODE_OBJECTIVE = {
  reaction: 'Reaktions-Action: Triff schnell aktive Ziele und weiche Risiken aus.',
  memory: 'Taktik & Puzzle: Finde Muster, kombiniere Karten und löse Erinnerungsrätsel.',
  aim: 'Shooter-Fokus: Ziele präzise, triggere Combos und halte den Druck hoch.',
  math: 'Skill + Logik: Rechne schnell und nutze Entscheidungen für Vorteile.',
  sequence: 'Rhythmus & Planung: Merke Sequenzen und führe sie fehlerfrei aus.'
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

function pickDimension(title, index) {
  const threeDHints = ['Labyrinth', 'Turm', 'Racer', 'Kart', 'Battle', 'Arena', 'Kampfzone', 'Survival'];
  if (threeDHints.some((h) => title.includes(h))) return '3D';
  return index % 3 === 0 ? '3D' : '2D';
}

function buildGames() {
  return IDEAS.map((title, index) => {
    const id = index + 1;
    const type = MODES[index % MODES.length];
    const slug = `${id.toString().padStart(2, '0')}-${slugify(title)}`;
    const dimension = pickDimension(title, index);
    const difficulty = (index % 10) + 1;

    return {
      id,
      slug,
      title,
      type,
      dimension,
      difficulty,
      objective: MODE_OBJECTIVE[type],
      description: `${dimension} ${type.toUpperCase()} · ${title}`,
      coverImage: `/assets/covers/${slug}.svg`,
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
