const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const playerScoreEl = document.getElementById("playerScore");
const cpuScoreEl = document.getElementById("cpuScore");
const quarterEl = document.getElementById("quarter");
const downTextEl = document.getElementById("downText");
const ballTextEl = document.getElementById("ballText");
const clockTextEl = document.getElementById("clockText");
const messageEl = document.getElementById("message");
const resultEl = document.getElementById("resultText");
const startBtn = document.getElementById("startButton");

const W = canvas.width;
const H = canvas.height;

let playerScore = 0;
let cpuScore = 0;
let quarter = 1;
let gameClock = 120;
let down = 1;
let distance = 10;
let ballPosition = 20;

let playActive = false;
let playStarted = false;
let gameOver = false;
let gameStarted = false;

let possession = "player";
let particles = [];

const keys = {
  left: false,
  right: false,
  up: false,
  down: false,
  sprint: false
};

const player = {
  x: 210,
  y: 270,
  width: 24,
  height: 30,
  speed: 3,
  sprintSpeed: 5,
  color: "#ffdb35",
  hasBall: true
};

const defenders = [];
const receivers = [];

let passTarget = null;
let ballTrail = [];

function createDefenders() {
  defenders.length = 0;
  for (let i = 0; i < 7; i++) {
    defenders.push({
      x: 500 + Math.random() * 300,
      y: 80 + Math.random() * 380,
      width: 25,
      height: 31,
      speed: 1.1 + Math.random() * 0.8,
      color: "#e84a4a",
      active: true
    });
  }
}

function createReceivers() {
  receivers.length = 0;
  receivers.push({
    x: 430,
    y: 125,
    width: 22,
    height: 29,
    speed: 1.7,
    route: "up",
    color: "#58a6ff",
    selected: false
  });
  receivers.push({
    x: 440,
    y: 390,
    width: 22,
    height: 29,
    speed: 1.6,
    route: "down",
    color: "#58a6ff",
    selected: false
  });
  receivers.push({
    x: 350,
    y: 270,
    width: 22,
    height: 29,
    speed: 1.5,
    route: "middle",
    color: "#58a6ff",
    selected: false
  });
}

function resetPlay() {
  player.x = 210;
  player.y = 270;
  player.hasBall = true;
  playActive = false;
  playStarted = false;
  passTarget = null;
  ballTrail = [];
  createDefenders();
  createReceivers();
  messageEl.textContent = "Press SNAP to start the play!";
  updateUI();
}

function startPlay() {
  if (gameOver || playActive) return;
  playActive = true;
  playStarted = true;
  messageEl.textContent = "GO! Move with arrows. Press P to pass.";
  player.hasBall = true;
}

function updateUI() {
  playerScoreEl.textContent = playerScore;
  cpuScoreEl.textContent = cpuScore;
  quarterEl.textContent = `Q${quarter}`;
  downTextEl.textContent = `${ordinal(down)} & ${distance}`;
  ballTextEl.textContent = `Ball: ${Math.round(ballPosition)}`;
  clockTextEl.textContent = formatTime(gameClock);
}

function ordinal(number) {
  if (number === 1) return "1st";
  if (number === 2) return "2nd";
  if (number === 3) return "3rd";
  return "4th";
}

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}

function movePlayer() {
  if (!playActive || !player.hasBall) return;
  
  const currentSpeed = keys.sprint ? player.sprintSpeed : player.speed;
  
  if (keys.left) player.x -= currentSpeed;
  if (keys.right) player.x += currentSpeed;
  if (keys.up) player.y -= currentSpeed;
  if (keys.down) player.y += currentSpeed;
  
  player.x = clamp(player.x, 80, W - 80);
  player.y = clamp(player.y, 45, H - 45);
}

function moveReceivers() {
  if (!playActive) return;
  receivers.forEach(receiver => {
    if (receiver.route === "up") {
      receiver.x += receiver.speed;
      receiver.y -= 0.45;
    } else if (receiver.route === "down") {
      receiver.x += receiver.speed;
      receiver.y += 0.45;
    } else if (receiver.route === "middle") {
      receiver.x += receiver.speed;
    }
    receiver.x = clamp(receiver.x, 50, W - 40);
    receiver.y = clamp(receiver.y, 35, H - 35);
  });
}

function moveDefenders() {
  if (!playActive) return;
  defenders.forEach(defender => {
    if (!defender.active) return;
    
    let targetX, targetY;
    if (player.hasBall) {
      targetX = player.x;
      targetY = player.y;
    } else if (passTarget) {
      targetX = passTarget.x;
      targetY = passTarget.y;
    } else {
      targetX = player.x;
      targetY = player.y;
    }
    
    const dx = targetX - defender.x;
    const dy = targetY - defender.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length > 1) {
      defender.x += (dx / length) * defender.speed;
      defender.y += (dy / length) * defender.speed;
    }
    
    if (collision(player, defender) && player.hasBall) {
      tackle();
    }
    if (passTarget && collision(passTarget, defender) && !player.hasBall) {
      incompletePass();
    }
  });
}

function tackle() {
  playActive = false;
  const gained = Math.max(1, Math.floor((player.x - 210) / 18));
  messageEl.textContent = `TACKLED! ${gained} yard${gained !== 1 ? 's' : ''}.`;
  advanceBall(gained);
}

function advanceBall(yards) {
  ballPosition += yards;
  distance -= yards;
  
  if (distance <= 0) {
    touchdown();
    return;
  }
  
  down++;
  if (down > 4) {
    turnover();
    return;
  }
  
  updateUI();
  setTimeout(() => resetPlay(), 1500);
}

function touchdown() {
  playActive = false;
  playerScore += 7;
  messageEl.textContent = "🏈 TOUCHDOWN! +7 POINTS! 🏈";
  createConfetti();
  updateUI();
  
  setTimeout(() => {
    ballPosition = 20;
    down = 1;
    distance = 10;
    gameClock -= 15;
    
    if (gameClock <= 0) {
      endQuarter();
    } else {
      resetPlay();
    }
  }, 2000);
}

function turnover() {
  playActive = false;
  messageEl.textContent = "TURNOVER ON DOWNS!";
  possession = "cpu";
  cpuPossession();
}

function incompletePass() {
  playActive = false;
  messageEl.textContent = "INCOMPLETE PASS!";
  down++;
  
  if (down > 4) {
    turnover();
    return;
  }
  
  updateUI();
  setTimeout(() => resetPlay(), 1200);
}

function throwPass() {
  if (!playActive || !player.hasBall) return;
  
  let closest = null;
  let bestDistance = Infinity;
  
  receivers.forEach(receiver => {
    const dx = receiver.x - player.x;
    const dy = receiver.y - player.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    
    if (d < bestDistance) {
      bestDistance = d;
      closest = receiver;
    }
  });
  
  if (!closest || bestDistance > 500) {
    incompletePass();
    return;
  }
  
  player.hasBall = false;
  passTarget = closest;
  closest.selected = true;
  messageEl.textContent = "BALL IN THE AIR!";
  
  setTimeout(() => {
    if (!playActive) return;
    const catchChance = Math.max(0.25, 1 - bestDistance / 600);
    
    if (Math.random() < catchChance) {
      completePass(closest);
    } else {
      incompletePass();
    }
  }, 600);
}

function completePass(receiver) {
  playActive = true;
  passTarget = null;
  receiver.selected = false;
  player.x = receiver.x;
  player.y = receiver.y;
  player.hasBall = true;
  messageEl.textContent = "COMPLETE! Keep running!";
  
  const gained = Math.max(3, Math.floor((receiver.x - 210) / 22));
  ballPosition += gained;
  distance -= gained;
  
  if (distance <= 0) {
    touchdown();
  } else {
    updateUI();
  }
}

function runPlay() {
  if (!playActive || !player.hasBall) return;
  player.x += 70;
  player.x = clamp(player.x, 80, W - 60);
  
  const gained = Math.floor(3 + Math.random() * 5);
  messageEl.textContent = `RUN! +${gained} yards`;
  advanceBall(gained);
}

function cpuPossession() {
  messageEl.textContent = "CPU HAS BALL — Defense on the field!";
  
  setTimeout(() => {
    const cpuGain = Math.floor(5 + Math.random() * 16);
    const isTouchdown = Math.random() < 0.25 || cpuGain > 15;
    
    if (isTouchdown) {
      cpuScore += 7;
      messageEl.textContent = "CPU TOUCHDOWN! +7 points";
    } else {
      messageEl.textContent = `CPU gained ${cpuGain} yards`;
    }
    
    possession = "player";
    gameClock -= 20;
    
    if (gameClock <= 0) {
      endQuarter();
    } else {
      updateUI();
      setTimeout(() => resetPlay(), 1500);
    }
  }, 1500);
}

function endQuarter() {
  quarter++;
  
  if (quarter > 4) {
    gameOver = true;
    playActive = false;
    
    let result;
    if (playerScore > cpuScore) {
      result = `YOU WIN! ${playerScore}-${cpuScore}`;
    } else if (playerScore < cpuScore) {
      result = `YOU LOSE! ${cpuScore}-${playerScore}`;
    } else {
      result = `TIE GAME! ${playerScore}-${playerScore}`;
    }
    
    messageEl.textContent = result;
    return;
  }
  
  gameClock = 120;
  down = 1;
  distance = 10;
  messageEl.textContent = `END OF Q${quarter - 1} — QUARTER ${quarter}!`;
  
  setTimeout(() => {
    resetPlay();
  }, 2000);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function collision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function drawField() {
  ctx.fillStyle = "#238b46";
  ctx.fillRect(0, 0, W, H);
  
  for (let x = 0; x < W; x += 100) {
    ctx.fillStyle = x % 200 === 0 ? "#238b46" : "#2b9950";
    ctx.fillRect(x, 0, 100, H);
  }
  
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(25, 20, 8, H - 40);
  ctx.fillRect(W - 33, 20, 8, H - 40);
  
  for (let x = 80; x < W - 50; x += 80) {
    ctx.fillRect(x, 20, 4, H - 40);
    ctx.fillRect(x, H / 2 - 30, 20, 4);
    ctx.fillRect(x, H / 2 + 26, 20, 4);
  }
  
  ctx.fillStyle = "#2466a8";
  ctx.fillRect(0, 0, 65, H);
  ctx.fillStyle = "#9d3636";
  ctx.fillRect(W - 65, 0, 65, H);
  
  ctx.fillStyle = "#fff";
  ctx.font = "bold 28px Courier New";
  
  ctx.save();
  ctx.translate(35, H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText("HOME", 0, 10);
  ctx.restore();
  
  ctx.save();
  ctx.translate(W - 35, H / 2);
  ctx.rotate(Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText("AWAY", 0, 10);
  ctx.restore();
  
  for (let y = 60; y < H - 40; y += 35) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(300, y, 15, 3);
    ctx.fillRect(685, y, 15, 3);
  }
}

function drawPlayer() {
  drawCharacter(player, "#ffd447", "#111");
  
  if (player.hasBall) {
    ctx.fillStyle = "#8b4513";
    ctx.fillRect(player.x + 17, player.y - 3, 13, 7);
    ctx.fillStyle = "#fff";
    ctx.fillRect(player.x + 20, player.y, 2, 2);
  }
}

function drawReceivers() {
  receivers.forEach(receiver => {
    drawCharacter(receiver, receiver.color, "#111");
    
    if (receiver.selected) {
      ctx.strokeStyle = "#ffd447";
      ctx.lineWidth = 3;
      ctx.strokeRect(
        receiver.x - 5,
        receiver.y - 5,
        receiver.width + 10,
        receiver.height + 10
      );
    }
  });
}

function drawDefenders() {
  defenders.forEach(defender => {
    if (!defender.active) return;
    drawCharacter(defender, "#e74b4b", "#111");
  });
}

function drawCharacter(character, shirtColor, helmetColor) {
  const x = character.x;
  const y = character.y;
  
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(x - 3, y + character.height - 2, character.width + 6, 6);
  
  ctx.fillStyle = "#18212c";
  ctx.fillRect(x + 4, y + 20, 6, 10);
  ctx.fillRect(x + 14, y + 20, 6, 10);
  
  ctx.fillStyle = shirtColor;
  ctx.fillRect(x + 2, y + 8, character.width - 4, 16);
  
  ctx.fillRect(x - 4, y + 10, 7, 12);
  ctx.fillRect(x + character.width - 3, y + 10, 7, 12);
  
  ctx.fillStyle = helmetColor;
  ctx.fillRect(x + 4, y, 17, 11);
  ctx.fillRect(x + 17, y + 5, 7, 5);
  
  ctx.fillStyle = "#e4a06b";
  ctx.fillRect(x + 8, y + 6, 8, 6);
}

function drawBall() {
  if (!passTarget) return;
  
  if (!player.hasBall) {
    ctx.fillStyle = "#8b4513";
    ctx.beginPath();
    ctx.ellipse(passTarget.x + 10, passTarget.y - 15, 10, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(passTarget.x + 4, passTarget.y - 15);
    ctx.lineTo(passTarget.x + 16, passTarget.y - 15);
    ctx.stroke();
  }
}

function drawParticles() {
  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  });
}

function createConfetti() {
  particles = [];
  for (let i = 0; i < 100; i++) {
    particles.push({
      x: Math.random() * W,
      y: -Math.random() * 100,
      size: 4 + Math.random() * 5,
      speed: 2 + Math.random() * 5,
      color: ["#ffd447", "#ffffff", "#ff4b4b", "#4bd1ff"][Math.floor(Math.random() * 4)]
    });
  }
}

function updateParticles() {
  particles.forEach(p => {
    p.y += p.speed;
    if (p.y > H) p.y = -10;
  });
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawField();
  drawReceivers();
  drawDefenders();
  drawPlayer();
  drawBall();
  drawParticles();
}

function update() {
  if (!gameOver && gameStarted) {
    movePlayer();
    moveReceivers();
    moveDefenders();
    updateParticles();
    
    if (playActive && player.hasBall && player.x > W - 80) {
      touchdown();
    }
  }
  
  draw();
  requestAnimationFrame(update);
}

function handleKeyDown(e) {
  if (e.code === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = true;
  if (e.code === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = true;
  if (e.code === "ArrowUp" || e.key === "w" || e.key === "W") keys.up = true;
  if (e.code === "ArrowDown" || e.key === "s" || e.key === "S") keys.down = true;
  if (e.code === "ShiftLeft" || e.code === "ShiftRight") keys.sprint = true;
  
  if (e.code === "Space") {
    e.preventDefault();
    startPlay();
  }
  if (e.key === "p" || e.key === "P") throwPass();
  if (e.key === "r" || e.key === "R") runPlay();
}

function handleKeyUp(e) {
  if (e.code === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = false;
  if (e.code === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = false;
  if (e.code === "ArrowUp" || e.key === "w" || e.key === "W") keys.up = false;
  if (e.code === "ArrowDown" || e.key === "s" || e.key === "S") keys.down = false;
  if (e.code === "ShiftLeft" || e.code === "ShiftRight") keys.sprint = false;
}

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);

startBtn.addEventListener("click", () => {
  gameStarted = true;
  messageEl.classList.add("hidden");
  resetPlay();
});

document.getElementById("snapBtn").addEventListener("click", startPlay);
document.getElementById("passBtn").addEventListener("click", throwPass);
document.getElementById("runBtn").addEventListener("click", runPlay);

// Mobile controls
document.getElementById("upBtn").addEventListener("mousedown", () => keys.up = true);
document.getElementById("upBtn").addEventListener("mouseup", () => keys.up = false);
document.getElementById("downBtn").addEventListener("mousedown", () => keys.down = true);
document.getElementById("downBtn").addEventListener("mouseup", () => keys.down = false);
document.getElementById("leftBtn").addEventListener("mousedown", () => keys.left = true);
document.getElementById("leftBtn").addEventListener("mouseup", () => keys.left = false);
document.getElementById("rightBtn").addEventListener("mousedown", () => keys.right = true);
document.getElementById("rightBtn").addEventListener("mouseup", () => keys.right = false);
document.getElementById("sprintBtn").addEventListener("mousedown", () => keys.sprint = true);
document.getElementById("sprintBtn").addEventListener("mouseup", () => keys.sprint = false);

requestAnimationFrame(update);
updateUI();