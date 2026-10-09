# Bubble Pop Garden

Pop colorful bubbles in a garden. Each pop gives sparkles and a musical note, and there's no way to fail. Made for ages 4–6.

Play at https://jmitchell238.github.io/bubble-pop-garden/. It's one of the games in [Arcade Hub](https://jmitchell238.github.io/arcade-hub/).

## Modes

| Mode | Ages | Goal |
|------|------|------|
| Free Play | 4+ | None, just pop |
| Pop 10 / Pop 20 | 4–6 | Pop a set number of bubbles |
| Color Hunt | ~6 | Pop only the color asked for. Other colors still pop, they just don't count. |

## Features

- Slow bubbles with big tap targets
- A different musical note for each color, and confetti
- Mute and Calm motion settings
- Progress saved in localStorage
- Installable PWA that works offline after the first visit

## For parents

- No lives, ads, accounts or fail screens.
- Color Hunt never penalizes a wrong pop. It just gently repeats the color ("Try Red!").
- Calm motion makes bubbles appear and rise more slowly.

## Running locally

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080. The service worker needs `localhost` or HTTPS.

Plain HTML, CSS and canvas with no build step.

## Tests

```bash
node tests/run.mjs
```

## Versioning

When you bump `GAME_VERSION` in `js/config.js`, set `CACHE` in `sw.js` to `'bubble-pop-garden-' + GAME_VERSION`.

## License

Personal project for the family.
