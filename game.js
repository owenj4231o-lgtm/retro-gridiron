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

// Canvas dimensions
const CANVAS_W = canvas.width;
const CANVAS_H = canvas.height;
const FIELD_WIDTH = 3600;
const FIELD_HEIGHT = 800;

// Camera
let cameraX = 0;
let cameraY = 0;

// Game state
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
let selectedPlayCategory = null; // 'run' or 'pass'

let possession = "player";
let particles = [];

// Pass aiming
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

// ========== PLAY LIBRARY ==========
const PLAY_LIBRARY = {
  run: [
    {
      id: "power",
      name: "Power Run",
      description: "Handoff to RB, follow the blockers",
      formation: "I-Form",
      expectedGain: 4,
      diagram: "powerRunDiagram"
    },
    {
      id: "sweep",
      name: "Sweep",
      description: "RB takes it outside, look for the edge",
      formation: "Shotgun",
      expectedGain: 5,
      diagram: "sweepDiagram"
    },
    {
      id: "dive",
      name: "Dive",
      description: "Quick handoff up the middle",
      formation: "I-Form",
      expectedGain: 3,
      diagram: "diveDiagram"
    },
    {
      id: "trap",
      name: "Trap",
      description: "Pull guard leads the way",
      formation: "Shotgun",
      expectedGain: 6,
      diagram: "trapDiagram"
    },
    {
      id: "toss",
      name: "Toss Sweep",
      description: "Quick pitch to the outside",
      formation: "Shotgun",
      expectedGain: 4,
      diagram: "tossDiagram"
    },
    {
      id: "qbKeep",
      name: "QB Keep",
      description: "QB runs it themselves",
      formation: "Shotgun",
      expectedGain: 3,
      diagram: "qbKeepDiagram"
    },
    {
      id: "stretch",
      name: "Stretch",
      description: "Take it wide on the outside",
      formation: "Shotgun",
      expectedGain: 5,
      diagram: "stretchDiagram"
    },
    {
      id: "draw",
      name: "Draw Play",
      description: "Let defense get close, RB cuts upfield",
      formation: "Shotgun",
      expectedGain: 7,
      diagram: "drawDiagram"
    },
    {
      id: "isolation",
      name: "Isolation",
      description: "RB vs one defender",
      formation: "I-Form",
      expectedGain: 4,
      diagram: "isolationDiagram"
    }
  ],
  pass: [
    {
      id: "slants",
      name: "Slant Routes",
      description: "Quick hitters inside",
      formation: "3WR",
      receiverRoutes: ["slant", "slant", "slant"],
      diagram: "slantsDiagram"
    },
    {
      id: "outs",
      name: "Outs",
      description: "Receivers break outside",
      formation: "3WR",
      receiverRoutes: ["out", "out", "out"],
      diagram: "outsDiagram"
    },
    {
      id: "deepPost",
      name: "Deep Post",
      description: "Vertical routes down the field",
      formation: "3WR",
      receiverRoutes: ["deepPost", "deepPost", "deepPost"],
      diagram: "deepPostDiagram"
    },
    {
      id: "crossers",
      name: "Crossers",
      description: "Receivers cross the middle",
      formation: "3WR",
      receiverRoutes: ["cross", "cross", "cross"],
      diagram: "crossersDiagram"
    },
    {
      id: "seam",
      name: "Seam Route",
      description: "Up the middle vertically",
      formation: "2WR-TE",
      receiverRoutes: ["seam", "slant", "out"],
      diagram: "seamDiagram"
    },
    {
      id: "screens",
      name: "Screens",
      description: "Quick pass behind the line",
      formation: "Shotgun",
      receiverRoutes: ["screen", "screen", "screen"],
      diagram: "screensDiagram"
    },
    {
      id: "combo",
      name: "Combo Routes",
      description: "Mixed in and out breaks",
      formation: "3WR",
      receiverRoutes: ["in", "out", "in"],
      diagram: "comboDiagram"
    },
    {
      id: "digs",
      name: "Dig Routes",
      description: "Receivers dig across field",
      formation: "3WR",
      receiverRoutes: ["dig", "dig", "dig"],
      diagram: "digsDiagram"
    },
    {
      id: "go",
      name: "Go Routes",
      description: "Straight down the field",
      formation: "3WR",
      receiverRoutes: ["go", "go", "go"],
      diagram: "goDiagram"
    },
    {
      id: "hook",
      name: "Hooks",
      description: "Receivers stop and turn around",
      formation: "3WR",
      receiverRoutes: ["hook", "hook", "hook"],
      diagram: "hookDiagram"
    },
    {
      id: "flood",
      name: "Flood",
      description: "Three receivers to one side",
      formation: "3WR",
      receiverRoutes: ["slant", "out", "go"],
      diagram: "floodDiagram"
    },
    {
      id: "bunch",
      name: "Bunch",
      description: "Receivers run from tight formation",
      formation: "Bunch",
      receiverRoutes: ["slant", "out", "go"],
      diagram: "bunchDiagram"
    },
    {
      id: "rub",
      name: "Rub Routes",
      description: "Pick plays to free receivers",
      formation: "3WR",
      receiverRoutes: ["rub", "rub", "go"],
      diagram: "rubDiagram"
    },
    {
      id: "mesh",
      name: "Mesh Concept",
      description: "Underneath crossing routes",
      formation: "2WR-TE",
      receiverRoutes: ["cross", "cross", "seam"],
      diagram: "meshDiagram"
    },
    {
      id: "wheel",
      name: "Wheel",
      description: "RB leaks out for pass",
      formation: "I-Form",
      receiverRoutes: ["wheel", "slant", "go"],
      diagram: "wheelDiagram"
    }
  ]
};

// Player object
const player = {
  x: 600,
  y: 400,
  width: 20,
  height: 35,
  vx: 0,
  vy: 0,
  speed: 3,
  sprintSpeed: 5.5,
  acceleration: 0.4,
  friction: 0.85,
  color: "#ffdb35",
  hasBall: true,
  isStunned: false,
  stunTime: 0,
  role: "QB" // QB, RB, WR, TE, OL
};

const offenseTeam = []; // All 11 offensive players
const defenders = [];
const receivers = [];
let passTarget = null;

// Create all 11 players on offense
function createOffenseFormation(playId) {
  offenseTeam.length = 0;
  
  // QB
  const qb = {
    x: 400,
    y: 400,
    width: 20,
    height: 35,
    vx: 0,
    vy: 0,
    speed: 2.5,
    acceleration: 0.3,
    friction: 0.88,
    color: "#ffdb35",
    role: "QB",
    hasBall: true,
    active: true
  };
  offenseTeam.push(qb);
  player.x = qb.x;
  player.y = qb.y;
  
  // O-Line (5 players)
  const olPositions = [
    { x: 350, y: 350 }, // LT
    { x: 350, y: 375 }, // LG
    { x: 350, y: 400 }, // C
    { x: 350, y: 425 }, // RG
    { x: 350, y: 450 }  // RT
  ];
  
  olPositions.forEach((pos, i) => {
    offenseTeam.push({
      x: pos.x,
      y: pos.y,
      width: 20,
      height: 35,
      vx: 0,
      vy: 0,
      speed: 2.0,
      acceleration: 0.25,
      friction: 0.90,
      color: "#4a90e2",
      role: "OL",
      active: true,
      blocking: false
    });
  });
  
  // RB (Running Back)
  offenseTeam.push({
    x: 500,
    y: 400,
    width: 20,
    height: 35,
    vx: 0,
    vy: 0,
    speed: 3.2,
    acceleration: 0.4,
    friction: 0.85,
    color: "#50c878",
    role: "RB",
    active: true,
    route: "block"
  });
  
  // 3 WR/TE based on play
  const receiverCount = currentPlay.receiverRoutes ? currentPlay.receiverRoutes.length : 3;
  const receiverPositions = [
    { x: 650, y: 250 },  // WR1
    { x: 650, y: 550 },  // WR2
    { x: 700, y: 400 }   // TE/WR3
  ];
  
  for (let i = 0; i < 3; i++) {
    const route = currentPlay.receiverRoutes ? currentPlay.receiverRoutes[i] : "block";
    offenseTeam.push({
      x: receiverPositions[i].x,
      y: receiverPositions[i].y,
      width: 20,
      height: 35,
      vx: 0,
      vy: 0,
      speed: 2.8,
      acceleration: 0.35,
      friction: 0.87,
      color: "#58a6ff",
      role: i === 2 ? "TE" : "WR",
      active: true,
      route: route,
      selected: false
    });
  }
}

// Create defending team (11 players)
function createDefense() {
  defenders.length = 0;
  
  // Defensive formation roughly mirrors offense
  const defPositions = [
    { x: 1200, y: 400 },   // DE
    { x: 1250, y: 350 },   // DT
    { x: 1250, y: 400 },   // DT
    { x: 1250, y: 450 },   // DE
    { x: 1300, y: 300 },   // LB
    { x: 1300, y: 400 },   // MLB
    { x: 1300, y: 500 },   // LB
    { x: 1400, y: 250 },   // CB
    { x: 1400, y: 550 },   // CB
    { x: 1450, y: 350 },   // S
    { x: 1450, y: 450 }    // S
  ];
  
  defPositions.forEach((pos, i) => {
    defenders.push({
      x: pos.x,
      y: pos.y,
      width: 20,
      height: 35,
      vx: 0,
      vy: 0,
      speed: 2.4 + Math.random() * 0.4,
      acceleration: 0.35,
      friction: 0.88,
      color: "#e84a4a",
      role: i < 2 ? "DL" : i < 6 ? "LB" : "DB",
      active: true,
      targetLocked: false
    });
  });
}

// Show play selection menu
function showPlaySelectionMenu() {
  inPlayMenu = true;
  selectedPlayCategory = null;
  playMenu.classList.remove("hidden");
  
  let html = `<h3>SELECT PLAY CATEGORY</h3>
    <div class="play-selection">
      <button class="play-category-btn" data-category="run">
        <div class="play-icon">🏃</div>
        <div class="play-name">RUN PLAYS</div>
      </button>
      <button class="play-category-btn" data-category="pass">
        <div class="play-icon">🎯</div>
        <div class="play-name">PASS PLAYS</div>
      </button>
    </div>`;
  
  playMenu.innerHTML = html;
  
  document.querySelectorAll(".play-category-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const category = e.currentTarget.dataset.category;
      showPlayOptions(category);
    });
  });
}

// Show 3 play options for selected category
function showPlayOptions(category) {
  selectedPlayCategory = category;
  const plays = PLAY_LIBRARY[category];
  
  let html = `<h3>${category.toUpperCase()} PLAYS</h3>
    <button class="back-btn" onclick="showPlaySelectionMenu()">← BACK</button>
    <div class="play-selection">`;
  
  // Show 3 random plays from the category
  const selectedPlays = getRandomPlays(plays, 3);
  selectedPlays.forEach(play => {
    html += `<button class="play-option" data-play="${play.id}" data-category="${category}">
      <div class="play-diagram">${drawPlayDiagram(play, category)}</div>
      <div class="play-name">${play.name}</div>
      <div class="play-desc">${play.description}</div>
      <div class="expected-gain">Expected: ${play.expectedGain || '3-5'} yds</div>
    </button>`;
  });
  
  html += `</div>`;
  playMenu.innerHTML = html;
  
  document.querySelectorAll(".play-option").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const playId = e.currentTarget.dataset.play;
      const cat = e.currentTarget.dataset.category;
      selectPlay(playId, cat);
    });
  });
}

// Get 3 random plays, cycle through all 9-15
function getRandomPlays(plays, count) {
  const shuffled = [...plays].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Draw simple play diagram
function drawPlayDiagram(play, category) {
  // Return SVG-like diagram or canvas drawing info
  // For now, return simple ASCII-like representation
  if (category === "run") {
    return "→ RB ↗ Blockers";
  } else {
    return "QB → WR ↙ Routes";
  }
}

function selectPlay(playId, category) {
  const playLib = PLAY_LIBRARY[category];
  currentPlay = playLib.find(p => p.id === playId);
  currentPlay.category = category;
  
  hidePlayMenu();
  messageEl.textContent = `Play: ${currentPlay.name} selected. Press SNAP to start!`;
  snapBtn.disabled = false;
}

function hidePlayMenu() {
  inPlayMenu = false;
  playMenu.classList.add("hidden");
}

function resetPlay() {
  offenseTeam.length = 0;
  createOffenseFormation(currentPlay ? currentPlay.id : null);
  createDefense();
  
  player.vx = 0;
  player.vy = 0;
  player.hasBall = true;
  player.isStunned = false;
  player.stunTime = 0;
  
  playActive = false;
  playStarted = false;
  passTarget = null;
  isAiming = false;
  aimingIndicator.classList.add("hidden");
  
  updateUI();
}

function startPlay() {
  if (gameOver || playActive || !currentPlay) return;
  
  playActive = true;
  playStarted = true;
  messageEl.textContent = `${currentPlay.name} - GO!`;
  
  if (currentPlay.category === "run") {
    executeRunPlay();
  } else if (currentPlay.category === "pass") {
    messageEl.textContent = "Click & drag to aim & throw!";
    aimingIndicator.classList.remove("hidden");
  }
}

function executeRunPlay() {
  if (!playActive) return;
  
  // Give RB momentum based on play type
  const rb = offenseTeam.find(p => p.role === "RB");
  if (rb) {
    rb.hasBall = true;
    player.hasBall = false;
    
    // Different plays have different expected gains
    const expectedGain = currentPlay.expectedGain || 4;
    const randomVariance = Math.random() * 4 - 2;
    const actualGain = Math.max(0, expectedGain + randomVariance);
    
    // Simulate run play
    setTimeout(() => {
      if (!playActive) return;
      
      const tackled = Math.random() < 0.4;
      if (tackled) {
        messageEl.textContent = `${currentPlay.name} - TACKLED for ${Math.floor(actualGain)} yards`;
      } else {
        messageEl.textContent = `${currentPlay.name} - Gained ${Math.floor(actualGain)} yards`;
      }
      
      advanceBall(Math.floor(actualGain));
    }, 1500);
  }
}

function moveReceivers() {
  if (!playActive) return;
  
  offenseTeam.forEach(player => {
    if (player.role !== "WR" && player.role !== "TE") return;
    
    // Execute route based on play
    const route = player.route;
    if (route === "slant") {
      player.vx = Math.min(player.vx + player.acceleration, player.speed);
      player.vy = player.y < 400 ? Math.max(player.vy - player.acceleration * 0.5, -player.speed * 0.5) : Math.min(player.vy + player.acceleration * 0.5, player.speed * 0.5);
    } else if (route === "go") {
      player.vx = Math.min(player.vx + player.acceleration * 0.8, player.speed);
      player.vy = player.y < 400 ? Math.max(player.vy - player.acceleration * 0.8, -player.speed * 0.8) : Math.min(player.vy + player.acceleration * 0.8, player.speed * 0.8);
    } else if (route === "out") {
      player.vx = Math.min(player.vx + player.acceleration * 0.6, player.speed * 0.6);
      player.vy = player.y < 400 ? Math.max(player.vy - player.acceleration, -player.speed) : Math.min(player.vy + player.acceleration, player.speed);
    } else if (route === "cross") {
      player.vx = Math.min(player.vx + player.acceleration, player.speed);
      player.vy *= player.friction;
    } else if (route === "seam") {
      player.vx = Math.min(player.vx + player.acceleration * 0.7, player.speed * 0.7);
      player.vy = player.y < 400 ? Math.max(player.vy - player.acceleration * 0.8, -player.speed * 0.8) : Math.min(player.vy + player.acceleration * 0.8, player.speed * 0.8);
    }
    
    player.x += player.vx;
    player.y += player.vy;
    
    player.x = clamp(player.x, 100, FIELD_WIDTH - 100);
    player.y = clamp(player.y, 50, FIELD_HEIGHT - 50);
  });
}

function moveDefenders() {
  if (!playActive) return;
  
  defenders.forEach(defender => {
    if (!defender.active) return;
    
    let targetX = player.x;
    let targetY = player.y;
    
    // Find closest receiver if pass play
    if (currentPlay.category === "pass") {
      let closestReceiver = null;
      let closestDist = Infinity;
      
      offenseTeam.forEach(oPlayer => {
        if ((oPlayer.role === "WR" || oPlayer.role === "TE") && oPlayer.x > player.x) {
          const dist = Math.hypot(oPlayer.x - defender.x, oPlayer.y - defender.y);
          if (dist < closestDist) {
            closestDist = dist;
            closestReceiver = oPlayer;
          }
        }
      });
      
      if (closestReceiver) {
        targetX = closestReceiver.x;
        targetY = closestReceiver.y;
      }
    }
    
    const dx = targetX - defender.x;
    const dy = targetY - defender.y;
    const distance = Math.hypot(dx, dy);
    
    if (distance > 2) {
      const dirX = dx / distance;
      const dirY = dy / distance;
      defender.vx = clamp(defender.vx + dirX * defender.acceleration, -defender.speed, defender.speed);
      defender.vy = clamp(defender.vy + dirY * defender.acceleration, -defender.speed, defender.speed);
    } else {
      defender.vx *= defender.friction;
      defender.vy *= defender.friction;
    }
    
    defender.x += defender.vx;
    defender.y += defender.vy;
    
    defender.x = clamp(defender.x, 100, FIELD_WIDTH - 100);
    defender.y = clamp(defender.y, 50, FIELD_HEIGHT - 50);
    
    // Tackle detection
    offenseTeam.forEach(oPlayer => {
      if (oPlayer.hasBall && collision(oPlayer, defender)) {
        tackle();
      }
    });
  });
}

function throwPass(power) {
  if (!playActive) return;
  
  let closestReceiver = null;
  let closestDist = Infinity;
  
  offenseTeam.forEach(oPlayer => {
    if ((oPlayer.role === "WR" || oPlayer.role === "TE") && oPlayer.x > player.x) {
      const dist = Math.hypot(oPlayer.x - player.x, oPlayer.y - player.y);
      if (dist < closestDist) {
        closestDist = dist;
        closestReceiver = oPlayer;
      }
    }
  });
  
  if (!closestReceiver) {
    incompletePass();
    return;
  }
  
  player.hasBall = false;
  passTarget = closestReceiver;
  closestReceiver.selected = true;
  messageEl.textContent = "BALL IN THE AIR!";
  
  setTimeout(() => {
    if (!playActive) return;
    const catchChance = Math.max(0.3, Math.min(0.95, power / 150));
    const defenseProximity = 1 - Math.min(closestDist / 500, 1);
    const totalChance = catchChance * (0.6 + defenseProximity * 0.4);
    
    if (Math.random() < totalChance) {
      completePass(closestReceiver);
    } else {
      incompletePass();
    }
  }, 600);
}

function completePass(receiver) {
  playActive = true;
  isAiming = false;
  aimingIndicator.classList.add("hidden");
  
  player.x = receiver.x;
  player.y = receiver.y;
  player.hasBall = true;
  receiver.selected = false;
  passTarget = null;
  
  messageEl.textContent = "COMPLETE! Keep running!";
  
  const gained = Math.max(3, Math.floor((receiver.x - 600) / 30));
  ballPosition += gained;
  distance -= gained;
  
  if (distance <= 0) {
    touchdown();
  } else {
    updateUI();
  }
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
    showPlaySelectionMenu();
  }, 1200);
}

function tackle() {
  playActive = false;
  player.isStunned = true;
  player.stunTime = 30;
  
  const gained = Math.max(1, Math.floor((player.x - 600) / 30));
  messageEl.textContent = `TACKLED! ${gained} yard${gained !== 1 ? "s" : ""}.`;
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
    showPlaySelectionMenu();
  }, 1500);
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
      showPlaySelectionMenu();
    }
  }, 2000);
}

function turnover() {
  playActive = false;
  messageEl.textContent = "TURNOVER ON DOWNS!";
  possession = "cpu";
  cpuPossession();
}

function outOfBounds() {
  playActive = false;
  const gained = Math.max(1, Math.floor((player.x - 600) / 30));
  messageEl.textContent = `OUT OF BOUNDS! ${gained} yard${gained !== 1 ? "s" : ""}.`;
  advanceBall(gained);
}

function cpuPossession() {
  messageEl.textContent = "CPU HAS BALL — Defense!";
  
  setTimeout(() => {
    const cpuGain = Math.floor(5 + Math.random() * 14);
    const isTouchdown = Math.random() < 0.25 || cpuGain > 12;
    
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
        showPlaySelectionMenu();
      }, 1500);
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
    showPlaySelectionMenu();
  }, 2000);
}

function movePlayer() {
  if (!playActive || !player.hasBall || isAiming) return;
  
  const currentMaxSpeed = keys.sprint ? player.sprintSpeed : player.speed;
  
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
  
  player.x += player.vx;
  player.y += player.vy;
  
  if (player.x < 100 || player.x > FIELD_WIDTH - 100 || player.y < 50 || player.y > FIELD_HEIGHT - 50) {
    outOfBounds();
    return;
  }
  
  if (playActive && player.hasBall && player.x > FIELD_WIDTH - 150) {
    touchdown();
  }
}

function updateCamera() {
  const targetCamX = player.x - CANVAS_W / 3;
  const targetCamY = player.y - CANVAS_H / 2;
  
  cameraX += (targetCamX - cameraX) * 0.15;
  cameraY += (targetCamY - cameraY) * 0.15;
  
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

// Drawing functions
function drawField() {
  for (let x = 0; x < FIELD_WIDTH; x += 300) {
    ctx.fillStyle = x % 600 === 0 ? "#1d6b2f" : "#238b46";
    ctx.fillRect(x - cameraX, 0 - cameraY, 300, FIELD_HEIGHT);
  }
  
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(50 - cameraX, 0 - cameraY, 8, FIELD_HEIGHT);
  ctx.fillRect(FIELD_WIDTH - 58 - cameraX, 0 - cameraY, 8, FIELD_HEIGHT);
  
  for (let x = 300; x < FIELD_WIDTH - 50; x += 300) {
    ctx.fillRect(x - cameraX, 0 - cameraY, 4, FIELD_HEIGHT);
    
    for (let y = 100; y < FIELD_HEIGHT - 50; y += 200) {
      ctx.fillRect(x - 20 - cameraX, y - cameraY, 40, 4);
    }
  }
  
  ctx.fillStyle = "#2466a8";
  ctx.fillRect(0 - cameraX, 0 - cameraY, 100, FIELD_HEIGHT);
  ctx.fillStyle = "#9d3636";
  ctx.fillRect(FIELD_WIDTH - 100 - cameraX, 0 - cameraY, 100, FIELD_HEIGHT);
}

function drawPlayers() {
  // Draw offense
  offenseTeam.forEach(oPlayer => {
    const screenX = oPlayer.x - cameraX;
    const screenY = oPlayer.y - cameraY;
    
    if (screenX > -50 && screenX < CANVAS_W + 50 && screenY > -50 && screenY < CANVAS_H + 50) {
      drawCharacter(oPlayer, oPlayer.color, screenX, screenY);
      
      if (oPlayer === player && Math.abs(player.vx) > 0.3 || Math.abs(player.vy) > 0.3) {
        ctx.strokeStyle = "rgba(255, 212, 71, 0.6)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(screenX + 10, screenY + 17);
        ctx.lineTo(screenX + 10 + player.vx * 5, screenY + 17 + player.vy * 5);
        ctx.stroke();
      }
    }
  });
  
  // Draw defense
  defenders.forEach(def => {
    const screenX = def.x - cameraX;
    const screenY = def.y - cameraY;
    
    if (screenX > -50 && screenX < CANVAS_W + 50 && screenY > -50 && screenY < CANVAS_H + 50) {
      drawCharacter(def, def.color, screenX, screenY);
    }
  });
}

function drawCharacter(char, color, screenX, screenY) {
  const x = screenX;
  const y = screenY;
  
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(x - 2, y + 35 - 1, 24, 4);
  
  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(x + 10, y + 4, 5, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = "#e4a06b";
  ctx.fillRect(x + 6, y + 2, 8, 4);
  
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 8, y + 2);
  ctx.lineTo(x + 8, y + 6);
  ctx.moveTo(x + 12, y + 2);
  ctx.lineTo(x + 12, y + 6);
  ctx.stroke();
  
  ctx.fillStyle = color;
  ctx.fillRect(x + 7, y + 9, 6, 3);
  ctx.fillRect(x + 2, y + 12, 16, 14);
  ctx.fillRect(x - 3, y + 12, 5, 10);
  ctx.fillRect(x + 18, y + 12, 5, 10);
  
  ctx.fillStyle = "#e4a06b";
  ctx.fillRect(x - 3, y + 22, 5, 6);
  ctx.fillRect(x + 18, y + 22, 5, 6);
  
  ctx.fillStyle = "#18212c";
  ctx.fillRect(x + 5, y + 26, 4, 9);
  ctx.fillRect(x + 11, y + 26, 4, 9);
  
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
  ctx.moveTo(screenX + 10, screenY + 17);
  ctx.lineTo(currentAimX, currentAimY);
  ctx.stroke();
  ctx.setLineDash([]);
  
  const circleSize = aimPower / 5;
  ctx.strokeStyle = "rgba(255, 212, 71, 0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(screenX + 10, screenY + 17, circleSize, 0, Math.PI * 2);
  ctx.stroke();
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
  });
}

function draw() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawField();
  drawPlayers();
  drawAimingLine();
  drawParticles();
}

function update() {
  if (!gameOver && gameStarted) {
    if (gameClock > 0) gameClock -= 0.016;
    
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

// Event listeners
canvas.addEventListener("mousedown", (e) => {
  if (!playActive || !player.hasBall || currentPlay.category !== "pass") return;
  
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
  
  const maxPower = 250;
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
  if (e.key === "h" || e.key === "H") showPlaySelectionMenu();
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
  showPlaySelectionMenu();
});

huddleBtn.addEventListener("click", () => {
  if (!gameStarted || gameOver) return;
  showPlaySelectionMenu();
});

snapBtn.addEventListener("click", startPlay);

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
