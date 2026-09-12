const API_URL = "https://royaume-64-cases-api.teddysegura-ts.workers.dev";

const PIECES = {
  wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟"
};

const CHAPTERS = [
  {
    title: "L'échiquier abandonné",
    icon: "♟",
    story: "À peine arrivé dans le Royaume des 64 Cases, une porte gigantesque bloque le passage. Un Pion Blanc s'avance et te défie.",
    dialogue: "« Prouve que tu sais réfléchir. Trouve le coup décisif. »",
    puzzleTitle: "Mat en 1 coup",
    task: "Les Blancs jouent. Trouve le coup qui termine immédiatement la partie.",
    steps: 1,
    position: { f6:"wK", g6:"wQ", h8:"bK" }
  },
  {
    title: "Le Cavalier prisonnier",
    icon: "♞",
    story: "Dans une forêt sombre, un Cavalier Blanc est enfermé derrière des barreaux. La serrure ressemble à un petit échiquier.",
    dialogue: "« Libère-moi en trouvant mon bon saut. »",
    puzzleTitle: "Le saut du Cavalier",
    task: "Déplace le Cavalier vers la bonne case pour ouvrir la prison.",
    steps: 1,
    position: { b1:"wN", h8:"bK" }
  },
  {
    title: "Le Fou du pont",
    icon: "♝",
    story: "Un immense précipice coupe la route. Un Fou Noir garde le seul pont et refuse de te laisser passer.",
    dialogue: "« Montre-moi que tu maîtrises les diagonales. »",
    puzzleTitle: "La diagonale parfaite",
    task: "Trouve la capture correcte avec le Fou Blanc.",
    steps: 1,
    position: { c1:"wB", h6:"bR", h8:"bK" }
  },
  {
    title: "Les Tours jumelles",
    icon: "♜",
    story: "Deux Tours Noires gardent l'entrée du château. Une seule attaque permet de franchir la porte.",
    dialogue: "« Une seule ligne est la bonne. Choisis-la. »",
    puzzleTitle: "L'attaque de la Tour",
    task: "Joue le coup de Tour qui élimine le défenseur et attaque le Roi Noir.",
    steps: 1,
    position: { a1:"wR", a8:"bR", h8:"bK" }
  },
  {
    title: "Le piège de la Reine",
    icon: "♛",
    story: "Dans le château, la Reine Blanche est encerclée. Elle explique qu'une victoire exige parfois d'accepter un sacrifice.",
    dialogue: "« La pièce la plus puissante n'est pas toujours celle qu'il faut conserver. »",
    puzzleTitle: "Le sacrifice",
    task: "Place la Dame sur la case du sacrifice pour ouvrir la ligne d'attaque.",
    steps: 1,
    position: { d1:"wQ", h5:"bP", g8:"bK" }
  },
  {
    title: "Le piège du Roi Noir",
    icon: "♚",
    story: "Le Roi Noir apparaît enfin. Il referme les portes derrière toi et pose une position sur l'échiquier.",
    dialogue: "« Deux coups. Pas un de plus. Voyons si tu en es capable. »",
    puzzleTitle: "Mat en 2",
    task: "Trouve les deux coups blancs. Le Roi Noir répondra automatiquement entre les deux.",
    steps: 2,
    position: { f6:"wK", h5:"wQ", a1:"wR", g8:"bK" }
  },
  {
    title: "La salle des cases",
    icon: "♘",
    story: "Le sol entier devient un échiquier. Une trace lumineuse apparaît sous les sabots du Cavalier.",
    dialogue: "« Suis la trace en trois sauts sans quitter l'échiquier. »",
    puzzleTitle: "Le chemin du Cavalier",
    task: "Enchaîne les trois bons déplacements du Cavalier.",
    steps: 3,
    position: { b1:"wN", h8:"bK" }
  },
  {
    title: "L'armée noire",
    icon: "♞",
    story: "Sous le château, une armée entière attend. L'affronter de face serait impossible : il faut trouver la combinaison tactique.",
    dialogue: "« Un bon coup vaut parfois mieux qu'une armée. »",
    puzzleTitle: "La fourchette",
    task: "Trouve le saut du Cavalier qui attaque deux pièces importantes à la fois.",
    steps: 1,
    position: { e5:"wN", f7:"bQ", h8:"bK", c4:"wB" }
  },
  {
    title: "Le dernier duel",
    icon: "♚",
    story: "Au sommet du château, le Roi Noir t'attend seul devant son trône. Le duel final commence.",
    dialogue: "« Trois coups justes, et le royaume sera libre. »",
    puzzleTitle: "La combinaison finale",
    task: "Enchaîne les trois coups gagnants. Les réponses du Roi Noir seront jouées automatiquement.",
    steps: 3,
    position: { a1:"wR", d3:"wQ", g1:"wK", a8:"bR", g8:"bK", h7:"bP" }
  }
];

const els = {
  introCard: document.getElementById("introCard"),
  gameCard: document.getElementById("gameCard"),
  endingCard: document.getElementById("endingCard"),
  startBtn: document.getElementById("startBtn"),
  serverStatus: document.getElementById("serverStatus"),
  progressBar: document.getElementById("progressBar"),
  progressText: document.getElementById("progressText"),
  chapterNumber: document.getElementById("chapterNumber"),
  chapterTitle: document.getElementById("chapterTitle"),
  sceneIcon: document.getElementById("sceneIcon"),
  storyText: document.getElementById("storyText"),
  dialogueText: document.getElementById("dialogueText"),
  puzzleTitle: document.getElementById("puzzleTitle"),
  taskText: document.getElementById("taskText"),
  stepBadge: document.getElementById("stepBadge"),
  chessboard: document.getElementById("chessboard"),
  feedback: document.getElementById("feedback"),
  moveHint: document.getElementById("moveHint"),
  nextBtn: document.getElementById("nextBtn"),
  resetMoveBtn: document.getElementById("resetMoveBtn"),
  mysteryWord: document.getElementById("mysteryWord")
};

let token = null;
let chapterIndex = 0;
let stepIndex = 0;
let selectedSquare = null;
let boardState = {};
let puzzleComplete = false;
let gameComplete = false;
let busy = false;

function clonePosition(position) {
  return JSON.parse(JSON.stringify(position));
}

function saveState() {
  sessionStorage.setItem("r64-session", JSON.stringify({ token, chapterIndex, stepIndex, boardState, puzzleComplete, gameComplete }));
}

function clearState() {
  sessionStorage.removeItem("r64-session");
}

function renderProgress() {
  const done = gameComplete ? 9 : chapterIndex;
  const percent = Math.min(100, (done / 9) * 100);
  els.progressBar.style.width = `${percent}%`;
  els.progressText.textContent = gameComplete ? "9 chapitres terminés" : `Chapitre ${chapterIndex + 1} sur 9`;
}

function renderChapter(resetBoard = true) {
  const chapter = CHAPTERS[chapterIndex];
  els.chapterNumber.textContent = `Chapitre ${chapterIndex + 1}`;
  els.chapterTitle.textContent = chapter.title;
  els.sceneIcon.textContent = chapter.icon;
  els.storyText.textContent = chapter.story;
  els.dialogueText.textContent = chapter.dialogue;
  els.puzzleTitle.textContent = chapter.puzzleTitle;
  els.taskText.textContent = chapter.task;
  stepIndex = resetBoard ? 0 : stepIndex;
  if (resetBoard) boardState = clonePosition(chapter.position);
  puzzleComplete = false;
  gameComplete = false;
  selectedSquare = null;
  els.feedback.textContent = "";
  els.feedback.className = "feedback";
  els.nextBtn.classList.add("hidden");
  els.nextBtn.textContent = "Continuer";
  updateStepBadge();
  renderBoard();
  renderProgress();
  saveState();
}

function updateStepBadge() {
  const total = CHAPTERS[chapterIndex].steps;
  els.stepBadge.textContent = total === 1 ? "1 coup à trouver" : `Coup ${Math.min(stepIndex + 1, total)} / ${total}`;
}

function squareColor(fileIndex, rank) {
  return ((fileIndex + rank) % 2 === 0) ? "dark" : "light";
}

function renderBoard(lastMove = null, wrongSquare = null) {
  els.chessboard.innerHTML = "";
  const files = ["a","b","c","d","e","f","g","h"];
  for (let rank = 8; rank >= 1; rank--) {
    files.forEach((file, fileIndex) => {
      const sq = `${file}${rank}`;
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = `square ${squareColor(fileIndex, rank)}`;
      cell.dataset.square = sq;
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", sq);
      if (selectedSquare === sq) cell.classList.add("selected");
      if (lastMove && (lastMove.from === sq || lastMove.to === sq)) cell.classList.add("last-move");
      if (wrongSquare === sq) cell.classList.add("wrong");

      if (boardState[sq]) {
        const piece = document.createElement("span");
        piece.className = "piece";
        piece.textContent = PIECES[boardState[sq]];
        cell.appendChild(piece);
      }

      if (rank === 1) {
        const coord = document.createElement("span");
        coord.className = "coord file";
        coord.textContent = file;
        cell.appendChild(coord);
      }
      if (file === "a") {
        const coord = document.createElement("span");
        coord.className = "coord rank";
        coord.textContent = rank;
        cell.appendChild(coord);
      }
      cell.addEventListener("click", () => handleSquareClick(sq));
      els.chessboard.appendChild(cell);
    });
  }
}

function applyMove(uci) {
  if (!uci || uci.length < 4) return null;
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  if (boardState[from]) {
    boardState[to] = boardState[from];
    delete boardState[from];
  }
  return { from, to };
}

async function handleSquareClick(square) {
  if (busy || puzzleComplete || gameComplete) return;

  if (!selectedSquare) {
    if (!boardState[square] || !boardState[square].startsWith("w")) {
      els.feedback.textContent = "Choisis d'abord une pièce blanche.";
      els.feedback.className = "feedback error";
      return;
    }
    selectedSquare = square;
    els.feedback.textContent = "";
    renderBoard();
    return;
  }

  if (selectedSquare === square) {
    selectedSquare = null;
    renderBoard();
    return;
  }

  const move = `${selectedSquare}${square}`;
  const source = selectedSquare;
  selectedSquare = null;
  await submitMove(move, source, square);
}

async function submitMove(move, from, to) {
  busy = true;
  els.feedback.textContent = "Vérification du coup…";
  els.feedback.className = "feedback";
  try {
    const response = await fetch(`${API_URL}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, move })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erreur serveur");

    if (!data.correct) {
      els.feedback.textContent = data.message || "Ce n'est pas le bon coup. Essaie encore.";
      els.feedback.className = "feedback error";
      renderBoard(null, to || from);
      return;
    }

    token = data.token;
    stepIndex = data.step || 0;
    let lastMove = applyMove(move);
    if (data.opponentMove) lastMove = applyMove(data.opponentMove) || lastMove;

    if (data.puzzleComplete) {
      puzzleComplete = true;
      gameComplete = Boolean(data.gameComplete);
      els.feedback.textContent = gameComplete ? "Dernière épreuve réussie !" : "Épreuve réussie ! La route est ouverte.";
      els.feedback.className = "feedback ok";
      els.nextBtn.textContent = gameComplete ? "Révéler le mot mystère" : "Continuer l'histoire";
      els.nextBtn.classList.remove("hidden");
    } else {
      els.feedback.textContent = data.message || "Bon coup ! Continue.";
      els.feedback.className = "feedback ok";
    }

    updateStepBadge();
    renderBoard(lastMove);
    saveState();
  } catch (error) {
    els.feedback.textContent = "Le serveur de jeu n'est pas encore disponible. Vérifie l'adresse du Worker Cloudflare.";
    els.feedback.className = "feedback error";
  } finally {
    busy = false;
  }
}

async function startGame() {
  els.startBtn.disabled = true;
  els.serverStatus.textContent = "Ouverture des portes du royaume…";
  try {
    const response = await fetch(`${API_URL}/start`, { method: "POST" });
    const data = await response.json();
    if (!response.ok || !data.token) throw new Error("start failed");
    token = data.token;
    chapterIndex = 0;
    stepIndex = 0;
    clearState();
    els.introCard.classList.add("hidden");
    els.gameCard.classList.remove("hidden");
    renderChapter(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    els.serverStatus.textContent = "Le site est prêt, mais le Worker Cloudflare doit être déployé avant de pouvoir jouer.";
  } finally {
    els.startBtn.disabled = false;
  }
}

async function revealMystery() {
  busy = true;
  els.nextBtn.disabled = true;
  els.feedback.textContent = "Le royaume révèle son dernier secret…";
  try {
    const response = await fetch(`${API_URL}/mystery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });
    const data = await response.json();
    if (!response.ok || !data.word) throw new Error(data.error || "mystery failed");
    els.mysteryWord.textContent = data.word;
    els.gameCard.classList.add("hidden");
    els.endingCard.classList.remove("hidden");
    gameComplete = true;
    renderProgress();
    saveState();
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  } catch (error) {
    els.feedback.textContent = "Impossible de révéler le mot pour le moment.";
    els.feedback.className = "feedback error";
    els.nextBtn.disabled = false;
  } finally {
    busy = false;
  }
}

function nextChapter() {
  if (gameComplete) {
    revealMystery();
    return;
  }
  chapterIndex += 1;
  if (chapterIndex >= CHAPTERS.length) {
    revealMystery();
    return;
  }
  renderChapter(true);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

els.startBtn.addEventListener("click", startGame);
els.nextBtn.addEventListener("click", nextChapter);
els.resetMoveBtn.addEventListener("click", () => {
  selectedSquare = null;
  els.feedback.textContent = "Sélection annulée.";
  els.feedback.className = "feedback";
  renderBoard();
});

renderProgress();
