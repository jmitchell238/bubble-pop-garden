'use strict';

// Bubble Pop Garden — tuning knobs
// Keep CACHE in sw.js in sync: 'bubble-pop-garden-' + GAME_VERSION
const GAME_VERSION = '1.0.000';
const GAME_VERSION_LABEL = 'v' + GAME_VERSION;
const GAME_NAME = 'Bubble Pop Garden';

const W = 390;
const H = 700;
const SAVE_KEY = 'bubble-pop-garden-save-v1';

/** Distinct crayon colors kids can name */
const BUBBLE_COLORS = [
  { id: 'red',    label: 'Red',    fill: '#FF5252', glow: '#FF8A80', rim: '#C62828', note: 262 },
  { id: 'blue',   label: 'Blue',   fill: '#42A5F5', glow: '#90CAF9', rim: '#1565C0', note: 294 },
  { id: 'green',  label: 'Green',  fill: '#66BB6A', glow: '#A5D6A7', rim: '#2E7D32', note: 330 },
  { id: 'yellow', label: 'Yellow', fill: '#FFEE58', glow: '#FFF59D', rim: '#F9A825', note: 349 },
  { id: 'purple', label: 'Purple', fill: '#AB47BC', glow: '#CE93D8', rim: '#6A1B9A', note: 392 },
  { id: 'pink',   label: 'Pink',   fill: '#F48FB1', glow: '#F8BBD0', rim: '#C2185B', note: 440 },
];

const MODES = {
  free: {
    id: 'free',
    name: 'Free Play',
    tagline: 'Pop any bubble',
    goal: null,
  },
  pop10: {
    id: 'pop10',
    name: 'Pop 10',
    tagline: 'Pop ten bubbles',
    goal: { type: 'count', target: 10 },
  },
  pop20: {
    id: 'pop20',
    name: 'Pop 20',
    tagline: 'A little longer',
    goal: { type: 'count', target: 20 },
  },
  color: {
    id: 'color',
    name: 'Color Hunt',
    tagline: 'Only the asked color',
    goal: { type: 'color', target: 8 },
  },
};

const MODE_ORDER = ['free', 'pop10', 'pop20', 'color'];

// Spawn / physics
const SPAWN_EVERY = 0.85;       // seconds between spawns
const MAX_BUBBLES = 12;
const RISE_MIN = 28;
const RISE_MAX = 70;
const RADIUS_MIN = 28;
const RADIUS_MAX = 48;
const WOBBLE = 22;

const PRAISE = ['Pop!', 'Yay!', 'Nice!', 'Wow!', 'Again!', 'Sparkle!', 'Yes!', 'Fun!'];
