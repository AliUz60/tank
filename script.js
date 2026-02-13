const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let W = window.innerWidth;
let H = window.innerHeight;

canvas.width = W;
canvas.height = H;

window.addEventListener("resize", () => {
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W;
  canvas.height = H;
});

/* ===========================
   TANK SPRITE CROP AYARI
   =========================== */
// BURAYI DEĞİŞTİREREK TANKI KIRPARSIN
// sx = soldan kaç px
// sy = üstten kaç px
// sw = tank genişliği
// sh = tank yüksekliği
const TANK_SPRITE = {
  sx: 90,
  sy: 150,
  sw: 350,
  sh: 250
};

/* ===========================
   UI ELEMENTS
   =========================== */
const hpText = document.getElementById("hpText");
const maxHpText = document.getElementById("maxHpText");
const scoreText = document.getElementById("scoreText");
const levelText = document.getElementById("levelText");
const goldText = document.getElementById("goldText");
const killText = document.getElementById("killText");

const shopUI = document.getElementById("shop");
const shopGold = document.getElementById("shopGold");

const buyDmg = document.getElementById("buyDmg");
const buySpeed = document.getElementById("buySpeed");
const buyMaxHp = document.getElementById("buyMaxHp");
const buyFireRate = document.getElementById("buyFireRate");
const closeShop = document.getElementById("closeShop");

const gameOverUI = document.getElementById("gameOver");
const finalScore = document.getElementById("finalScore");
const restartBtn = document.getElementById("restart");

/* ===========================
   ASSETS
   =========================== */
const tankImg = new Image();
tankImg.src = "assets/tank.png";

const boomSound = new Audio("assets/patlama.mp3");
boomSound.volume = 0.65;

function playBoom() {
  boomSound.currentTime = 0;
  boomSound.play();
}

/* ===========================
   INPUT
   =========================== */
let keys = {};
let mouse = { x: W / 2, y: H / 2, down: false };

document.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;

  // SHOP toggle
  if (e.key.toLowerCase() === "e") {
    if (!shopOpen) openShop();
    else closeShopUI();
  }
});

document.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

canvas.addEventListener("mousedown", () => mouse.down = true);
canvas.addEventListener("mouseup", () => mouse.down = false);

/* ===========================
   MOBILE CONTROLS
   =========================== */
function setupMobileButton(btnId, keyName) {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  btn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    keys[keyName] = true;
  });

  btn.addEventListener("touchend", (e) => {
    e.preventDefault();
    keys[keyName] = false;
  });
}

setupMobileButton("btnUp", "w");
setupMobileButton("btnDown", "s");
setupMobileButton("btnLeft", "a");
setupMobileButton("btnRight", "d");

const btnShoot = document.getElementById("btnShoot");
const btnDash = document.getElementById("btnDash");

if (btnShoot) {
  btnShoot.addEventListener("touchstart", (e) => {
    e.preventDefault();
    mouse.down = true;
  });

  btnShoot.addEventListener("touchend", (e) => {
    e.preventDefault();
    mouse.down = false;
  });
}

if (btnDash) {
  btnDash.addEventListener("touchstart", (e) => {
    e.preventDefault();
    keys["shift"] = true;
  });

  btnDash.addEventListener("touchend", (e) => {
    e.preventDefault();
    keys["shift"] = false;
  });
}

/* ===========================
   UTILS
   =========================== */
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/* ===========================
   CAMERA
   =========================== */
let cam = {
  x: 0,
  y: 0,
  shake: 0
};

/* ===========================
   WORLD SETTINGS
   =========================== */
const world = {
  width: 2600,
  height: 2000
};

/* ===========================
   WALLS
   =========================== */
let walls = [
  { x: 500, y: 400, w: 500, h: 60 },
  { x: 900, y: 800, w: 60, h: 500 },
  { x: 1400, y: 350, w: 300, h: 80 },
  { x: 1700, y: 900, w: 500, h: 60 },
  { x: 300, y: 1300, w: 700, h: 70 },
  { x: 2000, y: 1400, w: 80, h: 400 }
];

function rectCircleCollide(rx, ry, rw, rh, cx, cy, cr) {
  let closestX = clamp(cx, rx, rx + rw);
  let closestY = clamp(cy, ry, ry + rh);
  let dx = cx - closestX;
  let dy = cy - closestY;
  return (dx * dx + dy * dy) < cr * cr;
}

/* ===========================
   GAME OBJECTS
   =========================== */
let player = {
  x: world.width / 2,
  y: world.height / 2,
  angle: 0,
  turretAngle: 0,
  radius: 24,
  hp: 100,
  maxHp: 100,
  speed: 3.2,
  dashCooldown: 0,
  damage: 25,
  fireRate: 12,
  fireCooldown: 0
};

let bullets = [];
let enemies = [];
let particles = [];

let score = 0;
let kills = 0;
let level = 1;
let gold = 0;
let gameOver = false;
let shopOpen = false;

/* ===========================
   SHOP
   =========================== */
function openShop() {
  shopOpen = true;
  shopUI.style.display = "block";
}

function closeShopUI() {
  shopOpen = false;
  shopUI.style.display = "none";
}

closeShop.addEventListener("click", () => closeShopUI());

buyDmg.addEventListener("click", () => {
  if (gold >= 50) {
    gold -= 50;
    player.damage += 5;
  }
});

buySpeed.addEventListener("click", () => {
  if (gold >= 50) {
    gold -= 50;
    player.speed += 0.4;
  }
});

buyMaxHp.addEventListener("click", () => {
  if (gold >= 70) {
    gold -= 70;
    player.maxHp += 20;
    player.hp = player.maxHp;
  }
});

buyFireRate.addEventListener("click", () => {
  if (gold >= 80) {
    gold -= 80;
    player.fireRate = Math.max(4, player.fireRate - 2);
  }
});

restartBtn.addEventListener("click", () => {
  resetGame();
});

/* ===========================
   ENEMY SPAWN
   =========================== */
function spawnEnemy() {
  let side = Math.floor(rand(0, 4));
  let x, y;

  if (side === 0) { x = 50; y = rand(50, world.height - 50); }
  if (side === 1) { x = world.width - 50; y = rand(50, world.height - 50); }
  if (side === 2) { x = rand(50, world.width - 50); y = 50; }
  if (side === 3) { x = rand(50, world.width - 50); y = world.height - 50; }

  enemies.push({
    x, y,
    radius: 22,
    hp: 60 + level * 18,
    maxHp: 60 + level * 18,
    speed: 1.4 + level * 0.12,
    shootCooldown: rand(60, 130),
    turretAngle: 0
  });
}

/* ===========================
   EXPLOSION PARTICLES
   =========================== */
function explode(x, y) {
  playBoom();
  cam.shake = 14;

  for (let i = 0; i < 35; i++) {
    particles.push({
      x, y,
      vx: rand(-4, 4),
      vy: rand(-4, 4),
      life: rand(25, 65),
      size: rand(2, 7)
    });
  }
}

/* ===========================
   SHOOT
   =========================== */
function shoot(fromEnemy = false, enemyObj = null) {
  if (!fromEnemy) {
    if (player.fireCooldown > 0) return;
    player.fireCooldown = player.fireRate;
  }

  let sx, sy, ang, dmg;

  if (!fromEnemy) {
    sx = player.x + Math.cos(player.turretAngle) * 35;
    sy = player.y + Math.sin(player.turretAngle) * 35;
    ang = player.turretAngle;
    dmg = player.damage;
  } else {
    sx = enemyObj.x + Math.cos(enemyObj.turretAngle) * 35;
    sy = enemyObj.y + Math.sin(enemyObj.turretAngle) * 35;
    ang = enemyObj.turretAngle;
    dmg = 12 + level * 2;
  }

  bullets.push({
    x: sx,
    y: sy,
    vx: Math.cos(ang) * 9,
    vy: Math.sin(ang) * 9,
    life: 110,
    damage: dmg,
    enemyBullet: fromEnemy
  });

  cam.shake = Math.max(cam.shake, 4);
}

/* ===========================
   COLLISION WITH WALLS
   =========================== */
function resolveWallCollision(obj) {
  for (let w of walls) {
    if (rectCircleCollide(w.x, w.y, w.w, w.h, obj.x, obj.y, obj.radius)) {
      let left = obj.x - w.x;
      let right = (w.x + w.w) - obj.x;
      let top = obj.y - w.y;
      let bottom = (w.y + w.h) - obj.y;

      let minVal = Math.min(left, right, top, bottom);

      if (minVal === left) obj.x = w.x - obj.radius;
      if (minVal === right) obj.x = w.x + w.w + obj.radius;
      if (minVal === top) obj.y = w.y - obj.radius;
      if (minVal === bottom) obj.y = w.y + w.h + obj.radius;
    }
  }
}

/* ===========================
   CAMERA FOLLOW
   =========================== */
function updateCamera() {
  cam.x = player.x - W / 2;
  cam.y = player.y - H / 2;

  cam.x = clamp(cam.x, 0, world.width - W);
  cam.y = clamp(cam.y, 0, world.height - H);

  if (cam.shake > 0.5) cam.shake *= 0.85;
  else cam.shake = 0;
}

/* ===========================
   DRAW BACKGROUND + WALLS
   =========================== */
function drawWorld() {
  ctx.fillStyle = "#06080f";
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;

  for (let x = 0; x < world.width; x += 70) {
    ctx.beginPath();
    ctx.moveTo(x - cam.x, 0 - cam.y);
    ctx.lineTo(x - cam.x, world.height - cam.y);
    ctx.stroke();
  }

  for (let y = 0; y < world.height; y += 70) {
    ctx.beginPath();
    ctx.moveTo(0 - cam.x, y - cam.y);
    ctx.lineTo(world.width - cam.x, y - cam.y);
    ctx.stroke();
  }

  for (let w of walls) {
    ctx.fillStyle = "rgba(120,120,140,0.35)";
    ctx.fillRect(w.x - cam.x, w.y - cam.y, w.w, w.h);

    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.strokeRect(w.x - cam.x, w.y - cam.y, w.w, w.h);
  }
}

/* ===========================
   DRAW TANK (SPRITE + CROP)
   =========================== */
function drawTankSprite(x, y, angle, size, tint = null) {
  ctx.save();
  ctx.translate(x - cam.x, y - cam.y);
  ctx.rotate(angle);

  if (tint) {
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = tint;
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.globalAlpha = 1;
  }

  ctx.drawImage(
    tankImg,
    TANK_SPRITE.sx,
    TANK_SPRITE.sy,
    TANK_SPRITE.sw,
    TANK_SPRITE.sh,
    -size / 2,
    -size / 2,
    size,
    size
  );

  ctx.restore();
}

/* ===========================
   HEALTH BAR
   =========================== */
function drawHealthBar(x, y, hp, maxHp) {
  let w = 55;
  let h = 7;
  let ratio = clamp(hp / maxHp, 0, 1);

  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(x - w / 2 - cam.x, y - 40 - cam.y, w, h);

  ctx.fillStyle = "#55ff99";
  ctx.fillRect(x - w / 2 - cam.x, y - 40 - cam.y, w * ratio, h);

  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.strokeRect(x - w / 2 - cam.x, y - 40 - cam.y, w, h);
}

/* ===========================
   UI UPDATE
   =========================== */
function updateUI() {
  hpText.textContent = Math.floor(player.hp);
  maxHpText.textContent = player.maxHp;
  scoreText.textContent = score;
  levelText.textContent = level;
  goldText.textContent = gold;
  killText.textContent = kills;

  shopGold.textContent = gold;
}

/* ===========================
   RESET GAME
   =========================== */
function resetGame() {
  player.x = world.width / 2;
  player.y = world.height / 2;
  player.hp = 100;
  player.maxHp = 100;
  player.speed = 3.2;
  player.damage = 25;
  player.fireRate = 12;
  player.fireCooldown = 0;

  bullets = [];
  enemies = [];
  particles = [];

  score = 0;
  kills = 0;
  level = 1;
  gold = 0;

  gameOver = false;
  cam.shake = 0;

  closeShopUI();
  gameOverUI.style.display = "none";
}

/* ===========================
   UPDATE LOGIC
   =========================== */
function update() {
  if (gameOver) return;
  if (shopOpen) return;

  let mx = mouse.x + cam.x;
  let my = mouse.y + cam.y;
  player.turretAngle = Math.atan2(my - player.y, mx - player.x);

  // movement
  let dx = 0;
  let dy = 0;

  if (keys["w"]) dy -= 1;
  if (keys["s"]) dy += 1;
  if (keys["a"]) dx -= 1;
  if (keys["d"]) dx += 1;

  let len = Math.hypot(dx, dy);
  if (len > 0) {
    dx /= len;
    dy /= len;

    player.x += dx * player.speed;
    player.y += dy * player.speed;
    player.angle = Math.atan2(dy, dx);
  }

  // dash
  if ((keys["shift"] || keys["shiftleft"]) && player.dashCooldown <= 0 && len > 0) {
    player.x += dx * 120;
    player.y += dy * 120;
    player.dashCooldown = 180;
    cam.shake = 15;
  }

  if (player.dashCooldown > 0) player.dashCooldown--;

  player.x = clamp(player.x, 40, world.width - 40);
  player.y = clamp(player.y, 40, world.height - 40);

  resolveWallCollision(player);

  // shooting
  if (mouse.down) shoot(false, null);
  if (player.fireCooldown > 0) player.fireCooldown--;

  // bullets update
  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    b.x += b.vx;
    b.y += b.vy;
    b.life--;

    for (let w of walls) {
      if (b.x > w.x && b.x < w.x + w.w && b.y > w.y && b.y < w.y + w.h) {
        explode(b.x, b.y);
        bullets.splice(i, 1);
        break;
      }
    }

    if (i >= bullets.length) continue;
    if (b.life <= 0) bullets.splice(i, 1);
  }

  // spawn enemies
  let maxEnemies = 4 + level * 2;
  if (enemies.length < maxEnemies && Math.random() < 0.03) {
    spawnEnemy();
  }

  // enemy ai
  for (let e of enemies) {
    let ang = Math.atan2(player.y - e.y, player.x - e.x);
    e.turretAngle = ang;

    let d = dist(e.x, e.y, player.x, player.y);

    if (d > 170) {
      e.x += Math.cos(ang) * e.speed;
      e.y += Math.sin(ang) * e.speed;
    } else {
      e.x -= Math.cos(ang) * e.speed * 0.4;
      e.y -= Math.sin(ang) * e.speed * 0.4;
    }

    resolveWallCollision(e);

    e.shootCooldown--;
    if (e.shootCooldown <= 0 && d < 650) {
      shoot(true, e);
      e.shootCooldown = rand(60, 120);
    }

    if (dist(e.x, e.y, player.x, player.y) < 38) {
      player.hp -= 0.35;
      cam.shake = Math.max(cam.shake, 6);
    }
  }

  // bullet collisions
  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];

    if (!b.enemyBullet) {
      for (let j = enemies.length - 1; j >= 0; j--) {
        let e = enemies[j];

        if (dist(b.x, b.y, e.x, e.y) < 24) {
          e.hp -= b.damage;
          explode(b.x, b.y);
          bullets.splice(i, 1);

          if (e.hp <= 0) {
            enemies.splice(j, 1);
            score += 15;
            kills++;
            gold += 20 + level * 3;

            // kill heal
            player.hp += 12;
            if (player.hp > player.maxHp) player.hp = player.maxHp;

            // max hp growth + level
            if (kills % 5 === 0) {
              player.maxHp += 10;
              player.hp = player.maxHp;
              level++;
            }
          }
          break;
        }
      }
    } else {
      if (dist(b.x, b.y, player.x, player.y) < 24) {
        player.hp -= b.damage;
        cam.shake = 10;
        explode(b.x, b.y);
        bullets.splice(i, 1);
      }
    }
  }

  // particles
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.94;
    p.vy *= 0.94;
    p.life--;

    if (p.life <= 0) particles.splice(i, 1);
  }

  if (player.hp <= 0) {
    player.hp = 0;
    gameOver = true;
    finalScore.textContent = score;
    gameOverUI.style.display = "flex";
  }

  updateCamera();
  updateUI();
}

/* ===========================
   RENDER
   =========================== */
function render() {
  ctx.save();

  if (cam.shake > 0.5) {
    ctx.translate(rand(-cam.shake, cam.shake), rand(-cam.shake, cam.shake));
  }

  drawWorld();

  // bullets
  for (let b of bullets) {
    ctx.fillStyle = b.enemyBullet ? "#ff4444" : "#ffee55";
    ctx.beginPath();
    ctx.arc(b.x - cam.x, b.y - cam.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // particles
  for (let p of particles) {
    ctx.fillStyle = `rgba(255,140,40,${p.life / 65})`;
    ctx.beginPath();
    ctx.arc(p.x - cam.x, p.y - cam.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // enemies
  for (let e of enemies) {
    drawTankSprite(e.x, e.y, e.turretAngle, 70, "rgba(255,0,0,0.4)");
    drawHealthBar(e.x, e.y, e.hp, e.maxHp);
  }

  // player
  drawTankSprite(player.x, player.y, player.turretAngle, 80, "rgba(0,255,120,0.25)");
  drawHealthBar(player.x, player.y, player.hp, player.maxHp);

  // minimap
  let mapW = 170;
  let mapH = 130;
  let mapX = W - mapW - 20;
  let mapY = 20;

  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(mapX, mapY, mapW, mapH);

  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.strokeRect(mapX, mapY, mapW, mapH);

  // player dot
  let px = mapX + (player.x / world.width) * mapW;
  let py = mapY + (player.y / world.height) * mapH;

  ctx.fillStyle = "#55ff99";
  ctx.beginPath();
  ctx.arc(px, py, 4, 0, Math.PI * 2);
  ctx.fill();

  // enemy dots
  for (let e of enemies) {
    let ex = mapX + (e.x / world.width) * mapW;
    let ey = mapY + (e.y / world.height) * mapH;

    ctx.fillStyle = "#ff4444";
    ctx.beginPath();
    ctx.arc(ex, ey, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/* ===========================
   LOOP
   =========================== */
function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

/* ===========================
   START GAME
   =========================== */
resetGame();
loop();
