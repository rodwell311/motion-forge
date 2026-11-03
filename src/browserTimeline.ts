export interface Beat {
  id: string;
  start: number;
  end: number;
  label: string;
}

export const BROWSER_TIMELINE = {
  fps: 30,
  width: 1920,
  height: 1080,
  durationSeconds: 7,
  totalFrames: 210,
  beats: [
    { id: 'open_browser', start: 0, end: 45, label: 'Browser window emerges' },
    { id: 'type_url', start: 45, end: 100, label: 'Cursor clicks and types URL' },
    { id: 'load_page', start: 100, end: 140, label: 'Enter pressed, progress bar loads' },
    { id: 'browse_feed', start: 140, end: 210, label: 'YouTube feed appears, cursor hovers video' },
  ] as Beat[],
};
