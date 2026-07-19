'use strict';

const defaultSave = () => ({
  muted: false,
  reducedMotion: false,
  pops: 0,
  missionsDone: 0,
  mode: 'free',
  bestStreak: 0,
});

let save = defaultSave();

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      save = defaultSave();
      return save;
    }
    save = Object.assign(defaultSave(), JSON.parse(raw));
    if (!MODE_ORDER.includes(save.mode)) save.mode = 'free';
    if (typeof save.pops !== 'number' || save.pops < 0) save.pops = 0;
    if (typeof save.missionsDone !== 'number') save.missionsDone = 0;
  } catch {
    save = defaultSave();
  }
  return save;
}

function persistSave() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch { /* private mode */ }
}

function recordPop() {
  save.pops = (save.pops | 0) + 1;
  persistSave();
}

function recordMission() {
  save.missionsDone = (save.missionsDone | 0) + 1;
  persistSave();
}

function setMuted(v) {
  save.muted = !!v;
  persistSave();
}

function setReducedMotion(v) {
  save.reducedMotion = !!v;
  persistSave();
}

function setMode(id) {
  if (MODE_ORDER.includes(id)) {
    save.mode = id;
    persistSave();
  }
}

function noteBestStreak(n) {
  if (n > (save.bestStreak | 0)) {
    save.bestStreak = n;
    persistSave();
  }
}

loadSave();
