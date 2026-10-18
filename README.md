# Motion Forge

Cloud-render sandbox that turns a pure HTML/CSS/JS motion graphic into a deterministic **1920×1080 MP4** using Playwright (Chromium screenshots) and ffmpeg — entirely inside GitHub Actions.

No local dependencies. No Docker. No network assets in the animation.

## How to trigger a render

1. Go to the repository **Actions** tab.
2. Select the **Render** workflow.
3. Click **Run workflow**.
4. Optionally enter a **title** — it replaces the default `MOTION FORGE` text in the video.
5. Wait for the job to finish (~2–4 minutes).

## Download the artifact

1. Open the completed workflow run.
2. Scroll to the **Artifacts** section at the bottom.
3. Download `motion-forge-output`.
4. Unzip it — `motion-forge.mp4` is inside.

Artifacts are retained for **7 days**.

## File layout

```
motion-forge/
├── .github/workflows/render.yml   # Manual GitHub Actions workflow
├── src/index.html                 # Self-contained motion graphic (no network assets)
├── scripts/render.mjs             # Playwright → PNG frames → ffmpeg → MP4
├── package.json                   # Playwright dependency
├── package-lock.json              # Lockfile for npm ci
├── README.md                      # This file
└── .gitignore                     # Excludes node_modules/, output/, frames/
```

## Render pipeline

1. `node --check scripts/render.mjs` — validates syntax before anything else.
2. `npm ci` — installs Playwright from the lockfile.
3. `npx playwright install --with-deps chromium` — installs the headless browser.
4. `node scripts/render.mjs` — captures **180 PNG frames** (30 fps × 6 s) by calling `window.__renderFrame(ms)` on the page, then encodes with ffmpeg:
   ```
   ffmpeg -framerate 30 -i frame_%05d.png -c:v libx264 -pix_fmt yuv420p -movflags +faststart output/motion-forge.mp4
   ```
5. `actions/upload-artifact@v4` uploads `output/` with 7-day retention.

## Local rendering (optional)

Requires Node ≥ 20, Playwright Chromium, and ffmpeg:

```bash
npm ci
npx playwright install --with-deps chromium
node scripts/render.mjs
# or with a custom title:
node scripts/render.mjs --title "Hello World"
```

## Customization

### Change the animation

Edit `src/index.html`. The page exposes `window.__renderFrame(ms)` which receives a timestamp in milliseconds (0–6000). Update the drawing logic inside that function. Everything is canvas + DOM — no external libraries.

### Change duration, resolution, or framerate

Edit the constants at the top of `scripts/render.mjs`:

```js
const FPS = 30;
const DURATION_SEC = 6;
const WIDTH = 1920;
const HEIGHT = 1080;
```

### Change the title

- **In GitHub Actions**: type it into the workflow input field.
- **Locally**: pass `--title "Your Title"` or set `RENDER_TITLE` env var.

The title is injected via Playwright's `addInitScript` — never through shell interpolation.
