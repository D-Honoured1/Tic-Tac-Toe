// Gameboard Module
const Gameboard = (() => {
  let board = ["", "", "", "", "", "", "", "", ""];
  const getBoard = () => board;
  const resetBoard = () => {
    board = ["", "", "", "", "", "", "", "", ""];
  };
  const setCell = (index, marker) => {
    if (board[index] === "") {
      board[index] = marker;
      return true;
    }
    return false;
  };
  const getCell = (index) => board[index];
  return { getBoard, setCell, getCell, resetBoard };
})();

// Player Factory
const Player = (name, marker) => ({ name, marker, score: 0 });

// Game Controller
const GameController = (() => {
  let player1, player2, currentPlayer, gameOver;
  let roundCount = 0;
  let maxRounds = 5;
  let aiActive = false;
  let aiDifficulty = "easy";
  let nextStarter;

  const startGame = (name1, name2, isAI, difficulty) => {
    player1 = Player(name1, "X");
    player2 = Player(name2, "O");
    player1.score = 0;
    player2.score = 0;
    roundCount = 0;
    aiActive = isAI;
    aiDifficulty = difficulty;
    nextStarter = player1;
    currentPlayer = nextStarter;
    gameOver = false;
    Gameboard.resetBoard();
  };

  const switchPlayer = () => {
    currentPlayer = currentPlayer === player1 ? player2 : player1;
  };

  const playRound = (index) => {
    if (gameOver || !Gameboard.setCell(index, currentPlayer.marker)) return false;
    if (checkWin(currentPlayer.marker)) {
      currentPlayer.score++;
      gameOver = true;
    } else if (isTie()) {
      gameOver = true;
    } else {
      switchPlayer();
    }
    return true;
  };

  const checkWin = (marker) => {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return wins.some(combo => combo.every(i => Gameboard.getCell(i) === marker));
  };

  const isTie = () => Gameboard.getBoard().every(cell => cell !== "");

  const getCurrentPlayer = () => currentPlayer;
  const isGameOver = () => gameOver;
  const isMatchOver = () => roundCount >= maxRounds;
  const getWinner = () => isTie() ? "tie" : currentPlayer.name;
  const getScores = () => ({ [player1.name]: player1.score, [player2.name]: player2.score });

  const nextRound = () => {
    if (!isMatchOver()) {
      Gameboard.resetBoard();
      roundCount++;
      gameOver = false;
      nextStarter = nextStarter === player1 ? player2 : player1;
      currentPlayer = nextStarter;
      return true;
    }
    return false;
  };

  const isAIActive = () => aiActive;

  const getAIMove = () => {
    const board = Gameboard.getBoard();
    const empty = board.map((v, i) => v === "" ? i : null).filter(v => v !== null);

    const checkSimulatedWin = (board, marker) => {
      const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      return wins.some(combo => combo.every(i => board[i] === marker));
    };

    if (aiDifficulty === "easy") {
      return empty[Math.floor(Math.random() * empty.length)];
    }

    if (aiDifficulty === "medium") {
      for (let i of empty) {
        board[i] = "O";
        if (checkSimulatedWin(board, "O")) { board[i] = ""; return i; }
        board[i] = "";
      }
      for (let i of empty) {
        board[i] = "X";
        if (checkSimulatedWin(board, "X")) { board[i] = ""; return i; }
        board[i] = "";
      }
      return empty[Math.floor(Math.random() * empty.length)];
    }

    const minimax = (newBoard, player) => {
      const avail = newBoard.map((v, i) => v === "" ? i : null).filter(v => v !== null);
      if (checkSimulatedWin(newBoard, "X")) return { score: -10 };
      if (checkSimulatedWin(newBoard, "O")) return { score: 10 };
      if (avail.length === 0) return { score: 0 };

      const moves = [];
      for (let i of avail) {
        const move = { index: i };
        newBoard[i] = player;
        const result = minimax(newBoard, player === "O" ? "X" : "O");
        move.score = result.score;
        newBoard[i] = "";
        moves.push(move);
      }

      let best = 0;
      if (player === "O") {
        let max = -Infinity;
        for (let i in moves) {
          if (moves[i].score > max) {
            best = i;
            max = moves[i].score;
          }
        }
      } else {
        let min = Infinity;
        for (let i in moves) {
          if (moves[i].score < min) {
            best = i;
            min = moves[i].score;
          }
        }
      }
      return moves[best];
    };

    return minimax([...board], "O").index;
  };

  return {
    startGame, playRound, getCurrentPlayer, isGameOver,
    getWinner, getScores, isMatchOver, nextRound,
    isAIActive, getAIMove
  };
})();

// Display Controller
const DisplayController = (() => {
  const cells = document.querySelectorAll(".cell");
  const startBtn = document.getElementById("start");
  const restartBtn = document.getElementById("restart");
  const msg = document.getElementById("message");
  const score1 = document.getElementById("score1");
  const score2 = document.getElementById("score2");
  const name1 = document.getElementById("name1");
  const name2 = document.getElementById("name2");

  document.getElementById("aiToggle").addEventListener("change", (e) => {
    document.getElementById("aiDifficulty").style.display = e.target.checked ? "inline-block" : "none";
  });

  let gameActive = false;

  const render = () => {
    Gameboard.getBoard().forEach((val, i) => {
      cells[i].textContent = val;
    });
  };

  const updateScoreboard = () => {
    const scores = GameController.getScores();
    score1.textContent = scores[name1.textContent] ?? 0;
    score2.textContent = scores[name2.textContent] ?? 0;
  };

  const updateMessage = () => {
    if (!gameActive) {
      msg.textContent = "Enter names and start the game.";
      return;
    }

    name1.classList.remove("current-player");
    name2.classList.remove("current-player");

    if (GameController.isMatchOver()) {
      const scores = GameController.getScores();
      const winner = scores[name1.textContent] > scores[name2.textContent]
        ? name1.textContent
        : scores[name1.textContent] < scores[name2.textContent]
        ? name2.textContent : null;
      msg.textContent = winner ? `${winner} wins the match!` : "The match is a tie!";
      startBtn.textContent = "Start Game";
      restartBtn.disabled = true;
      gameActive = false;
    } else if (GameController.isGameOver()) {
      const winner = GameController.getWinner();
      msg.textContent = winner === "tie" ? "It's a tie!" : `${winner} wins this round!`;
      updateScoreboard();
      setTimeout(() => {
        if (GameController.nextRound()) {
          render();
          updateMessage();
          if (GameController.isAIActive() && GameController.getCurrentPlayer().marker === "O") {
            handleAIMove();
          }
        } else {
          updateMessage();
        }
      }, 1500);
    } else {
      msg.textContent = `${GameController.getCurrentPlayer().name}'s turn`;

      const current = GameController.getCurrentPlayer().name;
      if (name1.textContent === current) {
        name1.classList.add("current-player");
      } else {
        name2.classList.add("current-player");
      }
    }
  };

  const handleCellClick = (e) => {
    if (!gameActive || GameController.isGameOver()) return;
    const index = parseInt(e.target.dataset.index);
    if (!GameController.playRound(index)) return;
    render();
    updateMessage();
    if (GameController.isAIActive() && !GameController.isGameOver() && GameController.getCurrentPlayer().marker === "O") {
      setTimeout(() => {
        handleAIMove();
      }, 500);
    }
  };

  const handleAIMove = () => {
    const move = GameController.getAIMove();
    if (move !== null) {
      GameController.playRound(move);
      render();
      updateMessage();
    }
  };

  const handleStart = () => {
    if (gameActive) {
      gameActive = false;
      startBtn.textContent = "Start Game";
      msg.textContent = "Game stopped.";
      restartBtn.disabled = true;
      return;
    }

    const p1 = document.getElementById("player1").value || "Player 1";
    const p2 = document.getElementById("aiToggle").checked ? "AI" : document.getElementById("player2").value || "Player 2";
    const difficulty = document.getElementById("aiDifficulty")?.value || "easy";

    name1.textContent = p1;
    name2.textContent = p2;
    GameController.startGame(p1, p2, document.getElementById("aiToggle").checked, difficulty);
    gameActive = true;
    startBtn.textContent = "End Game";
    restartBtn.disabled = false;
    render();
    updateScoreboard();
    updateMessage();

    if (GameController.isAIActive() && GameController.getCurrentPlayer().marker === "O") {
      handleAIMove();
    }
  };

  const handleRestart = () => {
    if (gameActive && !GameController.isMatchOver()) {
      Gameboard.resetBoard();
      render();
      updateMessage();
    }
  };

  cells.forEach((cell, i) => {
    cell.dataset.index = i;
    cell.addEventListener("click", handleCellClick);
  });
  startBtn.addEventListener("click", handleStart);
  restartBtn.addEventListener("click", handleRestart);
  updateMessage();
})();
