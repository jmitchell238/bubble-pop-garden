'use strict';

/** @type {'menu'|'play'|'win'} */
let state = 'menu';

let bubbles = [];
let spawnTimer = 0;
let modeId = 'free';
let progress = 0;        // pops toward goal
let goalTarget = 0;
let huntColor = null;    // color id for color hunt
let sessionPops = 0;
let streak = 0;
let winFlash = 0;
let flowerPhase = 0;

function currentMode() {
  return MODES[modeId] || MODES.free;
}

function pickHuntColor() {
  return BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
}

function resetMission() {
  const m = currentMode();
  progress = 0;
  sessionPops = 0;
  streak = 0;
  huntColor = null;
  goalTarget = 0;
  if (m.goal) {
    if (m.goal.type === 'count') goalTarget = m.goal.target;
    if (m.goal.type === 'color') {
      goalTarget = m.goal.target;
      huntColor = pickHuntColor();
    }
  }
}

function enterPlay(forceMode) {
  state = 'play';
  if (forceMode) modeId = forceMode;
  else modeId = save.mode || 'free';
  bubbles = [];
  spawnTimer = 0.2;
  clearParticles();
  resetMission();
  winFlash = 0;
  // seed a few bubbles
  for (let i = 0; i < 4; i++) spawnBubble(true);
}

function enterMenu() {
  state = 'menu';
  bubbles = [];
  clearParticles();
}

function enterWin() {
  state = 'win';
  winFlash = 1.2;
  sfxCelebrate();
  spawnBurst(W / 2, H * 0.4, '#FFD56A', 28);
  spawnBurst(W / 2, H * 0.4, '#7DFFA0', 18);
  spawnPraise(W / 2, H * 0.32, 'You did it!');
  recordMission();
  noteBestStreak(streak);
}

function randColor() {
  // Bias toward hunt color so missions stay fair for little kids
  if (huntColor && Math.random() < 0.45) {
    return BUBBLE_COLORS.find(c => c.id === huntColor.id) || huntColor;
  }
  return BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
}

function spawnBubble(fromBottom) {
  if (bubbles.length >= MAX_BUBBLES) return;
  const color = randColor();
  const r = RADIUS_MIN + Math.random() * (RADIUS_MAX - RADIUS_MIN);
  const x = r + 16 + Math.random() * (W - 2 * r - 32);
  const y = fromBottom ? H + r + Math.random() * 40 : H + r;
  const rise = RISE_MIN + Math.random() * (RISE_MAX - RISE_MIN);
  bubbles.push({
    x, y, r,
    baseX: x,
    color,
    rise: save.reducedMotion ? rise * 0.65 : rise,
    phase: Math.random() * Math.PI * 2,
    wobble: WOBBLE * (0.6 + Math.random() * 0.6),
    alive: true,
    popT: 0,
  });
}

function hitBubble(px, py) {
  // top-most first
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    if (!b.alive) continue;
    const dx = px - b.x;
    const dy = py - b.y;
    const hitR = b.r * 1.15;
    if (dx * dx + dy * dy <= hitR * hitR) return b;
  }
  return null;
}

function popBubble(b, correct) {
  if (!b.alive) return;
  b.alive = false;
  b.popT = 0.2;

  const col = b.color;
  sfxPop(col.note);
  spawnBurst(b.x, b.y, col.glow, correct === false ? 6 : 18);
  spawnRing(b.x, b.y, col.fill, b.r);
  if (correct !== false) {
    spawnPraise(b.x, b.y - b.r - 8);
    recordPop();
    sessionPops++;
    streak++;
  } else {
    sfxSoftMiss();
    spawnPraise(b.x, b.y - b.r - 8, 'Try ' + (huntColor ? huntColor.label : 'again') + '!');
    streak = 0;
  }
}

function onTap(x, y) {
  if (state !== 'play') return;
  const b = hitBubble(x, y);
  if (!b) return;

  const m = currentMode();
  if (m.goal && m.goal.type === 'color' && huntColor) {
    if (b.color.id !== huntColor.id) {
      popBubble(b, false); // still pops (no stuck bubbles) but doesn't count — soft feedback
      // Actually for kids: wrong color still pops but doesn't progress — or soft bounce?
      // Spec: soft "oops" — popping wrong is fine for 4yo; only progress on right
      return;
    }
  }

  popBubble(b, true);

  if (m.goal) {
    if (m.goal.type === 'count') {
      progress = sessionPops;
      if (progress >= goalTarget) enterWin();
    } else if (m.goal.type === 'color') {
      progress++;
      if (progress >= goalTarget) enterWin();
    }
  }
}

function updatePlay(dt) {
  flowerPhase += dt;
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnBubble(true);
    spawnTimer = SPAWN_EVERY * (0.75 + Math.random() * 0.5);
    if (save.reducedMotion) spawnTimer *= 1.25;
  }

  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    if (!b.alive) {
      b.popT -= dt;
      if (b.popT <= 0) bubbles.splice(i, 1);
      continue;
    }
    b.phase += dt * 1.4;
    b.y -= b.rise * dt;
    b.x = b.baseX + Math.sin(b.phase) * b.wobble;
    // Off top — recycle gently
    if (b.y + b.r < -10) {
      bubbles.splice(i, 1);
    }
  }
  updateParticles(dt);
}

function updateWin(dt) {
  winFlash = Math.max(0, winFlash - dt);
  // keep residual bubbles rising slowly
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    if (!b.alive) {
      b.popT -= dt;
      if (b.popT <= 0) bubbles.splice(i, 1);
      continue;
    }
    b.y -= b.rise * 0.4 * dt;
    b.phase += dt;
    b.x = b.baseX + Math.sin(b.phase) * b.wobble * 0.5;
  }
  updateParticles(dt);
}

function drawGarden(ctx) {
  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.65);
  sky.addColorStop(0, '#87CEEB');
  sky.addColorStop(0.55, '#C5E8F7');
  sky.addColorStop(1, '#E8F5E9');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Sun
  ctx.fillStyle = 'rgba(255, 236, 140, 0.95)';
  ctx.beginPath();
  ctx.arc(W - 55, 58, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 200, 0.3)';
  ctx.beginPath();
  ctx.arc(W - 55, 58, 48, 0, Math.PI * 2);
  ctx.fill();

  // Clouds
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  drawCloud(ctx, 50, 80, 0.9);
  drawCloud(ctx, 180, 45, 0.7);
  drawCloud(ctx, 280, 95, 0.65);

  // Hills
  ctx.fillStyle = '#81C784';
  ctx.beginPath();
  ctx.moveTo(0, H * 0.58);
  ctx.quadraticCurveTo(W * 0.3, H * 0.5, W * 0.55, H * 0.58);
  ctx.quadraticCurveTo(W * 0.8, H * 0.64, W, H * 0.55);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#66BB6A';
  ctx.beginPath();
  ctx.moveTo(0, H * 0.72);
  ctx.quadraticCurveTo(W * 0.4, H * 0.66, W, H * 0.74);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // Flowers
  const flowers = [
    [40, H - 70, '#F48FB1'], [90, H - 50, '#FFEE58'], [140, H - 80, '#AB47BC'],
    [200, H - 55, '#FF5252'], [260, H - 75, '#42A5F5'], [320, H - 48, '#FFEE58'],
    [360, H - 90, '#F48FB1'], [70, H - 110, '#66BB6A'],
  ];
  for (const [fx, fy, fc] of flowers) {
    drawFlower(ctx, fx, fy + Math.sin(flowerPhase * 2 + fx) * 2, fc);
  }
}

function drawCloud(ctx, x, y, s) {
  ctx.beginPath();
  ctx.arc(x, y, 14 * s, 0, Math.PI * 2);
  ctx.arc(x + 16 * s, y - 5 * s, 18 * s, 0, Math.PI * 2);
  ctx.arc(x + 34 * s, y, 12 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawFlower(ctx, x, y, color) {
  ctx.fillStyle = '#558B2F';
  ctx.fillRect(x - 1.5, y, 3, 18);
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + flowerPhase * 0.3;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * 7, y + Math.sin(a) * 7, 6, 5, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#FFF59D';
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawBubble(ctx, b) {
  const col = b.color;
  let scale = 1;
  if (!b.alive) scale = Math.max(0.1, b.popT / 0.2);

  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.scale(scale, scale);

  // Soft body
  const g = ctx.createRadialGradient(-b.r * 0.3, -b.r * 0.35, b.r * 0.1, 0, 0, b.r);
  g.addColorStop(0, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.35, col.glow);
  g.addColorStop(0.85, col.fill);
  g.addColorStop(1, col.rim);
  ctx.globalAlpha = 0.82;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, b.r, 0, Math.PI * 2);
  ctx.fill();

  // Rim
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = col.rim;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Shine
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.ellipse(-b.r * 0.35, -b.r * 0.35, b.r * 0.22, b.r * 0.14, -0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawHud(ctx) {
  const m = currentMode();
  // Top bar
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(14, 14, W - 28, m.goal ? 64 : 48, 14);
  else ctx.rect(14, 14, W - 28, m.goal ? 64 : 48);
  ctx.fill();

  ctx.font = 'bold 18px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(m.name, W / 2, 32);

  ctx.font = '13px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  if (m.goal && m.goal.type === 'color' && huntColor) {
    ctx.fillText('Pop ' + huntColor.label + ' · ' + progress + '/' + goalTarget, W / 2, 54);
    // color chip
    ctx.fillStyle = huntColor.fill;
    ctx.beginPath();
    ctx.arc(W / 2 - 78, 54, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (m.goal && m.goal.type === 'count') {
    ctx.fillText(progress + ' / ' + goalTarget + ' pops', W / 2, 54);
  } else {
    ctx.fillText('Session ' + sessionPops + ' · All-time ' + (save.pops | 0), W / 2, 48);
  }
}

function drawPlay(ctx) {
  drawGarden(ctx);
  for (const b of bubbles) drawBubble(ctx, b);
  drawParticles(ctx);
  drawHud(ctx);

  ctx.font = '14px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.textAlign = 'center';
  ctx.fillText('Tap the bubbles!', W / 2, H - 28);
}

function drawWinScene(ctx) {
  drawGarden(ctx);
  for (const b of bubbles) drawBubble(ctx, b);
  drawParticles(ctx);
  if (winFlash > 0) {
    ctx.fillStyle = 'rgba(255,255,255,' + (0.15 * Math.min(1, winFlash)) + ')';
    ctx.fillRect(0, 0, W, H);
  }
}

function drawMenuBackdrop(ctx) {
  drawGarden(ctx);
  // floating preview bubbles
  const t = performance.now() / 1000;
  for (let i = 0; i < 5; i++) {
    const c = BUBBLE_COLORS[i % BUBBLE_COLORS.length];
    const bx = 50 + i * 70;
    const by = 180 + Math.sin(t + i) * 18;
    drawBubble(ctx, {
      x: bx, y: by, r: 28 + (i % 3) * 4,
      color: c, alive: true, popT: 0,
    });
  }
  ctx.fillStyle = 'rgba(8, 30, 24, 0.4)';
  ctx.fillRect(0, 0, W, H);
}
