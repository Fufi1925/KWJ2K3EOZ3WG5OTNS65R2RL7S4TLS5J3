let players = [];
let imposterIndex;
let secretWord;

const words = [
  "Apfel","Auto","Hund","Katze","Pizza",
  "Handy","Laptop","Buch","Wasser",
  "Hotel","Insel","Berg","Stadt",
  "Restaurant","Flugzeug"
];

function createInputs() {
  const count = document.getElementById("playerCount").value;
  const container = document.getElementById("nameInputs");

  if (count < 3) {
    alert("Mindestens 3 Spieler!");
    return;
  }

  container.innerHTML = "";

  for (let i = 0; i < count; i++) {
    container.innerHTML += `
      <input type="text" placeholder="Name Spieler ${i+1}" id="player${i}">
    `;
  }

  container.innerHTML += `
    <button onclick="startGame()">Play</button>
  `;
}

function startGame() {
  const count = document.getElementById("playerCount").value;
  players = [];

  for (let i = 0; i < count; i++) {
    const name = document.getElementById(`player${i}`).value;

    if (!name) {
      alert("Bitte alle Namen eingeben!");
      return;
    }

    players.push(name);
  }

  imposterIndex = Math.floor(Math.random() * players.length);
  secretWord = words[Math.floor(Math.random() * words.length)];

  document.getElementById("setupCard").style.display = "none";
  showPlayers();
}

function showPlayers() {
  const card = document.getElementById("gameCard");
  card.style.display = "block";

  card.innerHTML = `
    <h3>Klicke auf deinen Namen</h3>
    <p class="subtitle">Jeder Spieler schaut einzeln.</p>
  `;

  players.forEach((player, index) => {
    card.innerHTML += `
      <button class="ghost" onclick="revealRole(${index})">
        ${player}
      </button>
    `;
  });
}

function revealRole(index) {
  const card = document.getElementById("gameCard");

  if (index === imposterIndex) {
    card.innerHTML = `
      <h2>${players[index]}</h2>
      <p class="subtitle">Du bist der</p>
      <h1>IMPOSTER 😈</h1>
      <button onclick="showPlayers()">Zurück</button>
    `;
  } else {
    card.innerHTML = `
      <h2>${players[index]}</h2>
      <p class="subtitle">Dein Wort ist:</p>
      <h1>${secretWord}</h1>
      <button onclick="showPlayers()">Zurück</button>
    `;
  }
}
