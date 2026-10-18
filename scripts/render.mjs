import { chromium } from 'playwright';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, rm } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const FPS = 30;
const DURATION_SEC = 6;
const WIDTH = 1920;
const HEIGHT = 1080;
const TOTAL_FRAMES = FPS * DURATION_SEC;

function parseTitle(argv) {
  const i = argv.indexOf('--title');
  if (i !== -1 && i + 1 < argv.length) return argv[i + 1];
  const env = process.env.RENDER_TITLE;
  return env && env.trim() ? env.trim() : null;
}

async function main() {
  const title = parseTitle(process.argv.slice(2));
  const htmlPath = resolve(root, 'src', 'index.html');
  const framesDir = resolve(root, 'frames');
  const outputDir = resolve(root, 'output');
  const outputFile = join(outputDir, 'motion-forge.mp4');

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

  await page.addInitScript((data) => {
    window.__PLAYWRIGHT__ = true;
    if (data.title) window.__TITLE__ = data.title;
  }, { title });

  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => typeof window.__renderFrame === 'function');

  console.log(`Rendering ${TOTAL_FRAMES} frames (${DURATION_SEC}s @ ${FPS}fps)...`);
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const ms = (i / FPS) * 1000;
    await page.evaluate((t) => window.__renderFrame(t), ms);
    const num = String(i).padStart(5, '0');
    await page.screenshot({
      path: join(framesDir, `frame_${num}.png`),
      type: 'png',
    });
    if ((i + 1) % 30 === 0) {
      console.log(`  frame ${i + 1}/${TOTAL_FRAMES}`);
    }
  }

  await browser.close();
  console.log('Frames captured. Encoding MP4...');

  await exec('ffmpeg', [
    '-y',
    '-framerate', String(FPS),
    '-i', join(framesDir, 'frame_%05d.png'),
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-r', String(FPS),
    outputFile,
  ]);

  await rm(framesDir, { recursive: true, force: true });
  console.log(`Done: ${outputFile}`);
}

main().catch((err) => {
  console.error('Render failed:', err);
  process.exit(1);
});
