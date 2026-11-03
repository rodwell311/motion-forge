export interface SubtitleCue {
  id: string;
  startFrame: number;
  endFrame: number;
  text: string;
  highlightWords?: string[];
  color?: string;
  isJumpscare?: boolean;
}

export const WINDAH_TIMELINE = {
  fps: 30,
  width: 1080,
  height: 1920,
  totalFrames: 840, // 28.0 seconds @ 30fps
  cues: [
    {
      id: 'cue_1',
      startFrame: 60,  // 2.0s
      endFrame: 145,  // 4.8s
      text: 'WAH INI SEREM GUYS...',
      highlightWords: ['SEREM'],
      color: '#facc15',
    },
    {
      id: 'cue_2',
      startFrame: 145, // 4.8s
      endFrame: 225, // 7.5s
      text: "BOCIL EMOTE HIJAU, LET'S GO...",
      highlightWords: ["LET'S", 'GO'],
      color: '#4ade80',
    },
    {
      id: 'cue_3',
      startFrame: 225, // 7.5s
      endFrame: 255, // 8.5s
      text: 'MAKAN AIR...',
      highlightWords: ['MAKAN'],
      color: '#38bdf8',
    },
    {
      id: 'cue_4',
      startFrame: 255, // 8.5s (Jumpscare trigger!)
      endFrame: 315, // 10.5s
      text: 'ANJIRRR!!',
      highlightWords: ['ANJIRRR!!'],
      color: '#ef4444',
      isJumpscare: true,
    },
    {
      id: 'cue_5',
      startFrame: 315, // 10.5s
      endFrame: 360, // 12.0s
      text: 'GOBLOK ANJIR!!',
      highlightWords: ['GOBLOK'],
      color: '#fb923c',
      isJumpscare: true,
    },
    {
      id: 'cue_6',
      startFrame: 360, // 12.0s
      endFrame: 435, // 14.5s
      text: 'ADA PALA COK!!',
      highlightWords: ['ADA', 'PALA'],
      color: '#ef4444',
      isJumpscare: true,
    },
    {
      id: 'cue_7',
      startFrame: 435, // 14.5s
      endFrame: 525, // 17.5s
      text: 'SORRY TOXIC... TOLONG...',
      highlightWords: ['SORRY', 'TOXIC'],
      color: '#ffffff',
    },
    {
      id: 'cue_8',
      startFrame: 525, // 17.5s
      endFrame: 630, // 21.0s
      text: 'ASTAGA KAKIKU LEMAS!!',
      highlightWords: ['KAKIKU', 'LEMAS'],
      color: '#facc15',
    },
    {
      id: 'cue_9',
      startFrame: 630, // 21.0s
      endFrame: 720, // 24.0s
      text: 'BERDIRI! BERDIRI!',
      highlightWords: ['BERDIRI!'],
      color: '#4ade80',
    },
    {
      id: 'cue_10',
      startFrame: 720, // 24.0s
      endFrame: 835, // 27.8s
      text: 'SORRY TOXIC ANJIR, ADA KEPALA ITU...',
      highlightWords: ['ADA', 'KEPALA'],
      color: '#facc15',
    },
  ] as SubtitleCue[],
};
