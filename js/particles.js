'use strict';

const particles = [];
const floatTexts = [];

function spawnBurst(x, y, color, count = 16) {
  if (save.reducedMotion) count = Math.min(count, 6);
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const sp = 60 + Math.random() * 180;
    particles.push({
      x, y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp - 40,
      life: 0.5 + Math.random() * 0.4,
      max: 0.5 + Math.random() * 0.4,
      r: 2 + Math.random() * 5,
      color: color || '#FFD56A',
      kind: Math.random() > 0.5 ? 'dot' : 'star',
    });
  }
}

function spawnRing(x, y, color, r0) {
  if (save.reducedMotion) return;
  particles.push({
    x, y, vx: 0, vy: 0,
    life: 0.35, max: 0.35,
    r: r0 || 30,
    grow: 80,
    color: color || '#fff',
    kind: 'ring',
  });
}

function spawnPraise(x, y, text) {
  floatTexts.push({
    x, y,
    text: text || PRAISE[Math.floor(Math.random() * PRAISE.length)],
    life: 0.85,
    max: 0.85,
    vy: -50,
  });
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    if (p.kind === 'ring') {
      p.r += (p.grow || 60) * dt;
      continue;
    }
    p.vy += 220 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.98;
  }
  for (let i = floatTexts.length - 1; i >= 0; i--) {
    const t = floatTexts[i];
    t.life -= dt;
    if (t.life <= 0) {
      floatTexts.splice(i, 1);
      continue;
    }
    t.y += t.vy * dt;
  }
}

function drawParticles(ctx) {
  for (const p of particles) {
    const a = Math.max(0, p.life / p.max);
    ctx.save();
    ctx.globalAlpha = a;
    if (p.kind === 'ring') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.kind === 'star') {
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const ang = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        const r = i % 2 === 0 ? p.r : p.r * 0.45;
        // simple diamond-ish
      }
      ctx.fillRect(-p.r, -p.r * 0.4, p.r * 2, p.r * 0.8);
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  for (const t of floatTexts) {
    const a = Math.max(0, t.life / t.max);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = 'bold 26px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.strokeText(t.text, t.x, t.y);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(t.text, t.x, t.y);
    ctx.restore();
  }
}

function clearParticles() {
  particles.length = 0;
  floatTexts.length = 0;
}
