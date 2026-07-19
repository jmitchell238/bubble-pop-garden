'use strict';

let audioCtx = null;

function ensureAudio() {
  if (save.muted) return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function tone({ freq = 440, dur = 0.12, type = 'sine', gain = 0.05, slide = 0, delay = 0 } = {}) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.linearRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function sfxClick() {
  tone({ freq: 520, dur: 0.05, type: 'square', gain: 0.02 });
}

function sfxPop(noteHz) {
  const f = noteHz || 400;
  tone({ freq: f * 1.5, dur: 0.06, type: 'sine', gain: 0.04, slide: 80 });
  tone({ freq: f, dur: 0.1, type: 'triangle', gain: 0.035, slide: -40, delay: 0.02 });
  // soft noise sparkle
  const ctx = ensureAudio();
  if (!ctx) return;
  const n = Math.floor(ctx.sampleRate * 0.05);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1200;
  g.gain.value = 0.02;
  src.connect(filter);
  filter.connect(g);
  g.connect(ctx.destination);
  src.start();
  src.stop(ctx.currentTime + 0.05);
}

function sfxSoftMiss() {
  tone({ freq: 220, dur: 0.08, type: 'sine', gain: 0.02, slide: -30 });
}

function sfxCelebrate() {
  tone({ freq: 523, dur: 0.1, type: 'sine', gain: 0.04 });
  tone({ freq: 659, dur: 0.1, type: 'sine', gain: 0.04, delay: 0.09 });
  tone({ freq: 784, dur: 0.14, type: 'sine', gain: 0.045, delay: 0.18 });
  tone({ freq: 1046, dur: 0.18, type: 'triangle', gain: 0.035, delay: 0.28 });
}
