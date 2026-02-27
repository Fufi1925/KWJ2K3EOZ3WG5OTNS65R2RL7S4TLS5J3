let players = [];
let imposterIndex;
let secretWord;

// Beispiel-Wörter (du kannst noch mehr hinzufügen)
const words = [
"Apfel", "Auto", "Schule", "Hund", "Katze",
"Pizza", "Handy", "Laptop", "Meer", "Buch",
"Insel", "Hotel", "Restaurant", "Ballon", "Fahrrad"
];

function createInputs() {
    const count = document.getElementById("playerCount").value;
    const container = document.getElementById("nameInputs");
    container.innerHTML = "";

    for (let i = 0; i < count; i++) {
        container.innerHTML += `<input type="text" placeholder="Name Spieler ${i+1}" id="player${i}">`;
    }
    container.innerHTML += `<button onclick="startGame()">Play</button>`;
}

function startGame() {
    const count = document.getElementById("playerCount").value;
    players = [];

    for (let i = 0; i < count; i++) {
        let name = document.getElementById(`player${i}`).value;
        if (!name) {
            alert("Bitte alle Namen eingeben!");
            return;
        }
        players.push(name);
    }

    // zufällig einen Imposter wählen
    imposterIndex = Math.floor(Math.random() * players.length);

    // zufälliges Wort aus der Liste
    secretWord = words[Math.floor(Math.random() * words.length)];

    document.getElementById("setup").style.display = "none";
    document.getElementById("nameInputs").style.display = "none";

    showPlayers();
}

function showPlayers() {
    const area = document.getElementById("gameArea");
    area.style.display = "block";
    area.innerHTML = "<h2>Klicke auf deinen Namen:</h2>";

    players.forEach((player, index) => {
        area.innerHTML += `<button onclick="revealRole(${index})">${player}</button>`;
    });
}

function revealRole(index) {
    const area = document.getElementById("gameArea");

    if (index === imposterIndex) {
        area.innerHTML = `
            <h2>${players[index]}</h2>
            <h3>Du bist der IMPOSTER 😈</h3>
            <button onclick="showPlayers()">Zurück</button>`;
    } else {
        area.innerHTML = `
            <h2>${players[index]}</h2>
            <h3>Das Wort ist:</h3>
            <h2>${secretWord}</h2>
            <button onclick="showPlayers()">Zurück</button>`;
    }
}
