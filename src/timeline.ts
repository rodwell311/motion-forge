export const FPS = 30;
export const DURATION_FRAMES = 1464; // 48.8s @ 30fps
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const NARRATION_FILE = 'dota-narration.wav';

export interface Beat {
  id: string;
  label: string;
  start: number;
  end: number;
  durationInFrames: number;
}

// 7 contiguous beats spanning the full 1464-frame timeline.
// Sum of durations: 192 + 120 + 216 + 168 + 156 + 228 + 384 = 1464.
export const BEATS: Beat[] = [
  { id: 'draft',    label: 'Draft',     start: 0,    end: 192,  durationInFrames: 192  },
  { id: 'lanes',    label: 'Lanes',     start: 192,  end: 312,  durationInFrames: 120  },
  { id: 'vision',   label: 'Vision',    start: 312,  end: 528,  durationInFrames: 216  },
  { id: 'turn',     label: 'Turn',      start: 528,  end: 696,  durationInFrames: 168  },
  { id: 'strategy', label: 'Strategy',  start: 696,  end: 852,  durationInFrames: 156  },
  { id: 'readmap',  label: 'Read Map',  start: 852,  end: 1080, durationInFrames: 228  },
  { id: 'assault',  label: 'Assault',   start: 1080, end: 1464, durationInFrames: 384  },
];

export const FINAL_CAPTION_FRAME = 1230; // "NO VICTORY IS FREE." appears here
