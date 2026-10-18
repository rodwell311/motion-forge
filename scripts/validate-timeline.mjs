// Validate the Remotion DotaChronicle timeline.
// Confirms:
//   - 7 contiguous beats with exact frame ranges summing to 1464
//   - 30 fps, 1464 duration frames (= 48.8s)
//   - public/dota-narration.wav exists (served via staticFile)
//   - DotaChronicle source uses <Audio and staticFile() with the wav
// Run: node scripts/validate-timeline.mjs
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const FPS = 30;
const DURATION_FRAMES = 1464;
const DURATION_SEC = DURATION_FRAMES / FPS; // 48.8

const EXPECTED_BEATS = [
  { id: 'draft',    start: 0,    end: 192  },
  { id: 'lanes',    start: 192,  end: 312  },
  { id: 'vision',   start: 312,  end: 528  },
  { id: 'turn',     start: 528,  end: 696  },
  { id: 'strategy', start: 696,  end: 852  },
  { id: 'readmap',  start: 852,  end: 1080 },
  { id: 'assault',  start: 1080, end: 1464 },
];

async function main() {
  // ---- 1. parse timeline.ts source robustly ----
  const timelineSrc = await readFile(resolve(root, 'src', 'timeline.ts'), 'utf8');

  assert.match(timelineSrc, /export\s+const\s+FPS\s*=\s*30/, 'timeline.ts: FPS = 30');
  assert.match(timelineSrc, /export\s+const\s+DURATION_FRAMES\s*=\s*1464/, 'timeline.ts: DURATION_FRAMES = 1464');

  const beatsArrayMatch = timelineSrc.match(/export\s+const\s+BEATS[^=]*=\s*(\[[\s\S]*?\]);/);
  assert.ok(beatsArrayMatch, 'timeline.ts: BEATS array not found');

  const objs = beatsArrayMatch[1].match(/\{[^}]+\}/g);
  assert.ok(objs && objs.length === 7, `timeline.ts: expected 7 beat objects, got ${objs ? objs.length : 0}`);

  const beats = objs.map((s) => {
    const idM = s.match(/id:\s*['"]([^'"]+)['"]/);
    const startM = s.match(/start:\s*(\d+)/);
    const endM = s.match(/end:\s*(\d+)/);
    assert.ok(idM && startM && endM, `timeline.ts: malformed beat object: ${s}`);
    return { id: idM[1], start: Number(startM[1]), end: Number(endM[1]) };
  });

  // ---- 2. exact match against expected ----
  assert.equal(beats.length, EXPECTED_BEATS.length, 'beat count mismatch');
  for (let i = 0; i < EXPECTED_BEATS.length; i++) {
    assert.equal(beats[i].id,    EXPECTED_BEATS[i].id,    `beat[${i}].id`);
    assert.equal(beats[i].start, EXPECTED_BEATS[i].start, `beat[${i}].start`);
    assert.equal(beats[i].end,   EXPECTED_BEATS[i].end,   `beat[${i}].end`);
  }

  // ---- 3. contiguity: each beat starts where previous ended ----
  assert.equal(beats[0].start, 0, 'first beat must start at 0');
  for (let i = 1; i < beats.length; i++) {
    assert.equal(beats[i].start, beats[i - 1].end,
      `contiguity broken: beat[${i}].start (${beats[i].start}) != beat[${i - 1}].end (${beats[i - 1].end})`);
  }
  assert.equal(beats[beats.length - 1].end, DURATION_FRAMES,
    `last beat end must equal DURATION_FRAMES (${DURATION_FRAMES})`);

  // ---- 4. duration math ----
  const sumDurations = beats.reduce((acc, b) => acc + (b.end - b.start), 0);
  assert.equal(sumDurations, DURATION_FRAMES, `sum of beat durations must equal ${DURATION_FRAMES}`);
  assert.equal(DURATION_SEC, 48.8, '48.8s expected');
  assert.equal(Math.round(FPS * 48.8), DURATION_FRAMES, 'frames = fps * seconds');

  // ---- 5. narration audio exists in public/ ----
  await access(resolve(root, 'public', 'dota-narration.wav'));

  // ---- 6. every matte environment is local and committed ----
  const matteFiles = ['draft.png', 'lanes.png', 'vision.png', 'turn.png', 'strategy.png', 'readmap.png', 'assault.png'];
  for (const file of matteFiles) {
    await access(resolve(root, 'public', 'assets', 'mattes', file));
  }

  // ---- 7. composition uses <Audio + staticFile with the wav ----
  const compSrc = await readFile(resolve(root, 'src', 'DotaChronicle.tsx'), 'utf8');
  assert.match(compSrc, /import\s+\{[^}]*\bAudio\b[^}]*\}\s+from\s+['"]remotion['"]/, 'DotaChronicle: Audio must be imported from remotion');
  assert.match(compSrc, /import\s+\{[^}]*\bstaticFile\b[^}]*\}\s+from\s+['"]remotion['"]/, 'DotaChronicle: staticFile must be imported from remotion');
  assert.match(compSrc, /<Audio\b/, 'DotaChronicle: must contain <Audio element');
  assert.match(compSrc, /staticFile\(\s*['"]dota-narration\.wav['"]\s*\)/, 'DotaChronicle: must call staticFile("dota-narration.wav")');

  // ---- 7. composition root registers Sequences for each beat ----
  for (const b of EXPECTED_BEATS) {
    assert.ok(compSrc.includes(`'${b.id}'`) || compSrc.includes(`"${b.id}"`),
      `DotaChronicle: must reference beat id "${b.id}"`);
  }

  // ---- 8. final caption frame constant present ----
  assert.match(compSrc, /FINAL_CAPTION_FRAME/, 'DotaChronicle: must reference FINAL_CAPTION_FRAME');
  const capMatch = timelineSrc.match(/FINAL_CAPTION_FRAME\s*=\s*(\d+)/);
  assert.ok(capMatch, 'timeline.ts: FINAL_CAPTION_FRAME constant not found');
  assert.equal(Number(capMatch[1]), 1230, 'FINAL_CAPTION_FRAME must be 1230');

  console.log(
    `validate-timeline: OK - ${beats.length} beats, ${DURATION_FRAMES} frames @ ${FPS}fps ` +
    `(${DURATION_SEC}s), audio public/dota-narration.wav, <Audio src={staticFile("dota-narration.wav")} /> confirmed.`
  );
}

main().catch((err) => {
  console.error('validate-timeline: FAIL -', err.message);
  process.exit(1);
});
