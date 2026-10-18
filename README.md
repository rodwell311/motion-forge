# Motion Forge — Dota Chronicle

Cloud-render sandbox that turns a pure HTML/Canvas motion graphic into a deterministic **1920×1080 MP4** with synchronized narration audio — using Playwright (Chromium screenshots) and ffmpeg, entirely inside GitHub Actions.

No local dependencies required to inspect. No Docker. No network assets in the animation. All visuals are original Canvas/DOM drawing — no game screenshots, no logos, no copyrighted characters, no exact gameplay UI replicas.

## The video

A 48.8-second dark-fantasy esports motion piece built around an Indonesian narration. Art direction: ink/ember atmosphere, charcoal/obsidian field with ember-orange, ward-green and smoke-teal accents, film grain, variable pacing, asymmetrical compositions, and scene transitions driven by light/shadow and camera movement.

- **Source audio:** `assets/dota-narration.wav` (48.8s, 24 kHz mono PCM) — baked into the final MP4.
- **Output:** `output/dota-chronicle.mp4` (H.264 yuv420p, 1920×1080, 30 fps, AAC audio, `-shortest`).
- **Deterministic:** stable seeded pseudo-randomness (mulberry32). `Math.random` is never called inside `renderFrame` — every frame is reproducible.

### Timeline

| Time (s)    | Scene        | Indonesian beat                                  | Key line shown                     |
|-------------|--------------|--------------------------------------------------|------------------------------------|
| 0 – 6.4     | `choice`     | Choice becomes war; a strategic map slowly forms | `DOTA 2`                           |
| 6.4 – 10.4  | `approach`   | Five hero markers approach one Ancient           | `LIMA HERO.` / `SATU ANCIENT.`     |
| 10.4 – 17.6 | `ward`       | Ward vision and smoke gank                       | `VISION` → `SMOKE`                 |
| 17.6 – 23.2 | `teamfight`  | Team fight reverses a losing match               | `TEAM FIGHT`                       |
| 23.2 – 28.4 | `mechanics`  | Mechanics matter but strategy wins war           | —                                  |
| 28.4 – 36.0 | `readmap`    | Read the map faster, take risks                  | `BACA PETA`                        |
| 36.0 – 48.8 | `assault`    | Final Ancient assault                            | `NO VICTORY IS` / `FREE.`          |

Hero markers are simple ember diamonds, the Ancient is a crystalline spire — original geometry, not character likenesses. Typography is used sparingly with deliberate line breaks; the final `NO VICTORY IS FREE.` holds long over a fading ember storm.

## How to trigger a render

1. Go to the repository **Actions** tab.
2. Select the **Render** workflow.
3. Click **Run workflow** (no inputs required).
4. Wait for the job to finish (~10–20 minutes for the full 48.8s / 1464 frames).

## Download the artifact

1. Open the completed workflow run.
2. Scroll to the **Artifacts** section.
3. Download `dota-chronicle`.
4. Unzip it — `dota-chronicle.mp4` is inside.

Artifacts are retained for **7 days**.

## File layout

```
motion-forge/
├── .github/workflows/render.yml   # Manual GitHub Actions workflow (no inputs)
├── assets/dota-narration.wav      # Source narration audio (48.8s) baked into MP4
├── src/index.html                 # Self-contained Canvas motion graphic (48.8s timeline)
├── scripts/render.mjs             # Playwright → JPEG frames → ffmpeg → MP4 (with audio)
├── package.json                   # Playwright dependency
├── package-lock.json              # Lockfile for npm ci
├── README.md                      # This file
└── .gitignore                     # Excludes node_modules/, output/, frames/
```

## Render pipeline

1. `node --check scripts/render.mjs` — validates syntax.
2. `node scripts/render.mjs --validate-timeline` — reproducible scene-time test (Node `assert`, no framework). Verifies the 7 scene boundaries in `src/index.html` match the spec, scenes are contiguous, the last scene ends at 48.8s, the audio asset exists, and render constants (`FPS ≥ 24`, `DURATION_SEC = 48.8`, `JPEG_QUALITY ≥ 92`, output name) are correct.
3. `npm ci` — installs Playwright from the lockfile.
4. `npx playwright install --with-deps chromium` — installs the headless browser.
5. `node scripts/render.mjs` — captures **1464 JPEG frames** (30 fps × 48.8 s, quality 94) by calling `window.__renderFrame(ms)` on the page, then encodes with ffmpeg:
   ```
   ffmpeg -y -framerate 30 -i frame_%05d.jpg -i assets/dota-narration.wav \
          -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p -movflags +faststart -r 30 \
          -c:a aac -b:a 192k -shortest output/dota-chronicle.mp4
   ```
   All ffmpeg arguments are passed as a safe array to `execFile` — no shell interpolation.
6. `actions/upload-artifact@v4` uploads only the final `output/dota-chronicle.mp4`.

## Local rendering (optional)

Requires Node ≥ 20, Playwright Chromium, and ffmpeg:

```bash
npm ci
npx playwright install --with-deps chromium
# validate the timeline first (no deps required):
node scripts/render.mjs --validate-timeline
# full render:
node scripts/render.mjs
```

## Customization

### Change the animation
Edit `src/index.html`. The page exposes `window.__renderFrame(ms)` which receives a timestamp in milliseconds (0–48800). The `window.__SCENES__` array at the top drives scene dispatch and is also what `--validate-timeline` checks — keep it in sync with the spec.

### Change duration, resolution, or framerate
Edit the constants at the top of `scripts/render.mjs`:

```js
const FPS = 30;
const DURATION_SEC = 48.8;
const WIDTH = 1920;
const HEIGHT = 1080;
const JPEG_QUALITY = 94;
const OUTPUT_NAME = 'dota-chronicle.mp4';
const AUDIO_REL = 'assets/dota-narration.wav';
```

If you change `DURATION_SEC` or scene boundaries, also update `EXPECTED_SCENES` in `scripts/render.mjs` and `window.__SCENES__` in `src/index.html` so the timeline test stays meaningful.
