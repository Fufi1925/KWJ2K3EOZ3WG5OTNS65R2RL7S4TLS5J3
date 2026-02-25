const gamesGrid = document.getElementById('gamesGrid');
const gameCount = document.getElementById('gameCount');
const search = document.getElementById('search');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');
const stage = document.getElementById('stage');
const stageTitle = document.getElementById('stageTitle');
const stageMeta = document.getElementById('stageMeta');

let allGames = [];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function renderReaction(game) {
  stage.innerHTML = '<p>Klicke das grüne Feld so schnell wie möglich. 10 Punkte gewinnen!</p><div class="mini-grid" id="miniGrid"></div><p id="score">Score: 0</p>';
  const grid = document.getElementById('miniGrid');
  let score = 0;
  for (let i = 0; i < 16; i += 1) {
    const btn = document.createElement('button');
    btn.className = 'mini-btn';
    grid.appendChild(btn);
  }
  const cells = [...grid.children];
  function next() {
    cells.forEach((c) => c.classList.remove('active'));
    pick(cells).classList.add('active');
  }
  grid.addEventListener('click', (e) => {
    if (e.target.classList.contains('active')) {
      score += 1;
      document.getElementById('score').textContent = `Score: ${score}`;
      if (score >= Math.min(10, game.difficulty + 4)) {
        stage.innerHTML += '<p class="ok">Gewonnen!</p>';
      }
      next();
    }
  });
  next();
}

function renderAim(game) {
  stage.innerHTML = '<p>Treffe den Punkt so oft wie möglich.</p><div class="aim-area" id="aimArea"><button class="dot" id="dot"></button></div><p id="score">Treffer: 0</p>';
  const area = document.getElementById('aimArea');
  const dot = document.getElementById('dot');
  let score = 0;
  function moveDot() {
    const x = Math.random() * (area.clientWidth - 28);
    const y = Math.random() * (area.clientHeight - 28);
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
  }
  dot.addEventListener('click', () => {
    score += 1;
    document.getElementById('score').textContent = `Treffer: ${score}`;
    if (score >= Math.min(15, game.difficulty + 5)) stage.innerHTML += '<p class="ok">Stark gespielt!</p>';
    moveDot();
  });
  moveDot();
}

function renderMath(game) {
  const max = 10 + game.difficulty;
  const a = Math.ceil(Math.random() * max);
  const b = Math.ceil(Math.random() * max);
  stage.innerHTML = `<p>Löse: <strong>${a} + ${b}</strong></p><input id="answer" type="number" /><button id="check">Prüfen</button><p id="result"></p>`;
  document.getElementById('check').addEventListener('click', () => {
    const val = Number(document.getElementById('answer').value);
    document.getElementById('result').textContent = val === a + b ? 'Richtig ✅' : 'Leider falsch';
  });
}

function renderMemory(game) {
  const pairs = Math.min(8, 3 + Math.floor(game.difficulty / 4));
  const values = Array.from({ length: pairs }, (_, i) => i + 1);
  const cards = [...values, ...values].sort(() => Math.random() - 0.5);
  stage.innerHTML = '<p>Finde alle Paare.</p><div class="memory-grid" id="memory"></div><p id="result"></p>';
  const memory = document.getElementById('memory');
  let first = null;
  let lock = false;
  let found = 0;
  cards.forEach((value) => {
    const card = document.createElement('button');
    card.className = 'memory-card';
    card.dataset.value = String(value);
    card.textContent = '?';
    card.addEventListener('click', () => {
      if (lock || card.classList.contains('done') || card === first) return;
      card.textContent = value;
      if (!first) {
        first = card;
        return;
      }
      if (first.dataset.value === card.dataset.value) {
        first.classList.add('done');
        card.classList.add('done');
        found += 1;
        if (found === pairs) document.getElementById('result').textContent = 'Alle Paare gefunden!';
        first = null;
        return;
      }
      lock = true;
      setTimeout(() => {
        first.textContent = '?';
        card.textContent = '?';
        first = null;
        lock = false;
      }, 550);
    });
    memory.appendChild(card);
  });
}

function renderSequence(game) {
  const length = Math.min(8, 3 + Math.floor(game.difficulty / 4));
  const seq = Array.from({ length }, () => Math.ceil(Math.random() * 4));
  stage.innerHTML = `<p>Merke dir die Folge: <strong>${seq.join(' - ')}</strong></p><p>Tippe sie ein (z.B. 1-2-3)</p><input id="seqInput" /><button id="seqCheck">Prüfen</button><p id="seqResult"></p>`;
  document.getElementById('seqCheck').addEventListener('click', () => {
    const user = document
      .getElementById('seqInput')
      .value.split(/[-,\s]+/)
      .map((n) => Number(n))
      .filter(Boolean);
    const ok = user.length === seq.length && user.every((n, i) => n === seq[i]);
    document.getElementById('seqResult').textContent = ok ? 'Perfekt!' : `Nicht ganz. Folge war ${seq.join('-')}`;
  });
}

function launchGame(game) {
  stageTitle.textContent = game.title;
  stageMeta.textContent = `${game.type} · Schwierigkeit ${game.difficulty}`;
  if (game.type === 'reaction') return renderReaction(game);
  if (game.type === 'memory') return renderMemory(game);
  if (game.type === 'aim') return renderAim(game);
  if (game.type === 'math') return renderMath(game);
  return renderSequence(game);
}

function render(games) {
  gameCount.textContent = `${games.length} Spiele verfügbar`;
  gamesGrid.innerHTML = games
    .map(
      (game) => `<article class="game-card"><h3>${game.title}</h3><div class="genre">${game.type} · Lvl ${game.difficulty}</div><button class="play-btn" data-id="${game.id}">Jetzt spielen</button></article>`
    )
    .join('');

  gamesGrid.querySelectorAll('.play-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const game = allGames.find((g) => g.id === Number(btn.dataset.id));
      if (game) launchGame(game);
    });
  });
}

search.addEventListener('input', () => {
  const term = search.value.toLowerCase().trim();
  const filtered = allGames.filter((g) => g.title.toLowerCase().includes(term) || g.type.toLowerCase().includes(term));
  render(filtered);
});

logoutBtn.addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/';
});

async function boot() {
  const meRes = await fetch('/api/me');
  if (!meRes.ok) return (window.location.href = '/');
  const me = await meRes.json();
  userInfo.textContent = `Eingeloggt als ${me.user.email}`;
  const gamesRes = await fetch('/api/games');
  if (!gamesRes.ok) return;
  const data = await gamesRes.json();
  allGames = data.games;
  render(allGames);
}

boot();
