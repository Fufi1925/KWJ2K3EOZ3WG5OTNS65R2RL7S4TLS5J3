const stage = document.getElementById('stage');
const meta = document.getElementById('meta');
const back = document.getElementById('backBtn');

const type = document.body.dataset.type;
const difficulty = Number(document.body.dataset.difficulty || 1);
const title = document.body.dataset.title || 'Spiel';
const dimension = document.body.dataset.dimension || '2D';
const cover = document.body.dataset.cover || '';
const objective = document.body.dataset.objective || '';

meta.textContent = `${title} · ${dimension} · ${type} · Schwierigkeit ${difficulty}`;
back.onclick = () => {
  window.location.href = '/games.html';
};

function rand(max) {
  return Math.floor(Math.random() * max);
}

function endScreen(text) {
  stage.insertAdjacentHTML('beforeend', `<div class="end-panel"><p>${text}</p><button id="replayBtn" type="button">Nochmal spielen</button></div>`);
  document.getElementById('replayBtn').onclick = () => showStartScreen();
}

function showStartScreen() {
  stage.innerHTML = `
    <div class="start-screen">
      <img class="start-cover" src="${cover}" alt="${title}" />
      <div class="start-info">
        <h2>${title}</h2>
        <p>${objective}</p>
        <button id="startBtn" type="button">▶ Play</button>
      </div>
    </div>
  `;
  document.getElementById('startBtn').onclick = () => runGame();
}

function render3DChallenge() {
  stage.innerHTML = '<p>3D-Run: Weiche Blöcken aus und sammle Punkte.</p><canvas id="c3d" width="760" height="340"></canvas><p id="score3d">Score: 0</p>';
  const c = document.getElementById('c3d');
  const ctx = c.getContext('2d');
  const player = { lane: 1 };
  const lanes = [230, 380, 530];
  let score = 0;
  let over = false;
  const speed = 2 + difficulty * 0.35;
  const obstacles = [];

  function spawn() {
    obstacles.push({ lane: rand(3), z: 1 });
  }

  function drawRoad() {
    ctx.fillStyle = '#090f17';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = '#2b3e59';
    for (let i = 0; i < 20; i += 1) {
      const y = 40 + i * 18;
      ctx.beginPath();
      ctx.moveTo(140 - i * 5, y);
      ctx.lineTo(620 + i * 5, y);
      ctx.stroke();
    }
  }

  function drawPlayer() {
    ctx.fillStyle = '#3bf3b2';
    const x = lanes[player.lane] - 18;
    const y = 280;
    ctx.fillRect(x, y, 36, 36);
  }

  function drawObstacle(o) {
    const scale = 1.5 - o.z;
    const size = Math.max(16, 44 * scale);
    const y = 40 + (1 - o.z) * 260;
    const x = lanes[o.lane] - size / 2;
    ctx.fillStyle = '#ff6f8c';
    ctx.fillRect(x, y, size, size);
  }

  function tick() {
    if (over) return;
    if (Math.random() < 0.04 + difficulty * 0.004) spawn();

    drawRoad();
    obstacles.forEach((o) => {
      o.z -= 0.008 * speed;
      drawObstacle(o);
    });
    drawPlayer();

    for (const o of obstacles) {
      if (o.z < 0.12 && o.z > 0.02 && o.lane === player.lane) {
        over = true;
        endScreen('Game Over – versuche es erneut.');
      }
    }

    for (let i = obstacles.length - 1; i >= 0; i -= 1) {
      if (obstacles[i].z <= 0) {
        obstacles.splice(i, 1);
        score += 1;
        document.getElementById('score3d').textContent = `Score: ${score}`;
        if (score >= 10 + difficulty) {
          over = true;
          endScreen('Gewonnen! Stark gefahren.');
        }
      }
    }

    requestAnimationFrame(tick);
  }

  document.onkeydown = (e) => {
    if (e.key === 'ArrowLeft') player.lane = Math.max(0, player.lane - 1);
    if (e.key === 'ArrowRight') player.lane = Math.min(2, player.lane + 1);
  };

  tick();
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
    if (score >= target) return endScreen('Gewonnen! Reaktionsspiel geschafft.');
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
    if (score >= target) return endScreen('Trefferziel erreicht!');
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
    if (n === a + b) {
      setTimeout(() => endScreen('Richtige Antwort! Nochmal?'), 250);
    }
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
        if (found === pairs) endScreen('Alle Paare gefunden!');
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
    if (ok) setTimeout(() => endScreen('Sequenz gemeistert!'), 250);
  };
}

function runGame() {
  if (dimension === '3D') {
    render3DChallenge();
    return;
  }
  if (type === 'reaction') return reaction();
  if (type === 'aim') return aim();
  if (type === 'math') return math();
  if (type === 'memory') return memory();
  return sequence();
}

showStartScreen();
