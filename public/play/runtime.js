const stage = document.getElementById('stage');
const meta = document.getElementById('meta');
const back = document.getElementById('backBtn');

const type = document.body.dataset.type;
const difficulty = Number(document.body.dataset.difficulty || 1);
const title = document.body.dataset.title || 'Spiel';

meta.textContent = `${title} · ${type} · Schwierigkeit ${difficulty}`;
back.onclick = () => {
  window.location.href = '/games.html';
};

function rand(max) {
  return Math.floor(Math.random() * max);
}

function reaction() {
  stage.innerHTML = '<p>Triff das aktive Feld.</p><div class="grid" id="grid"></div><p id="score">0</p>';
  const grid = document.getElementById('grid');
  let score = 0;
  for (let i = 0; i < 16; i += 1) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cell';
    grid.appendChild(b);
  }
  const cells = [...grid.children];
  const target = Math.min(12, difficulty + 4);
  const next = () => {
    cells.forEach((c) => c.classList.remove('on'));
    cells[rand(cells.length)].classList.add('on');
  };
  grid.onclick = (e) => {
    if (!e.target.classList.contains('on')) return;
    score += 1;
    document.getElementById('score').textContent = `Score ${score}/${target}`;
    if (score >= target) return stage.insertAdjacentHTML('beforeend', '<p class="ok">Gewonnen!</p>');
    next();
  };
  next();
}

function aim() {
  stage.innerHTML = '<p>Treffe den Punkt.</p><div class="arena" id="arena"><button id="dot" class="dot" type="button"></button></div><p id="score">0</p>';
  const arena = document.getElementById('arena');
  const dot = document.getElementById('dot');
  let score = 0;
  const target = Math.min(18, difficulty + 6);
  const move = () => {
    dot.style.left = `${Math.random() * Math.max(1, arena.clientWidth - 28)}px`;
    dot.style.top = `${Math.random() * Math.max(1, arena.clientHeight - 28)}px`;
  };
  dot.onclick = () => {
    score += 1;
    document.getElementById('score').textContent = `Treffer ${score}/${target}`;
    if (score >= target) return stage.insertAdjacentHTML('beforeend', '<p class="ok">Stark!</p>');
    move();
  };
  move();
}

function math() {
  const max = 10 + difficulty;
  const a = 1 + rand(max);
  const b = 1 + rand(max);
  stage.innerHTML = `<p>${a} + ${b} = ?</p><input id="ans" type="number" /><button id="ok" type="button">Check</button><p id="res"></p>`;
  document.getElementById('ok').onclick = () => {
    const n = Number(document.getElementById('ans').value);
    document.getElementById('res').textContent = n === a + b ? 'Richtig ✅' : 'Falsch';
  };
}

function memory() {
  const pairs = Math.min(8, 3 + Math.floor(difficulty / 4));
  const vals = Array.from({ length: pairs }, (_, i) => i + 1);
  const cards = [...vals, ...vals].sort(() => Math.random() - 0.5);
  stage.innerHTML = '<p>Finde Paare.</p><div id="mem" class="mem"></div><p id="res"></p>';
  const mem = document.getElementById('mem');
  let first = null;
  let lock = false;
  let found = 0;
  cards.forEach((v) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'm';
    b.textContent = '?';
    b.dataset.v = String(v);
    b.onclick = () => {
      if (lock || b.classList.contains('d') || b === first) return;
      b.textContent = v;
      if (!first) return (first = b);
      if (first.dataset.v === b.dataset.v) {
        first.classList.add('d');
        b.classList.add('d');
        first = null;
        found += 1;
        if (found === pairs) document.getElementById('res').textContent = 'Alle Paare gefunden';
        return;
      }
      lock = true;
      setTimeout(() => {
        first.textContent = '?';
        b.textContent = '?';
        first = null;
        lock = false;
      }, 500);
    };
    mem.appendChild(b);
  });
}

function sequence() {
  const len = Math.min(8, 3 + Math.floor(difficulty / 4));
  const seq = Array.from({ length: len }, () => 1 + rand(4));
  stage.innerHTML = `<p>Merke: ${seq.join('-')}</p><input id="inp" placeholder="1-2-3" /><button id="ok" type="button">Prüfen</button><p id="res"></p>`;
  document.getElementById('ok').onclick = () => {
    const arr = document.getElementById('inp').value.split(/[-,\s]+/).map(Number).filter(Boolean);
    const ok = arr.length === seq.length && arr.every((n, i) => n === seq[i]);
    document.getElementById('res').textContent = ok ? 'Perfekt!' : `Falsch (${seq.join('-')})`;
  };
}

if (type === 'reaction') reaction();
else if (type === 'aim') aim();
else if (type === 'math') math();
else if (type === 'memory') memory();
else sequence();
