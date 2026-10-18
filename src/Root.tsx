import React from 'react';
import { Composition } from 'remotion';
import { DotaChronicle } from './DotaChronicle';
import { BEATS, DURATION_FRAMES, FPS, WIDTH, HEIGHT } from './timeline';

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
    </>
  );
};
