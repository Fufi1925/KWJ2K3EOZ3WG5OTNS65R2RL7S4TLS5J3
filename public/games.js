const gamesGrid = document.getElementById('gamesGrid');
const gameCount = document.getElementById('gameCount');
const search = document.getElementById('search');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');
const stage = document.getElementById('stage');
const stageTitle = document.getElementById('stageTitle');
const stageMeta = document.getElementById('stageMeta');

let allGames = [];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function setStage(title, meta, content) {
  stageTitle.textContent = title;
  stageMeta.textContent = meta;
  stage.innerHTML = content;
}

function renderReaction(game) {
  setStage(
    game.title,
    `${game.type} · Schwierigkeit ${game.difficulty}`,
    '<p>Klicke das grüne Feld so schnell wie möglich.</p><div class="mini-grid" id="miniGrid"></div><p id="score">Score: 0</p>'
  );

  const grid = document.getElementById('miniGrid');
  let score = 0;
  for (let i = 0; i < 16; i += 1) {
    const btn = document.createElement('button');
    btn.className = 'mini-btn';
    btn.type = 'button';
    grid.appendChild(btn);
  }

  const cells = [...grid.children];
  const target = Math.min(10, game.difficulty + 4);

  function next() {
    cells.forEach((c) => c.classList.remove('active'));
    randomItem(cells).classList.add('active');
  }

  grid.onclick = (event) => {
    if (!event.target.classList.contains('active')) return;
    score += 1;
    document.getElementById('score').textContent = `Score: ${score} / ${target}`;
    if (score >= target) {
      stage.insertAdjacentHTML('beforeend', '<p class="ok">Gewonnen!</p>');
      return;
    }
    next();
  };

  next();
}

function renderAim(game) {
  setStage(
    game.title,
    `${game.type} · Schwierigkeit ${game.difficulty}`,
    '<p>Treffe den Punkt so oft wie möglich.</p><div class="aim-area" id="aimArea"><button class="dot" id="dot" type="button"></button></div><p id="score">Treffer: 0</p>'
  );

  const area = document.getElementById('aimArea');
  const dot = document.getElementById('dot');
  let score = 0;
  const target = Math.min(15, game.difficulty + 5);

  function moveDot() {
    const x = Math.random() * Math.max(1, area.clientWidth - 28);
    const y = Math.random() * Math.max(1, area.clientHeight - 28);
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
  }

  dot.onclick = () => {
    score += 1;
    document.getElementById('score').textContent = `Treffer: ${score} / ${target}`;
    if (score >= target) {
      stage.insertAdjacentHTML('beforeend', '<p class="ok">Stark gespielt!</p>');
      return;
    }
    moveDot();
  };

  moveDot();
}

function renderMath(game) {
  const max = 10 + game.difficulty;
  const a = Math.ceil(Math.random() * max);
  const b = Math.ceil(Math.random() * max);
  setStage(
    game.title,
    `${game.type} · Schwierigkeit ${game.difficulty}`,
    `<p>Löse: <strong>${a} + ${b}</strong></p><input id="answer" type="number" /><button id="check" type="button">Prüfen</button><p id="result"></p>`
  );

  document.getElementById('check').onclick = () => {
    const val = Number(document.getElementById('answer').value);
    document.getElementById('result').textContent = val === a + b ? 'Richtig ✅' : 'Leider falsch';
  };
}

function renderMemory(game) {
  const pairs = Math.min(8, 3 + Math.floor(game.difficulty / 4));
  const values = Array.from({ length: pairs }, (_, i) => i + 1);
  const cards = [...values, ...values].sort(() => Math.random() - 0.5);

  setStage(
    game.title,
    `${game.type} · Schwierigkeit ${game.difficulty}`,
    '<p>Finde alle Paare.</p><div class="memory-grid" id="memory"></div><p id="result"></p>'
  );

  const memory = document.getElementById('memory');
  let first = null;
  let lock = false;
  let found = 0;

  cards.forEach((value) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'memory-card';
    card.dataset.value = String(value);
    card.textContent = '?';

    card.onclick = () => {
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
    };

    memory.appendChild(card);
  });
}

function renderSequence(game) {
  const length = Math.min(8, 3 + Math.floor(game.difficulty / 4));
  const seq = Array.from({ length }, () => Math.ceil(Math.random() * 4));

  setStage(
    game.title,
    `${game.type} · Schwierigkeit ${game.difficulty}`,
    `<p>Merke dir die Folge: <strong>${seq.join(' - ')}</strong></p><p>Tippe sie ein (z.B. 1-2-3)</p><input id="seqInput" /><button id="seqCheck" type="button">Prüfen</button><p id="seqResult"></p>`
  );

  document.getElementById('seqCheck').onclick = () => {
    const user = document
      .getElementById('seqInput')
      .value.split(/[-,\s]+/)
      .map((n) => Number(n))
      .filter(Boolean);
    const ok = user.length === seq.length && user.every((n, i) => n === seq[i]);
    document.getElementById('seqResult').textContent = ok ? 'Perfekt!' : `Nicht ganz. Folge war ${seq.join('-')}`;
  };
}

function launchGame(game) {
  if (!game) return;
  if (game.type === 'reaction') return renderReaction(game);
  if (game.type === 'memory') return renderMemory(game);
  if (game.type === 'aim') return renderAim(game);
  if (game.type === 'math') return renderMath(game);
  return renderSequence(game);
}

function gameIcon(type) {
  if (type === 'reaction') return '⚡';
  if (type === 'memory') return '🧠';
  if (type === 'aim') return '🎯';
  if (type === 'math') return '➕';
  return '🔢';
}

function render(games) {
  gameCount.textContent = `${games.length} Spiele verfügbar`;
  gamesGrid.innerHTML = games
    .map(
      (game) => `<article class="game-card"><div class="game-cover">${gameIcon(game.type)} ${game.type.toUpperCase()}</div><h3>${game.title}</h3><div class="genre">${game.description}</div><button class="play-btn" data-id="${game.id}" type="button">Jetzt spielen</button></article>`
    )
    .join('');
}

gamesGrid.onclick = (event) => {
  const button = event.target.closest('.play-btn');
  if (!button) return;
  const game = allGames.find((g) => g.id === Number(button.dataset.id));
  launchGame(game);
};

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
  userInfo.textContent = `Angemeldet als ${me.user.username}`;

  const gamesRes = await fetch('/api/games');
  if (!gamesRes.ok) return;
  const data = await gamesRes.json();
  allGames = data.games;
  render(allGames);
  launchGame(allGames[0]);
}

boot();
