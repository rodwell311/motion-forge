import React from 'react';
import { Composition } from 'remotion';
import { DotaChronicle } from './DotaChronicle';
import { DURATION_FRAMES, FPS, WIDTH, HEIGHT } from './timeline';
import { BrowserMotion } from './BrowserMotion';
import { BROWSER_TIMELINE } from './browserTimeline';

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
    </>
  );
};
