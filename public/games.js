const gamesGrid = document.getElementById('gamesGrid');
const gameCount = document.getElementById('gameCount');
const search = document.getElementById('search');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');

let allGames = [];

function sendEvent(event, game = '') {
  navigator.sendBeacon(
    '/api/event',
    new Blob([JSON.stringify({ event, game })], { type: 'application/json' })
  );
}

function launchGame(game) {
  if (!game) return;
  sendEvent('game_open', game.title);
  window.location.href = game.playPath;
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
      (game) => `
      <article class="game-card">
        <img class="game-image" src="${game.coverImage}" alt="${game.title}" loading="lazy" />
        <div class="game-topline">
          <div class="game-cover">${gameIcon(game.type)} ${game.type.toUpperCase()}</div>
          <div class="dimension">${game.dimension}</div>
        </div>
        <h3>${game.title}</h3>
        <div class="genre">${game.description}</div>
        <button class="play-btn" data-id="${game.id}" type="button">Jetzt spielen</button>
      </article>`
    )
    .join('');
}

gamesGrid.addEventListener('click', (event) => {
  const button = event.target.closest('.play-btn');
  if (!button) return;
  const game = allGames.find((g) => g.id === Number(button.dataset.id));
  launchGame(game);
});

search.addEventListener('input', () => {
  const term = search.value.toLowerCase().trim();
  const filtered = allGames.filter(
    (g) => g.title.toLowerCase().includes(term) || g.type.toLowerCase().includes(term) || g.dimension.toLowerCase().includes(term)
  );
  render(filtered);
});

logoutBtn.addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/';
});

async function boot() {
  const meRes = await fetch('/api/me');
  if (!meRes.ok) {
    window.location.href = '/';
    return;
  }

  const me = await meRes.json();
  userInfo.textContent = `Angemeldet als ${me.user.username}`;

  const gamesRes = await fetch('/api/games');
  if (!gamesRes.ok) return;
  const data = await gamesRes.json();
  allGames = data.games;
  render(allGames);
  sendEvent('games_page_view');
}

boot();
