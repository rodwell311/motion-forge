# Motion Forge — Dota Chronicle (Remotion)

Cloud-render sandbox that produces a deterministic **1920×1080 / 30fps / 48.8s** art-directed motion graphic via **Remotion 4** (React 18), rendered inside GitHub Actions. No Playwright, no FFmpeg muxing — the narration audio is wired directly through a Remotion `<Audio src={staticFile("dota-narration.wav")} />` element.

All visuals are original SVG / CSS / React shapes — no game screenshots, no logos, no footage, no copyrighted hero likenesses. Geometric hero tokens, a crystal citadel, parchment tactical maps, ward cones, and ember sparks only.

## The composition

`DotaChronicle` — 1464 frames at 30fps (48.8s). Seven visually distinct beats tied to exact frame ranges, sequenced with Remotion `<Sequence>` and animated with `useCurrentFrame`, `useVideoConfig`, `interpolate`, and `spring`.

| Beat        | Frames       | Seconds    | Visual                                                                                       | Caption                       |
|-------------|--------------|------------|----------------------------------------------------------------------------------------------|-------------------------------|
| `draft`     | 0–192        | 0 – 6.4    | Parchment tactical map; five geometric hero tokens choose bezier routes                      | `SETIAP PILIHAN`              |
| `lanes`     | 192–312      | 6.4 – 10.4 | Three organic lane paths converge toward a crystal citadel                                   | `LIMA HERO / SATU ANCIENT`    |
| `vision`    | 312–528      | 10.4 – 17.6| Ward totem rises, projects a readable green vision cone + radius, teal smoke rolls through   | small labels only             |
| `turn`      | 528–696      | 17.6 – 23.2| Camera pushes through clash of ember/ward formations; strategic paths bend forward           | —                             |
| `strategy`  | 696–852      | 23.2 – 28.4| Split-screen: left frantic mechanical clicks, right map plan resolves                        | —                             |
| `readmap`   | 852–1080     | 28.4 – 36.0| Large tactical overview; scanner sweep, risk markers, deliberate camera pan                  | small `SCAN` label            |
| `assault`   | 1080–1464    | 36.0 – 48.8| Citadel cracks, five routes converge, orange sparks; final caption holds                     | `NO VICTORY IS FREE.` @ 1230  |

Motion layers vary in pace: route drawing via `strokeDashoffset`, token movement along cubic beziers, parallax camera via transform scale/translate, light sweeps, restrained deterministic particles (seeded `mulberry32`), and an understated SVG-turbulence grain overlay applied once at the composition root. Captions sit off focal vectors; the final phrase appears only at frame **1230** and holds cleanly.

## Audio

`assets/dota-narration.wav` (48.8s narration, 24 kHz mono PCM) is copied to `public/dota-narration.wav` so Remotion can serve it through `staticFile()`. The composition root mounts:

```tsx
<Audio src={staticFile("dota-narration.wav")} />
```

No FFmpeg audio muxing, no `ffmpeg -i audio.wav` step. The source asset in `assets/` is left in place for reference.

## File layout

```
motion-forge/
├── .github/workflows/render.yml    # Manual GitHub Actions workflow
├── assets/dota-narration.wav       # Source narration (kept for reference)
├── public/dota-narration.wav       # Remotion-served copy for staticFile()
├── remotion.config.ts              # Codec / CRF / pixel format config
├── tsconfig.json
├── package.json                    # Remotion 4 + React 18 deps
├── package-lock.json               # Lockfile for npm ci
├── src/
│   ├── index.tsx                   # registerRoot(Root)
│   ├── Root.tsx                    # <Composition id="DotaChronicle" />
│   ├── timeline.ts                 # FPS, dimensions, BEATS[], FINAL_CAPTION_FRAME
│   └── DotaChronicle.tsx           # Composition: 7 scene Sequences + Audio + grain
├── scripts/validate-timeline.mjs   # Node assert-based timeline + audio + source checks
└── README.md
```

## How to trigger a render

1. Go to the repository **Actions** tab.
2. Select the **Render** workflow.
3. Click **Run workflow** (manual trigger only, no inputs).
4. Wait for the job to finish (Remotion renders 1464 frames on a hosted `ubuntu-latest` runner).

The workflow:
1. `node scripts/validate-timeline.mjs`
2. `npm ci`
3. `npx tsc --noEmit`
4. `npx remotion browser ensure`
5. `npx remotion render src/index.tsx DotaChronicle output/dota-chronicle-remotion.mp4 --codec=h264 --crf=18 --audio-codec=aac`
6. Uploads `output/dota-chronicle-remotion.mp4` as an artifact retained **7 days**.

## Download the artifact

1. Open the completed workflow run.
2. Scroll to **Artifacts**.
3. Download `dota-chronicle-remotion`.
4. Unzip — `dota-chronicle-remotion.mp4` is inside.

## Validation script

`scripts/validate-timeline.mjs` uses Node `assert` (no test framework) and confirms:

- `src/timeline.ts` exports `FPS = 30` and `DURATION_FRAMES = 1464`.
- `BEATS` has 7 entries with exact ids/starts/ends matching the spec.
- Beats are contiguous (each starts where the previous ended), starting at 0, ending at 1464.
- Sum of beat durations equals 1464.
- `public/dota-narration.wav` exists.
- `src/DotaChronicle.tsx` imports `Audio` and `staticFile` from `remotion`, contains a `<Audio` element, and calls `staticFile("dota-narration.wav")`.
- All 7 beat ids are referenced in the composition source.
- `FINAL_CAPTION_FRAME = 1230`.

## Local rendering (optional)

Requires Node ≥ 20:

```bash
npm ci
node scripts/validate-timeline.mjs
npx tsc --noEmit
npx remotion browser ensure
npx remotion render src/index.tsx DotaChronicle output/dota-chronicle-remotion.mp4 --codec=h264 --crf=18 --audio-codec=aac
```

Or open the live preview:

```bash
npm run dev
```

## Customization

### Change the animation
Edit `src/DotaChronicle.tsx`. Each beat is a self-contained scene component receiving beat-local frames from `useCurrentFrame()` inside a `<Sequence>`.

### Change duration, resolution, framerate, or beat boundaries
Edit constants in `src/timeline.ts`:

```ts
export const FPS = 30;
export const DURATION_FRAMES = 1464;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const BEATS = [ ... ];
export const FINAL_CAPTION_FRAME = 1230;
```

If you change beat boundaries, also update `EXPECTED_BEATS` in `scripts/validate-timeline.mjs` so the timeline test stays meaningful.
