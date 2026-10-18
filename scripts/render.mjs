import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, rm, readFile, access } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const exec = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const FPS = 30;
const DURATION_SEC = 48.8;
const WIDTH = 1920;
const HEIGHT = 1080;
const TOTAL_FRAMES = Math.round(FPS * DURATION_SEC);
const JPEG_QUALITY = 94;
const OUTPUT_NAME = 'dota-chronicle.mp4';
const AUDIO_REL = 'assets/dota-narration.wav';

const EXPECTED_SCENES = [
  { start: 0,    end: 6.4,  id: 'choice' },
  { start: 6.4,  end: 10.4, id: 'approach' },
  { start: 10.4, end: 17.6, id: 'ward' },
  { start: 17.6, end: 23.2, id: 'teamfight' },
  { start: 23.2, end: 28.4, id: 'mechanics' },
  { start: 28.4, end: 36.0, id: 'readmap' },
  { start: 36.0, end: 48.8, id: 'assault' },
];

function parseArgs(argv) {
  const out = { validate: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--validate-timeline') out.validate = true;
  }
  return out;
}

// Tiny reproducible scene-time test (Node assert, no framework).
// Verifies src/index.html scene boundaries match the spec, the audio asset
// exists, and render constants are correct. Run: node scripts/render.mjs --validate-timeline
async function validateTimeline() {
  const html = await readFile(resolve(root, 'src', 'index.html'), 'utf8');
  const m = html.match(/window\.__SCENES__\s*=\s*(\[[\s\S]*?\]);/);
  assert.ok(m, 'window.__SCENES__ not found in src/index.html');
  const parsed = JSON.parse(m[1]);

  assert.equal(parsed.length, EXPECTED_SCENES.length, 'scene count mismatch');
  for (let i = 0; i < EXPECTED_SCENES.length; i++) {
    assert.equal(parsed[i].start, EXPECTED_SCENES[i].start, `scene[${i}].start`);
    assert.equal(parsed[i].end,   EXPECTED_SCENES[i].end,   `scene[${i}].end`);
    assert.equal(parsed[i].id,    EXPECTED_SCENES[i].id,    `scene[${i}].id`);
  }
  // continuity: each scene starts where the previous ended
  for (let i = 1; i < parsed.length; i++) {
    assert.equal(parsed[i].start, parsed[i - 1].end,
      `scene[${i}].start must equal scene[${i - 1}].end (no gaps)`);
  }
  // last scene must end at DURATION_SEC
  assert.equal(parsed[parsed.length - 1].end, DURATION_SEC,
    'last scene end must equal DURATION_SEC');

  assert.equal(DURATION_SEC, 48.8, 'DURATION_SEC must be 48.8');
  assert.ok(FPS >= 24, 'FPS must be >= 24');
  assert.equal(OUTPUT_NAME, 'dota-chronicle.mp4', 'OUTPUT_NAME');
  assert.ok(JPEG_QUALITY >= 92, 'JPEG_QUALITY must be >= 92');
  assert.equal(WIDTH, 1920, 'WIDTH');
  assert.equal(HEIGHT, 1080, 'HEIGHT');
  assert.equal(TOTAL_FRAMES, Math.round(FPS * DURATION_SEC), 'TOTAL_FRAMES');

  // audio asset must be present in the repo
  await access(resolve(root, AUDIO_REL));

  console.log(
    `validate-timeline: OK — ${parsed.length} scenes, ${DURATION_SEC}s @ ${FPS}fps, ` +
    `${TOTAL_FRAMES} frames, JPEG q${JPEG_QUALITY}, output ${OUTPUT_NAME}, audio ${AUDIO_REL}`
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.validate) return validateTimeline();

  // Lazy import so --validate-timeline runs without playwright installed.
  const { chromium } = await import('playwright');

  const htmlPath   = resolve(root, 'src', 'index.html');
  const audioPath  = resolve(root, AUDIO_REL);
  const framesDir  = resolve(root, 'frames');
  const outputDir  = resolve(root, 'output');
  const outputFile = join(outputDir, OUTPUT_NAME);

  await rm(framesDir, { recursive: true, force: true });
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(framesDir, { recursive: true });
  await mkdir(outputDir, { recursive: true });

  console.log(`Launching Chromium (${WIDTH}x${HEIGHT})...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  await page.addInitScript(() => {
    window.__PLAYWRIGHT__ = true;
  });

  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => typeof window.__renderFrame === 'function');

  console.log(
    `Rendering ${TOTAL_FRAMES} frames (${DURATION_SEC}s @ ${FPS}fps, JPEG q${JPEG_QUALITY})...`
  );
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const ms = (i / FPS) * 1000;
    await page.evaluate((t) => window.__renderFrame(t), ms);
    const num = String(i).padStart(5, '0');
    await page.screenshot({
      path: join(framesDir, `frame_${num}.jpg`),
      type: 'jpeg',
      quality: JPEG_QUALITY,
    });
    if ((i + 1) % 60 === 0 || i === TOTAL_FRAMES - 1) {
      console.log(`  frame ${i + 1}/${TOTAL_FRAMES} (${(ms / 1000).toFixed(2)}s)`);
    }
  }

  await browser.close();
  console.log('Frames captured. Encoding MP4 (H.264 yuv420p + audio, -shortest)...');

  // Array-based ffmpeg args — no shell interpolation anywhere.
  const ffmpegArgs = [
    '-y',
    '-framerate', String(FPS),
    '-i',         join(framesDir, 'frame_%05d.jpg'),
    '-i',         audioPath,
    '-c:v',       'libx264',
    '-preset',    'fast',
    '-crf',       '18',
    '-pix_fmt',   'yuv420p',
    '-movflags',  '+faststart',
    '-r',         String(FPS),
    '-c:a',       'aac',
    '-b:a',       '192k',
    '-shortest',
    outputFile,
  ];
  await exec('ffmpeg', ffmpegArgs);

  await rm(framesDir, { recursive: true, force: true });
  console.log(`Done: ${outputFile}`);
}

main().catch((err) => {
  console.error('Render failed:', err);
  process.exit(1);
});
