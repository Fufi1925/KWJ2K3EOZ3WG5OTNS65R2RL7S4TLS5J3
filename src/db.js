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

function pickType(title) {
  const t = title.toLowerCase();
  if (t.includes('shooter') || t.includes('laser') || t.includes('schieß') || t.includes('schwert vs laser')) return 'aim';
  if (t.includes('labyrinth') || t.includes('mission') || t.includes('runner') || t.includes('survival')) return 'sequence';
  if (t.includes('kart') || t.includes('racer') || t.includes('pilot') || t.includes('reiter') || t.includes('weltraum')) return 'reaction';
  if (t.includes('puzzle') || t.includes('spiegel') || t.includes('tower') || t.includes('turm')) return 'memory';
  return 'math';
}

function pickDimension(title, index) {
  const threeDHints = ['labyrinth', 'turm', 'racer', 'kart', 'battle', 'arena', 'kampfzone', 'survival', 'shooter'];
  const t = title.toLowerCase();
  if (threeDHints.some((h) => t.includes(h))) return '3D';
  return index % 3 === 0 ? '3D' : '2D';
}

function objectiveFor(type, title) {
  if (type === 'aim') return `Shooter-Gameplay für ${title}: präzise zielen, Gegner treffen, Schaden vermeiden.`;
  if (type === 'sequence') return `${title}: Routen, Muster und Timing meistern, um das Ziel zu erreichen.`;
  if (type === 'reaction') return `${title}: schnelle Bewegung, Ausweichen und perfektes Timing sind entscheidend.`;
  if (type === 'memory') return `${title}: strategisch planen, Muster erkennen und clever reagieren.`;
  return `${title}: Ressourcen, Skill und Entscheidungen kombinieren, um zu gewinnen.`;
}

function buildGames() {
  return IDEAS.map((title, index) => {
    const id = index + 1;
    const type = pickType(title);
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
      objective: objectiveFor(type, title),
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
