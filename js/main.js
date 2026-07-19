'use strict';

const cv = document.getElementById('cv');
let ctx = null;
let last = performance.now();
let lastPointerHandledAt = 0;

function resizeCanvas() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = Math.min(vw / W, vh / H);
  const cssW = Math.floor(W * scale);
  const cssH = Math.floor(H * scale);
  cv.style.width = cssW + 'px';
  cv.style.height = cssH + 'px';
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.floor(W * dpr);
  cv.height = Math.floor(H * dpr);
  ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function eventToStage(e) {
  const rect = cv.getBoundingClientRect();
  const clientX = e.clientX != null ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
  const clientY = e.clientY != null ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
  return {
    x: ((clientX - rect.left) / rect.width) * W,
    y: ((clientY - rect.top) / rect.height) * H,
  };
}

function setScreen(name) {
  document.querySelectorAll('.screen').forEach(el => {
    el.classList.toggle('hidden', el.dataset.screen !== name);
  });
  document.querySelectorAll('.play-chrome').forEach(el => {
    el.classList.toggle('hidden', name !== 'play');
  });
}

function updateMenuStats() {
  const popsEl = document.getElementById('statPops');
  const misEl = document.getElementById('statMissions');
  if (popsEl) popsEl.textContent = String(save.pops | 0);
  if (misEl) misEl.textContent = String(save.missionsDone | 0);

  const muteBtn = document.getElementById('muteBtn');
  if (muteBtn) muteBtn.textContent = save.muted ? '🔇 Sound off' : '🔊 Sound on';
  const motionBtn = document.getElementById('motionBtn');
  if (motionBtn) motionBtn.textContent = save.reducedMotion ? 'Calm motion' : 'Full motion';

  document.querySelectorAll('.mode-chip').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === save.mode);
  });
}

function showMenu() {
  enterMenu();
  updateMenuStats();
  setScreen('menu');
  if (window.__pendingReload) {
    window.__pendingReload = false;
    window.__reloaded = true;
    location.reload();
  }
}

function showPlay() {
  enterPlay(save.mode);
  setScreen('play');
}

function showWin() {
  setScreen('win');
  const m = currentMode();
  const title = document.getElementById('winTitle');
  const detail = document.getElementById('winDetail');
  if (title) title.textContent = 'Garden cheer!';
  if (detail) {
    detail.textContent = m.goal
      ? 'Mission complete · ' + sessionPops + ' pops'
      : sessionPops + ' pops this time';
  }
  document.getElementById('winPops').textContent = String(sessionPops);
  document.getElementById('winAll').textContent = String(save.pops | 0);
  if (window.__pendingReload) {
    window.__pendingReload = false;
    window.__reloaded = true;
    location.reload();
  }
}

// Patch enterWin to also flip DOM screen
const _enterWin = enterWin;
enterWin = function () {
  _enterWin();
  showWin();
};

function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  if (!ctx) resizeCanvas();

  if (state === 'play') updatePlay(dt);
  else if (state === 'win') updateWin(dt);
  else updateParticles(dt);

  ctx.clearRect(0, 0, W, H);
  if (state === 'play') drawPlay(ctx);
  else if (state === 'win') drawWinScene(ctx);
  else drawMenuBackdrop(ctx);

  requestAnimationFrame(frame);
}

function handlePointer(e) {
  if (state !== 'play') return;
  const now = performance.now();
  if (now - lastPointerHandledAt < 35) return;
  lastPointerHandledAt = now;
  const { x, y } = eventToStage(e);
  onTap(x, y);
  e.preventDefault();
}

function wireUi() {
  document.getElementById('btnPlay')?.addEventListener('click', () => {
    ensureAudio();
    sfxClick();
    showPlay();
  });

  document.getElementById('btnHow')?.addEventListener('click', () => {
    document.getElementById('howPanel')?.classList.toggle('hidden');
    sfxClick();
  });

  document.getElementById('muteBtn')?.addEventListener('click', () => {
    setMuted(!save.muted);
    if (!save.muted) {
      ensureAudio();
      sfxClick();
    }
    updateMenuStats();
  });

  document.getElementById('motionBtn')?.addEventListener('click', () => {
    setReducedMotion(!save.reducedMotion);
    sfxClick();
    updateMenuStats();
  });

  document.querySelectorAll('.mode-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      setMode(btn.dataset.mode);
      sfxClick();
      updateMenuStats();
    });
  });

  document.getElementById('btnMenu')?.addEventListener('click', () => {
    sfxClick();
    showMenu();
  });

  document.getElementById('btnAgain')?.addEventListener('click', () => {
    ensureAudio();
    sfxClick();
    showPlay();
  });

  document.getElementById('btnMenuWin')?.addEventListener('click', () => {
    sfxClick();
    showMenu();
  });

  document.getElementById('btnHub')?.addEventListener('click', () => {
    window.location.href = 'https://jmitchell238.github.io/arcade-hub/';
  });

  cv.addEventListener('pointerdown', handlePointer, { passive: false });
  cv.addEventListener('touchstart', e => {
    if (state === 'play') e.preventDefault();
  }, { passive: false });

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (state === 'play' || state === 'win') showMenu();
    }
  });
}

function setVersionTags() {
  const label = GAME_NAME + ' ' + GAME_VERSION_LABEL;
  document.querySelectorAll('#versionTag, #versionMenu, #versionWin').forEach(el => {
    if (el) el.textContent = label;
  });
}

/** Reload when idle; defer mid-play so a session isn't interrupted. */
function safeReloadForUpdate() {
  if (window.__reloaded) return;
  if (typeof state !== 'undefined' && state === 'play') {
    window.__pendingReload = true;
    return;
  }
  window.__reloaded = true;
  location.reload();
}

function activateWaitingWorker(reg) {
  if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
}

function watchInstallingWorker(reg) {
  const worker = reg.installing;
  if (!worker) return;
  worker.addEventListener('statechange', () => {
    if (worker.state === 'installed' && navigator.serviceWorker.controller) {
      worker.postMessage({ type: 'SKIP_WAITING' });
    }
  });
}

function registerSw() {
  if (!('serviceWorker' in navigator)) return;
  if (!(location.protocol === 'https:' || location.hostname === 'localhost' ||
        location.hostname === '127.0.0.1')) return;

  navigator.serviceWorker.register('./sw.js').then(reg => {
    activateWaitingWorker(reg);
    if (reg.installing) watchInstallingWorker(reg);
    reg.addEventListener('updatefound', () => watchInstallingWorker(reg));

    const checkForUpdate = () => { reg.update().catch(() => {}); };
    checkForUpdate();
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) checkForUpdate();
    });
    window.addEventListener('focus', checkForUpdate);
    setInterval(checkForUpdate, 60 * 1000);

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      safeReloadForUpdate();
    });
  }).catch(err => console.warn('[sw] register failed', err));

  function checkRemoteVersion() {
    if (typeof state !== 'undefined' && state === 'play') return;
    fetch('js/config.js', { cache: 'no-store' })
      .then(r => r.ok ? r.text() : '')
      .then(text => {
        const m = text.match(/GAME_VERSION\s*=\s*['"]([^'"]+)['"]/);
        if (m && m[1] && typeof GAME_VERSION !== 'undefined' && m[1] !== GAME_VERSION) {
          safeReloadForUpdate();
        }
      })
      .catch(() => {});
  }
  checkRemoteVersion();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkRemoteVersion();
  });
  setInterval(checkRemoteVersion, 2 * 60 * 1000);
}


wireUi();
setVersionTags();
resizeCanvas();
showMenu();
requestAnimationFrame(frame);
registerSw();
