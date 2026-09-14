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
const playMenu = document.getElementById("playMenu");
const aimingIndicator = document.getElementById("aimingIndicator");
const powerMeter = document.getElementById("powerMeter");
const huddleBtn = document.getElementById("huddle-btn");
const snapBtn = document.getElementById("snap-btn");

// Canvas and viewport dimensions
const CANVAS_W = canvas.width;
const CANVAS_H = canvas.height;
const FIELD_WIDTH = 3600;  // 120 yards * 30 pixels per yard
const FIELD_HEIGHT = 800;  // Full field width

// Camera/viewport
let cameraX = 0;
let cameraY = 0;

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
let inPlayMenu = false;
let currentPlay = null;

let possession = "player";
let particles = [];

// Pass aiming variables
let isAiming = false;
let aimStartX = 0;
let aimStartY = 0;
let currentAimX = 0;
let currentAimY = 0;
let aimPower = 0;

const keys = {
  left: false,
  right: false,
  up: false,
  down: false,
  sprint: false
};

// Enhanced player with momentum
const player = {
  x: 600,
  y: 400,
  width: 20,
  height: 35,
  vx: 0,        // velocity x
  vy: 0,        // velocity y
  speed: 3,
  sprintSpeed: 5.5,
  acceleration: 0.4,
  friction: 0.85,
  color: "#ffdb35",
  hasBall: true,
  isStunned: false,
  stunTime: 0,
  tackled: false,
  tackleVel: 0
};

const defenders = [];
const receivers = [];

let passTarget = null;
let ballTrail = [];

function createDefenders() {
  defenders.length = 0;
  for (let i = 0; i < 7; i++) {
    defenders.push({
      x: 1200 + Math.random() * 400,
      y: 150 + Math.random() * 500,
      width: 20,
      height: 35,
      vx: 0,
      vy: 0,
      speed: 2.2 + Math.random() * 0.6,
      acceleration: 0.3,
      friction: 0.88,
      color: "#e84a4a",
      active: true,
      targetLocked: false
    });
  }
}

function createReceivers() {
  receivers.length = 0;
  receivers.push({
    x: 900,
    y: 200,
    width: 20,
    height: 35,
    vx: 0,
    vy: 0,
    speed: 2.8,
    acceleration: 0.35,
    friction: 0.87,
    route: "up",
    color: "#58a6ff",
    selected: false
  });
  receivers.push({
    x: 920,
    y: 600,
    width: 20,
    height: 35,
    vx: 0,
    vy: 0,
    speed: 2.7,
    acceleration: 0.35,
    friction: 0.87,
    route: "down",
    color: "#58a6ff",
    selected: false
  });
  receivers.push({
    x: 800,
    y: 400,
    width: 20,
    height: 35,
    vx: 0,
    vy: 0,
    speed: 2.5,
    acceleration: 0.3,
    friction: 0.86,
    route: "middle",
    color: "#58a6ff",
    selected: false
  });
}

function showPlayMenu() {
  inPlayMenu = true;
  playMenu.classList.remove("hidden");
  snapBtn.disabled = true;
}

function hidePlayMenu() {
  inPlayMenu = false;
  playMenu.classList.add("hidden");
  snapBtn.disabled = false;
}

function selectPlay(play) {
  currentPlay = play;
  hidePlayMenu();
  messageEl.textContent = `Play selected: ${play.toUpperCase()}. Press SNAP to start!`;
}

function resetPlay() {
  player.x = 600;
  player.y = 400;
  player.vx = 0;
  player.vy = 0;
  player.hasBall = true;
  player.isStunned = false;
  player.stunTime = 0;
  player.tackled = false;
  playActive = false;
  playStarted = false;
  passTarget = null;
  ballTrail = [];
  isAiming = false;
  aimingIndicator.classList.add("hidden");
  currentPlay = null;
  createDefenders();
  createReceivers();
  updateUI();
}

function startPlay() {
  if (gameOver || playActive || !currentPlay) return;
  playActive = true;
  playStarted = true;
  player.hasBall = true;
  player.isStunned = false;
  player.vx = 0;
  player.vy = 0;

  if (currentPlay === "run") {
    setTimeout(() => executeRunPlay(), 300);
  } else if (currentPlay === "pass") {
    messageEl.textContent = "Click & drag on canvas to aim & launch!";
    aimingIndicator.classList.remove("hidden");
  } else if (currentPlay === "screen") {
    setTimeout(() => executeScreenPass(), 300);
  }
}

function executeRunPlay() {
  if (!playActive) return;
  // Give player a burst of forward momentum
  player.vx = 4;
  messageEl.textContent = "RUN! Control with arrow keys!";
}

function executeScreenPass() {
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

  if (!closest) {
    incompletePass();
    return;
  }

  player.hasBall = false;
  passTarget = closest;
  closest.selected = true;
  messageEl.textContent = "SCREEN PASS!";

  setTimeout(() => {
    if (!playActive) return;
    if (Math.random() < 0.8) {
      completePass(closest);
    } else {
      incompletePass();
    }
  }, 400);
}

function throwPass(power) {
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

  if (!closest) {
    incompletePass();
    return;
  }

  player.hasBall = false;
  passTarget = closest;
  closest.selected = true;
  messageEl.textContent = "BALL IN THE AIR!";

  setTimeout(() => {
    if (!playActive) return;
    const catchChance = Math.max(0.2, Math.min(0.9, power / 200));
    const distanceFactor = 1 - Math.min(bestDistance / 600, 0.5);
    const totalChance = catchChance * (0.5 + distanceFactor * 0.5);

    if (Math.random() < totalChance) {
      completePass(closest);
    } else {
      incompletePass();
    }
  }, 500);
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
  const sec = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${min}:${sec}`;
}

// Enhanced physics-based movement with acceleration
function movePlayer() {
  if (!playActive || !player.hasBall || isAiming) return;

  const isMoving = keys.left || keys.right || keys.up || keys.down;
  const currentMaxSpeed = keys.sprint ? player.sprintSpeed : player.speed;

  // Apply acceleration/deceleration
  if (keys.left) {
    player.vx = Math.max(player.vx - player.acceleration, -currentMaxSpeed);
  } else if (keys.right) {
    player.vx = Math.min(player.vx + player.acceleration, currentMaxSpeed);
  } else {
    player.vx *= player.friction;
  }

  if (keys.up) {
    player.vy = Math.max(player.vy - player.acceleration, -currentMaxSpeed);
  } else if (keys.down) {
    player.vy = Math.min(player.vy + player.acceleration, currentMaxSpeed);
  } else {
    player.vy *= player.friction;
  }

  // Apply velocity
  player.x += player.vx;
  player.y += player.vy;

  // Boundary detection (out of bounds)
  if (player.x < 100 || player.x > FIELD_WIDTH - 100 || player.y < 50 || player.y > FIELD_HEIGHT - 50) {
    outOfBounds();
    return;
  }

  // Check touchdown
  if (playActive && player.hasBall && player.x > FIELD_WIDTH - 150) {
    touchdown();
  }
}

function moveReceivers() {
  if (!playActive) return;
  receivers.forEach(receiver => {
    if (receiver.route === "up") {
      receiver.vx = Math.min(receiver.vx + receiver.acceleration, receiver.speed);
      receiver.vy = Math.max(receiver.vy - receiver.acceleration * 0.7, -receiver.speed * 0.6);
    } else if (receiver.route === "down") {
      receiver.vx = Math.min(receiver.vx + receiver.acceleration, receiver.speed);
      receiver.vy = Math.min(receiver.vy + receiver.acceleration * 0.7, receiver.speed * 0.6);
    } else if (receiver.route === "middle") {
      receiver.vx = Math.min(receiver.vx + receiver.acceleration, receiver.speed);
      receiver.vy *= receiver.friction;
    }

    receiver.x += receiver.vx;
    receiver.y += receiver.vy;

    receiver.x = clamp(receiver.x, 100, FIELD_WIDTH - 100);
    receiver.y = clamp(receiver.y, 50, FIELD_HEIGHT - 50);
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
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 2) {
      const dirX = dx / distance;
      const dirY = dy / distance;

      defender.vx = Math.max(Math.min(defender.vx + dirX * defender.acceleration, defender.speed), -defender.speed);
      defender.vy = Math.max(Math.min(defender.vy + dirY * defender.acceleration, defender.speed), -defender.speed);
    } else {
      defender.vx *= defender.friction;
      defender.vy *= defender.friction;
    }

    defender.x += defender.vx;
    defender.y += defender.vy;

    defender.x = clamp(defender.x, 100, FIELD_WIDTH - 100);
    defender.y = clamp(defender.y, 50, FIELD_HEIGHT - 50);

    // Tackle detection
    if (collision(player, defender) && player.hasBall && !player.isStunned) {
      tackle(defender);
    }
    if (passTarget && collision(passTarget, defender) && !player.hasBall) {
      incompletePass();
    }
  });
}

function tackle(defender) {
  playActive = false;
  player.isStunned = true;
  player.stunTime = 30;
  player.tackled = true;

  // Add knockback momentum
  const dx = player.x - defender.x;
  const dy = player.y - defender.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len > 0) {
    player.vx = (dx / len) * 1.5;
    player.vy = (dy / len) * 1.5;
  }

  const gained = Math.max(1, Math.floor((player.x - 600) / 30));
  messageEl.textContent = `TACKLED! ${gained} yard${gained !== 1 ? "s" : ""}.`;
  advanceBall(gained);
}

function outOfBounds() {
  playActive = false;
  const gained = Math.max(1, Math.floor((player.x - 600) / 30));
  messageEl.textContent = `OUT OF BOUNDS! ${gained} yard${gained !== 1 ? "s" : ""}.`;
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
  setTimeout(() => {
    showPlayMenu();
  }, 1500);
}

function touchdown() {
  playActive = false;
  isAiming = false;
  aimingIndicator.classList.add("hidden");
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
      showPlayMenu();
    }
  }, 2000);
}

function turnover() {
  playActive = false;
  isAiming = false;
  aimingIndicator.classList.add("hidden");
  messageEl.textContent = "TURNOVER ON DOWNS!";
  possession = "cpu";
  cpuPossession();
}

function incompletePass() {
  playActive = false;
  isAiming = false;
  aimingIndicator.classList.add("hidden");
  messageEl.textContent = "INCOMPLETE PASS!";
  down++;

  if (down > 4) {
    turnover();
    return;
  }

  updateUI();
  setTimeout(() => {
    showPlayMenu();
  }, 1200);
}

function completePass(receiver) {
  playActive = true;
  isAiming = false;
  aimingIndicator.classList.add("hidden");
  passTarget = null;
  receiver.selected = false;
  player.x = receiver.x;
  player.y = receiver.y;
  player.vx = receiver.vx * 0.8;
  player.vy = receiver.vy * 0.8;
  player.hasBall = true;
  messageEl.textContent = "COMPLETE! Keep running!";

  const gained = Math.max(5, Math.floor((receiver.x - 600) / 30));
  ballPosition += gained;
  distance -= gained;

  if (distance <= 0) {
    touchdown();
  } else {
    updateUI();
  }
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
      resetPlay();
      updateUI();
      setTimeout(() => {
        showPlayMenu();
      }, 1500);
    }
  }, 1500);
}

function endQuarter() {
  quarter++;

  if (quarter > 4) {
    gameOver = true;
    playActive = false;
    isAiming = false;
    aimingIndicator.classList.add("hidden");

    let result;
    if (playerScore > cpuScore) {
      result = `YOU WIN! ${playerScore}-${cpuScore}`;
    } else if (playerScore < cpuScore) {
      result = `YOU LOSE! ${cpuScore}-${playerScore}`;
    } else {
      result = `TIE GAME! ${playerScore}-${playerScore}`;
    }

    messageEl.classList.remove("hidden");
    messageEl.textContent = result;
    return;
  }

  gameClock = 120;
  down = 1;
  distance = 10;
  messageEl.textContent = `END OF Q${quarter - 1} — QUARTER ${quarter}!`;

  setTimeout(() => {
    resetPlay();
    showPlayMenu();
  }, 2000);
}

function updateCamera() {
  // Follow player with smooth camera
  const targetCamX = player.x - CANVAS_W / 3;
  const targetCamY = player.y - CANVAS_H / 2;

  cameraX += (targetCamX - cameraX) * 0.15;
  cameraY += (targetCamY - cameraY) * 0.15;

  // Clamp camera to field bounds
  cameraX = clamp(cameraX, 0, FIELD_WIDTH - CANVAS_W);
  cameraY = clamp(cameraY, 0, FIELD_HEIGHT - CANVAS_H);
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
  // Draw alternating yard line colors
  for (let x = 0; x < FIELD_WIDTH; x += 300) {
    ctx.fillStyle = x % 600 === 0 ? "#1d6b2f" : "#238b46";
    ctx.fillRect(x - cameraX, 0 - cameraY, 300, FIELD_HEIGHT);
  }

  // Sidelines
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(50 - cameraX, 0 - cameraY, 8, FIELD_HEIGHT);
  ctx.fillRect(FIELD_WIDTH - 58 - cameraX, 0 - cameraY, 8, FIELD_HEIGHT);

  // Yard markers
  for (let x = 300; x < FIELD_WIDTH - 50; x += 300) {
    ctx.fillRect(x - cameraX, 0 - cameraY, 4, FIELD_HEIGHT);

    // Hash marks
    for (let y = 100; y < FIELD_HEIGHT - 50; y += 200) {
      ctx.fillRect(x - 20 - cameraX, y - cameraY, 40, 4);
    }
  }

  // End zones
  ctx.fillStyle = "#2466a8";
  ctx.fillRect(0 - cameraX, 0 - cameraY, 100, FIELD_HEIGHT);
  ctx.fillStyle = "#9d3636";
  ctx.fillRect(FIELD_WIDTH - 100 - cameraX, 0 - cameraY, 100, FIELD_HEIGHT);

  // End zone text
  ctx.fillStyle = "#fff";
  ctx.font = "bold 20px Courier New";
  ctx.save();
  ctx.translate(50 - cameraX, FIELD_HEIGHT / 2 - cameraY);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText("HOME", 0, 8);
  ctx.restore();

  ctx.save();
  ctx.translate(FIELD_WIDTH - 50 - cameraX, FIELD_HEIGHT / 2 - cameraY);
  ctx.rotate(Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText("AWAY", 0, 8);
  ctx.restore();
}

function drawPlayer() {
  const screenX = player.x - cameraX;
  const screenY = player.y - cameraY;

  // Stun animation
  if (player.isStunned) {
    ctx.fillStyle = "rgba(255, 100, 100, 0.4)";
    ctx.fillRect(screenX - 15, screenY - 20, player.width + 30, player.height + 30);
  }

  drawCharacter(player, "#ffd447", "#222", screenX, screenY);

  if (player.hasBall) {
    ctx.fillStyle = "#8b4513";
    ctx.fillRect(screenX + 13, screenY - 2, 10, 6);
    ctx.fillStyle = "#fff";
    ctx.fillRect(screenX + 15, screenY + 1, 2, 2);
  }

  // Velocity indicator
  if (Math.abs(player.vx) > 0.5 || Math.abs(player.vy) > 0.5) {
    const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
    ctx.strokeStyle = `rgba(255, 212, 71, ${Math.min(speed / 6, 0.8)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screenX + player.width / 2, screenY + player.height / 2);
    ctx.lineTo(
      screenX + player.width / 2 + player.vx * 8,
      screenY + player.height / 2 + player.vy * 8
    );
    ctx.stroke();
  }
}

function drawReceivers() {
  receivers.forEach(receiver => {
    const screenX = receiver.x - cameraX;
    const screenY = receiver.y - cameraY;

    // Only draw if on screen
    if (screenX > -50 && screenX < CANVAS_W + 50 && screenY > -50 && screenY < CANVAS_H + 50) {
      drawCharacter(receiver, receiver.color, "#222", screenX, screenY);

      if (receiver.selected) {
        ctx.strokeStyle = "#ffd447";
        ctx.lineWidth = 3;
        ctx.strokeRect(screenX - 5, screenY - 8, receiver.width + 10, receiver.height + 10);
      }
    }
  });
}

function drawDefenders() {
  defenders.forEach(defender => {
    if (!defender.active) return;
    const screenX = defender.x - cameraX;
    const screenY = defender.y - cameraY;

    // Only draw if on screen
    if (screenX > -50 && screenX < CANVAS_W + 50 && screenY > -50 && screenY < CANVAS_H + 50) {
      drawCharacter(defender, "#e74b4b", "#222", screenX, screenY);
    }
  });
}

function drawCharacter(character, shirtColor, helmetColor, screenX, screenY) {
  const x = screenX;
  const y = screenY;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(x - 2, y + character.height - 1, character.width + 4, 4);

  // Head
  ctx.fillStyle = helmetColor;
  ctx.beginPath();
  ctx.arc(x + character.width / 2, y + 4, 5, 0, Math.PI * 2);
  ctx.fill();

  // Face
  ctx.fillStyle = "#e4a06b";
  ctx.fillRect(x + 6, y + 2, 8, 4);

  // Helmet facemask
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 8, y + 2);
  ctx.lineTo(x + 8, y + 6);
  ctx.moveTo(x + 12, y + 2);
  ctx.lineTo(x + 12, y + 6);
  ctx.stroke();

  // Neck
  ctx.fillStyle = shirtColor;
  ctx.fillRect(x + 7, y + 9, 6, 3);

  // Body/Jersey
  ctx.fillStyle = shirtColor;
  ctx.fillRect(x + 2, y + 12, character.width - 4, 14);

  // Jersey stripes
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.fillRect(x + 2, y + 16, character.width - 4, 2);
  ctx.fillRect(x + 2, y + 22, character.width - 4, 2);

  // Shoulders/Arms
  ctx.fillStyle = shirtColor;
  ctx.fillRect(x - 3, y + 12, 5, 10);
  ctx.fillRect(x + character.width - 2, y + 12, 5, 10);

  // Forearms
  ctx.fillStyle = "#e4a06b";
  ctx.fillRect(x - 3, y + 22, 5, 6);
  ctx.fillRect(x + character.width - 2, y + 22, 5, 6);

  // Legs
  ctx.fillStyle = "#18212c";
  ctx.fillRect(x + 5, y + 26, 4, 9);
  ctx.fillRect(x + 11, y + 26, 4, 9);

  // Shoes
  ctx.fillStyle = "#000";
  ctx.fillRect(x + 5, y + 35, 4, 2);
  ctx.fillRect(x + 11, y + 35, 4, 2);
}

function drawAimingLine() {
  if (!isAiming) return;

  const screenX = player.x - cameraX;
  const screenY = player.y - cameraY;

  ctx.strokeStyle = "rgba(255, 212, 71, 0.6)";
  ctx.lineWidth = 3;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(screenX + player.width / 2, screenY + player.height / 2);
  ctx.lineTo(currentAimX, currentAimY);
  ctx.stroke();
  ctx.setLineDash([]);

  const circleSize = aimPower / 5;
  ctx.strokeStyle = "rgba(255, 212, 71, 0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(screenX + player.width / 2, screenY + player.height / 2, circleSize, 0, Math.PI * 2);
  ctx.stroke();
}

function drawBall() {
  if (!passTarget || player.hasBall) return;

  const screenX = passTarget.x - cameraX;
  const screenY = passTarget.y - cameraY;

  if (screenX > -50 && screenX < CANVAS_W + 50 && screenY > -50 && screenY < CANVAS_H + 50) {
    ctx.fillStyle = "#8b4513";
    ctx.beginPath();
    ctx.ellipse(screenX + 8, screenY - 12, 8, 4, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(screenX + 3, screenY - 12);
    ctx.lineTo(screenX + 13, screenY - 12);
    ctx.stroke();
  }
}

function drawParticles() {
  particles.forEach(p => {
    const screenX = p.x - cameraX;
    const screenY = p.y - cameraY;
    if (screenX > -10 && screenX < CANVAS_W + 10 && screenY > -10 && screenY < CANVAS_H + 10) {
      ctx.fillStyle = p.color;
      ctx.fillRect(screenX, screenY, p.size, p.size);
    }
  });
}

function createConfetti() {
  particles = [];
  for (let i = 0; i < 100; i++) {
    particles.push({
      x: player.x + Math.random() * 50 - 25,
      y: player.y + Math.random() * 50 - 25,
      vx: Math.random() * 6 - 3,
      vy: Math.random() * -8,
      size: 4 + Math.random() * 5,
      speed: 2 + Math.random() * 5,
      color: ["#ffd447", "#ffffff", "#ff4b4b", "#4bd1ff"][Math.floor(Math.random() * 4)]
    });
  }
}

function updateParticles() {
  particles.forEach(p => {
    p.y += p.speed;
    p.x += p.vx * 0.5;
    p.vy += 0.2;
    if (p.y > FIELD_HEIGHT) p.y = -10;
  });
}

function draw() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawField();
  drawReceivers();
  drawDefenders();
  drawPlayer();
  drawBall();
  drawAimingLine();
  drawParticles();
}

function update() {
  if (!gameOver && gameStarted) {
    if (gameClock > 0) gameClock -= 0.016;

    // Update stun
    if (player.isStunned) {
      player.stunTime--;
      if (player.stunTime <= 0) {
        player.isStunned = false;
      }
    }

    movePlayer();
    moveReceivers();
    moveDefenders();
    updateParticles();
    updateCamera();

    updateUI();
  }

  draw();
  requestAnimationFrame(update);
}

// Mouse controls for aiming
canvas.addEventListener("mousedown", (e) => {
  if (!playActive || !player.hasBall || currentPlay !== "pass") return;

  isAiming = true;
  const rect = canvas.getBoundingClientRect();
  aimStartX = e.clientX - rect.left;
  aimStartY = e.clientY - rect.top;
  currentAimX = aimStartX;
  currentAimY = aimStartY;
  aimPower = 0;
});

canvas.addEventListener("mousemove", (e) => {
  if (!isAiming) return;

  const rect = canvas.getBoundingClientRect();
  currentAimX = e.clientX - rect.left;
  currentAimY = e.clientY - rect.top;

  const dx = aimStartX - currentAimX;
  const dy = aimStartY - currentAimY;
  aimPower = Math.sqrt(dx * dx + dy * dy);

  const maxPower = 200;
  const percentage = Math.min((aimPower / maxPower) * 100, 100);
  powerMeter.style.width = percentage + "%";
});

canvas.addEventListener("mouseup", () => {
  if (!isAiming) return;

  isAiming = false;
  if (aimPower > 10) {
    throwPass(aimPower);
  }
  powerMeter.style.width = "0%";
});

// Keyboard controls
function handleKeyDown(e) {
  if (e.code === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = true;
  if (e.code === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = true;
  if (e.code === "ArrowUp" || e.key === "w" || e.key === "W") keys.up = true;
  if (e.code === "ArrowDown" || e.key === "s" || e.key === "S") keys.down = true;
  if (e.code === "ShiftLeft" || e.code === "ShiftRight") keys.sprint = true;

  if (e.code === "Space") {
    e.preventDefault();
    if (currentPlay) startPlay();
  }
  if (e.key === "h" || e.key === "H") showPlayMenu();
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

// UI Event Listeners
startBtn.addEventListener("click", () => {
  gameStarted = true;
  messageEl.classList.add("hidden");
  resetPlay();
  showPlayMenu();
});

huddleBtn.addEventListener("click", () => {
  if (!gameStarted || gameOver) return;
  showPlayMenu();
});

snapBtn.addEventListener("click", startPlay);

// Play menu button handlers
document.querySelectorAll(".play-option").forEach(button => {
  button.addEventListener("click", (e) => {
    const play = e.currentTarget.dataset.play;
    selectPlay(play);
  });
});

// Mobile controls
document.getElementById("upBtn").addEventListener("mousedown", () => (keys.up = true));
document.getElementById("upBtn").addEventListener("mouseup", () => (keys.up = false));
document.getElementById("downBtn").addEventListener("mousedown", () => (keys.down = true));
document.getElementById("downBtn").addEventListener("mouseup", () => (keys.down = false));
document.getElementById("leftBtn").addEventListener("mousedown", () => (keys.left = true));
document.getElementById("leftBtn").addEventListener("mouseup", () => (keys.left = false));
document.getElementById("rightBtn").addEventListener("mousedown", () => (keys.right = true));
document.getElementById("rightBtn").addEventListener("mouseup", () => (keys.right = false));
document.getElementById("sprintBtn").addEventListener("mousedown", () => (keys.sprint = true));
document.getElementById("sprintBtn").addEventListener("mouseup", () => (keys.sprint = false));

requestAnimationFrame(update);
updateUI();
