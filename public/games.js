const gamesGrid = document.getElementById('gamesGrid');
const gameCount = document.getElementById('gameCount');
const search = document.getElementById('search');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');

let allGames = [];

function render(games) {
  gameCount.textContent = `${games.length} Spiele gefunden`;
  gamesGrid.innerHTML = games
    .map(
      (game) => `
        <article class="game-card">
          <h3>${game.title}</h3>
          <div class="genre">${game.genre}</div>
          <a href="${game.url}" target="_blank" rel="noopener noreferrer">Direkt spielen</a>
        </article>
      `
    )
    .join('');
}

search.addEventListener('input', () => {
  const term = search.value.toLowerCase().trim();
  const filtered = allGames.filter(
    (game) => game.title.toLowerCase().includes(term) || game.genre.toLowerCase().includes(term)
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
  userInfo.textContent = `Eingeloggt als ${me.user.email}`;

  const gamesRes = await fetch('/api/games');
  if (!gamesRes.ok) {
    gamesGrid.innerHTML = '<p>Spiele konnten nicht geladen werden.</p>';
    return;
  }

  const data = await gamesRes.json();
  allGames = data.games;
  render(allGames);
}

boot();
