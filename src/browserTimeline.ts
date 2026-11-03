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
  durationSeconds: 9,
  totalFrames: 270,
  beats: [
    { id: 'desktop_idle', start: 0, end: 40, label: 'Desktop view, cursor moves to Chrome icon in Dock' },
    { id: 'dock_punch_in', start: 40, end: 80, label: 'Dynamic zoom in to Chrome icon & click action' },
    { id: 'browser_launch', start: 80, end: 115, label: 'Browser opens & camera reframes to address bar' },
    { id: 'address_type', start: 115, end: 180, label: 'Punch-in focus on address bar, typing youtube.com' },
    { id: 'load_and_zoom_out', start: 180, end: 215, label: 'Enter pressed, progress bar sweeps, camera pulls out' },
    { id: 'youtube_feed', start: 215, end: 270, label: 'YouTube feed resolves in full view, hover video card' },
  ] as Beat[],
};
