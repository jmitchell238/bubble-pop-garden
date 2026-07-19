/**
 * Smoke tests for Bubble Pop Garden.
 * Run: node tests/run.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

let failed = 0;
function ok(cond, msg) {
  if (cond) console.log('  ✓', msg);
  else {
    console.error('  ✗', msg);
    failed++;
  }
}

console.log('Bubble Pop Garden tests\n');

const required = [
  'index.html', 'css/style.css', 'js/config.js', 'js/save.js', 'js/audio.js',
  'js/particles.js', 'js/game.js', 'js/main.js', 'manifest.webmanifest', 'sw.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'apple-touch-icon.png', 'art/cover.jpg',
];
for (const f of required) ok(fs.existsSync(path.join(root, f)), `exists ${f}`);

const config = fs.readFileSync(path.join(root, 'js/config.js'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const verMatch = config.match(/GAME_VERSION\s*=\s*['"]([^'"]+)['"]/);
ok(!!verMatch, 'GAME_VERSION present');
if (verMatch) ok(sw.includes(`bubble-pop-garden-${verMatch[1]}`), `SW CACHE matches ${verMatch[1]}`);

ok(config.includes('BUBBLE_COLORS'), 'BUBBLE_COLORS');
ok(config.includes('MODES'), 'MODES');
ok(config.includes('free') && config.includes('color'), 'free + color modes');

const man = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
ok(man.display === 'standalone', 'manifest standalone');
ok(man.icons?.length >= 2, 'manifest icons');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const order = ['config.js', 'save.js', 'audio.js', 'particles.js', 'game.js', 'main.js'];
let last = -1;
for (const s of order) {
  const i = html.indexOf(s);
  ok(i > last, `script order ${s}`);
  last = i;
}

ok(sw.includes('./js/main.js'), 'sw precache main');
ok(sw.includes('./art/cover.jpg'), 'sw precache cover');

const game = fs.readFileSync(path.join(root, 'js/game.js'), 'utf8');
ok(game.includes('enterWin') || game.includes('win'), 'win path');
ok(game.includes('huntColor') || game.includes('color'), 'color hunt');

console.log(failed ? `\n${failed} failed` : '\nAll passed');
process.exit(failed ? 1 : 0);
