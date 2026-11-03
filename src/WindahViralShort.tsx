import React from 'react';
import {
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';
import { WINDAH_TIMELINE } from './windahTimeline';

export const WindahViralShort: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Find active cue
  const activeCue = WINDAH_TIMELINE.cues.find(
    (c) => frame >= c.startFrame && frame <= c.endFrame
  );

  // Screen shake on jumpscare frames
  let shakeX = 0;
  let shakeY = 0;
  if (activeCue?.isJumpscare) {
    const elapsedSinceJumpscare = frame - activeCue.startFrame;
    if (elapsedSinceJumpscare < 18) {
      const decay = 1 - elapsedSinceJumpscare / 18;
      shakeX = Math.sin(frame * 3.5) * 12 * decay;
      shakeY = Math.cos(frame * 4.2) * 8 * decay;
    }
  }

  // Subtitle spring animation
  const cueProgress = activeCue ? frame - activeCue.startFrame : 0;
  const popSpring = activeCue
    ? spring({
        frame: cueProgress,
        fps,
        config: activeCue.isJumpscare
          ? { damping: 9, mass: 0.4, stiffness: 240 }
          : { damping: 12, mass: 0.6, stiffness: 190 },
      })
    : 0;

  const subtitleScale = interpolate(
    popSpring,
    [0, 1],
    [0.75, activeCue?.isJumpscare ? 1.2 : 1.05]
  );
  const subtitleOpacity = interpolate(cueProgress, [0, 4], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: '#000000',
        position: 'relative',
        overflow: 'hidden',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Montserrat", "Arial Black", Impact, sans-serif',
        transform: `translate(${shakeX}px, ${shakeY}px)`,
      }}
    >
      {/* 1. Base Split Video (Gameplay Top, Facecam Bottom) */}
      <OffthreadVideo
        src={staticFile('windah_split.mp4')}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />

      {/* 2. Divider Glow Line between Game & Facecam */}
      <div
        style={{
          position: 'absolute',
          top: 957,
          left: 0,
          width: '100%',
          height: 6,
          background: 'linear-gradient(90deg, #ef4444 0%, #facc15 50%, #ef4444 100%)',
          boxShadow: '0 0 16px rgba(239, 68, 68, 0.9), 0 0 32px rgba(250, 204, 21, 0.6)',
          zIndex: 10,
        }}
      />

      {/* 3. Top Header Pill: Live Gaming Tag */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 24px',
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(10px)',
          borderRadius: 999,
          border: '1.5px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: '#ef4444',
            boxShadow: '0 0 12px #ef4444',
          }}
        />
        <span
          style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 2,
            color: '#f8fafc',
            textTransform: 'uppercase',
          }}
        >
          WINDAH BASUDARA • LIVE HORROR
        </span>
      </div>

      {/* 4. Motion Kinetic Subtitle Overlay (Clean, punchy, floating text) */}
      {activeCue && (
        <div
          style={{
            position: 'absolute',
            top: 1040,
            left: '50%',
            transform: `translate(-50%, -50%) scale(${subtitleScale})`,
            opacity: subtitleOpacity,
            zIndex: 30,
            width: '92%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.85))',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px 16px',
            }}
          >
            {activeCue.text.split(' ').map((word, idx) => {
              const cleanWord = word.replace(/[^a-zA-Z0-9']/g, '');
              const isHighlight =
                activeCue.highlightWords?.some(
                  (hw) => hw.toUpperCase() === cleanWord.toUpperCase()
                ) ?? false;

              const wordColor = isHighlight
                ? activeCue.color || '#facc15'
                : '#ffffff';

              return (
                <span
                  key={idx}
                  style={{
                    fontSize: activeCue.isJumpscare ? 64 : 52,
                    fontWeight: 900,
                    color: wordColor,
                    textTransform: 'uppercase',
                    letterSpacing: 1.5,
                    lineHeight: 1.2,
                    textShadow:
                      '0 3px 0 #000, 0 5px 0 #000, 0 8px 16px rgba(0,0,0,0.95)',
                    WebkitTextStroke: '3.5px #000000',
                    paintOrder: 'stroke fill',
                  }}
                >
                  {word}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Jumpscare Flash Vignette */}
      {activeCue?.isJumpscare && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 15,
            border: '12px solid rgba(239, 68, 68, 0.65)',
            boxShadow: 'inset 0 0 80px rgba(239, 68, 68, 0.5)',
            opacity: interpolate(cueProgress, [0, 5, 20], [0.9, 0.6, 0], {
              extrapolateRight: 'clamp',
            }),
          }}
        />
      )}
    </div>
  );
};
