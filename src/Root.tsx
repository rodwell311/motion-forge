import React from 'react';
import { Composition } from 'remotion';
import { DotaChronicle } from './DotaChronicle';
import { DURATION_FRAMES, FPS, WIDTH, HEIGHT } from './timeline';
import { BrowserMotion } from './BrowserMotion';
import { BROWSER_TIMELINE } from './browserTimeline';
import { WindahViralShort } from './WindahViralShort';
import { WINDAH_TIMELINE } from './windahTimeline';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="DotaChronicle"
        component={DotaChronicle}
        durationInFrames={DURATION_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{}}
      />
      <Composition
        id="BrowserMotion"
        component={BrowserMotion}
        durationInFrames={BROWSER_TIMELINE.totalFrames}
        fps={BROWSER_TIMELINE.fps}
        width={BROWSER_TIMELINE.width}
        height={BROWSER_TIMELINE.height}
        defaultProps={{}}
      />
      <Composition
        id="WindahViralShort"
        component={WindahViralShort}
        durationInFrames={WINDAH_TIMELINE.totalFrames}
        fps={WINDAH_TIMELINE.fps}
        width={WINDAH_TIMELINE.width}
        height={WINDAH_TIMELINE.height}
        defaultProps={{}}
      />
    </>
  );
};
