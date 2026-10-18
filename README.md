# Motion Forge: Dota Chronicle

Cloud render 1920x1080, 30 FPS, 48.8 detik, dibangun dengan Remotion 4 dan React 18. Narasi masuk langsung ke composition melalui Remotion `<Audio>`, tanpa mux audio manual.

## Visual direction

Setiap beat memakai original matte painting lokal sebagai dunia utuh. Bukan screenshot gameplay, logo, footage, karakter, atau asset Dota 2 resmi. Semua source tersimpan di `public/assets/mattes/` agar render GitHub deterministik dan tidak meminta asset jaringan.

Remotion memberi motion pada image environment memakai camera drift, push-in, fog bank, light sweep, route trace, ember particles, dan caption terbatas. Tidak memakai emoji, icon UI, atau sprite cutout sebagai focal object.

## Timeline

| Beat | Frames | Durasi | Aksi |
|---|---:|---:|---|
| Draft | 0-192 | 0.0-6.4 s | Meja perang dan pilihan rute |
| Lanes | 192-312 | 6.4-10.4 s | Jalur menuju benteng kristal |
| Vision | 312-528 | 10.4-17.6 s | Ward, kabut, dan jalur pandang |
| Turn | 528-696 | 17.6-23.2 s | Clash di titik balik |
| Strategy | 696-852 | 23.2-28.4 s | Rute fisik pada meja strategi |
| Read Map | 852-1080 | 28.4-36.0 s | Scan lanskap dan rute risiko |
| Assault | 1080-1464 | 36.0-48.8 s | Siege benteng dan final line |

## Audio

Audio sumber ada di `public/dota-narration.wav`.

```tsx
<Audio src={staticFile("dota-narration.wav")} />
```

Remotion merender audio tersebut langsung menjadi stream AAC dalam MP4 final.

## Files

```text
public/
  dota-narration.wav
  assets/mattes/
    draft.png
    lanes.png
    vision.png
    turn.png
    strategy.png
    readmap.png
    assault.png
src/
  DotaChronicle.tsx
  Root.tsx
  index.tsx
  timeline.ts
scripts/
  validate-timeline.mjs
```

## Checks

```bash
npm ci
node scripts/validate-timeline.mjs
npx tsc --noEmit
npx remotion browser ensure
npx remotion render src/index.tsx DotaChronicle output/dota-chronicle-remotion.mp4 --codec=h264 --crf=18 --audio-codec=aac
```

`validate-timeline.mjs` memeriksa 7 beat kontigu, 1464 frame, 30 FPS, audio public, dan pemakaian `<Audio src={staticFile("dota-narration.wav")} />`.

## GitHub Actions

Workflow `Render` hanya berjalan manual.

1. Buka tab Actions di repository.
2. Pilih `Render`.
3. Klik `Run workflow`.
4. Download artifact `dota-chronicle-remotion` saat job sukses.

Artifact disimpan 7 hari. Release GitHub dipakai untuk delivery jangka panjang.
