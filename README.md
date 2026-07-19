# Bubble Pop Garden

Pop colorful garden bubbles — sparkles, musical notes, zero fail. Built for ages **4–6**.

**Play:** https://jmitchell238.github.io/bubble-pop-garden/

Part of [Arcade Hub](https://jmitchell238.github.io/arcade-hub/).

---

## Modes

| Mode | Who | What |
|------|-----|------|
| **Free Play** | 4+ | Pop anything, no goals |
| **Pop 10 / 20** | 4–6 | Gentle count missions |
| **Color Hunt** | ~6 | Pop only the asked color (wrong colors still pop, just don’t count) |

## Features

- Slow floating bubbles, big touch targets
- Musical note per color + confetti bursts
- Sound mute + reduced motion
- Installable PWA (offline after first visit)
- Progress in `localStorage`

## Stack

Static HTML / CSS / Canvas. No build step.

## Versioning

- `GAME_VERSION` in `js/config.js`
- Keep `CACHE` in `sw.js` in sync: `'bubble-pop-garden-' + GAME_VERSION`

## Local preview

```bash
python3 -m http.server 8080
```

## Parents

- No lives, ads, accounts, or fail screens
- Color Hunt never punishes — soft “try Red!” only
- **Calm motion** slows spawn/rise for sensitive kids

## License

Personal project for family Arcade Hub.
