import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const BrowserMotion: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Window entrance spring (frames 0 - 30)
  const windowSpring = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const windowScale = interpolate(windowSpring, [0, 1], [0.88, 1]);
  const windowOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  // Address bar typing
  const targetUrl = 'https://www.youtube.com';
  const typeProgress = Math.floor(
    interpolate(frame, [55, 90], [0, targetUrl.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const currentUrl = targetUrl.slice(0, typeProgress);
  const isTyping = frame >= 50 && frame < 95;
  const cursorBlink = isTyping && Math.floor(frame / 6) % 2 === 0;

  // Loading bar (frames 100 - 135)
  const loadProgress = interpolate(frame, [100, 135], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const showLoading = frame >= 100 && frame < 140;
  const isPageLoaded = frame >= 125;

  // Tab title
  const tabTitle = frame >= 120 ? 'YouTube' : 'New Tab';

  // Cursor position choreography
  let cursorX = 1400;
  let cursorY = 850;

  if (frame < 45) {
    // Glide from bottom-right to address bar
    cursorX = interpolate(frame, [10, 45], [1400, 780], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    cursorY = interpolate(frame, [10, 45], [850, 195], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else if (frame < 110) {
    // Rest on address bar
    cursorX = 780;
    cursorY = 195;
  } else if (frame < 165) {
    // Glide down to first video thumbnail
    cursorX = interpolate(frame, [110, 160], [780, 520], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    cursorY = interpolate(frame, [110, 160], [195, 480], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else {
    // Hover on first video
    cursorX = 520;
    cursorY = 480;
  }

  // Cursor click pulse at frame 50 (clicking URL bar)
  const isAddressClick = frame >= 48 && frame <= 53;
  const cursorScale = isAddressClick ? 0.85 : 1.0;

  // First card hover lift
  const cardHover = interpolate(frame, [155, 175], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at 50% 30%, #1e293b 0%, #090d16 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Subtle background glow */}
      <div
        style={{
          position: 'absolute',
          width: 900,
          height: 600,
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.08)',
          filter: 'blur(100px)',
          top: '20%',
          left: '26%',
        }}
      />

      {/* Main Browser Window */}
      <div
        style={{
          width: 1440,
          height: 860,
          borderRadius: 16,
          background: '#0f172a',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transform: `scale(${windowScale})`,
          opacity: windowOpacity,
        }}
      >
        {/* Browser Topbar / Tab strip */}
        <div
          style={{
            height: 44,
            background: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            position: 'relative',
          }}
        >
          {/* Traffic lights */}
          <div style={{ display: 'flex', gap: 8, marginRight: 20 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }} />
          </div>

          {/* Active Tab */}
          <div
            style={{
              height: 34,
              background: '#0f172a',
              borderRadius: '8px 8px 0 0',
              padding: '0 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              fontWeight: 500,
              color: '#e2e8f0',
              boxShadow: '0 -1px 3px rgba(0,0,0,0.2)',
            }}
          >
            {frame >= 120 ? (
              <span style={{ color: '#ef4444', fontSize: 14 }}>▶</span>
            ) : (
              <span style={{ color: '#94a3b8', fontSize: 13 }}>🌐</span>
            )}
            <span>{tabTitle}</span>
            <span style={{ marginLeft: 8, color: '#64748b', fontSize: 12 }}>×</span>
          </div>
        </div>

        {/* Navigation & Address Bar */}
        <div
          style={{
            height: 48,
            background: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: 12,
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            position: 'relative',
          }}
        >
          {/* Nav arrows */}
          <div style={{ display: 'flex', gap: 10, color: '#64748b', fontSize: 14 }}>
            <span>←</span>
            <span>→</span>
            <span>↻</span>
          </div>

          {/* URL Input Box */}
          <div
            style={{
              flex: 1,
              height: 32,
              background: '#1e293b',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              fontSize: 13,
              color: '#f8fafc',
              border: isTyping
                ? '1px solid rgba(59, 130, 246, 0.5)'
                : '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: isTyping ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
            }}
          >
            <span style={{ color: '#10b981', marginRight: 8, fontSize: 11 }}>🔒</span>
            <span>{currentUrl}</span>
            {cursorBlink && (
              <span style={{ color: '#3b82f6', fontWeight: 'bold', marginLeft: 1 }}>|</span>
            )}
            {currentUrl.length === 0 && (
              <span style={{ color: '#64748b' }}>Search or enter URL</span>
            )}
          </div>

          {/* Top-right window actions */}
          <div style={{ display: 'flex', gap: 12, color: '#64748b', fontSize: 14 }}>
            <span>⭐</span>
            <span>⋮</span>
          </div>

          {/* Page Loading Progress Line */}
          {showLoading && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: 2,
                width: `${loadProgress}%`,
                background: '#ef4444',
                boxShadow: '0 0 8px #ef4444',
                transition: 'width 0.1s linear',
              }}
            />
          )}
        </div>

        {/* Viewport / Content Area */}
        <div
          style={{
            flex: 1,
            background: '#090d16',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {!isPageLoaded ? (
            /* Blank / Loading Skeleton */
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: 24,
                gap: 20,
              }}
            >
              {/* Skeleton header */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ width: 120, height: 28, background: '#1e293b', borderRadius: 6 }} />
                <div style={{ width: 360, height: 28, background: '#1e293b', borderRadius: 14 }} />
                <div style={{ width: 32, height: 32, background: '#1e293b', borderRadius: '50%' }} />
              </div>

              {/* Skeleton cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 10 }}>
                {[1, 2, 3].map((n) => (
                  <div key={n} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ width: '100%', height: 210, background: '#1e293b', borderRadius: 12 }} />
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1e293b' }} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ width: '85%', height: 14, background: '#1e293b', borderRadius: 4 }} />
                        <div style={{ width: '60%', height: 12, background: '#1e293b', borderRadius: 4 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Resolved YouTube Web Interface */
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* YouTube Navbar */}
              <div
                style={{
                  height: 56,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 24px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  background: '#090d16',
                }}
              >
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      width: 28,
                      height: 20,
                      background: '#ef4444',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: 10,
                      fontWeight: 'bold',
                    }}
                  >
                    ▶
                  </div>
                  <span style={{ color: '#ffffff', fontWeight: 700, fontSize: 17, letterSpacing: -0.5 }}>
                    YouTube
                  </span>
                </div>

                {/* Search Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: 440,
                    height: 36,
                    background: '#121826',
                    borderRadius: 20,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '0 16px',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    color: '#94a3b8',
                  }}
                >
                  <span>Search</span>
                  <span>🔍</span>
                </div>

                {/* User Avatar */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 'bold',
                  }}
                >
                  H
                </div>
              </div>

              {/* Category Filter Chips */}
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: '12px 24px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                }}
              >
                {['All', 'Motion Design', 'Remotion', 'React & Web', 'Podcasts', 'Gaming'].map(
                  (chip, idx) => (
                    <div
                      key={chip}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 500,
                        background: idx === 0 ? '#ffffff' : '#1e293b',
                        color: idx === 0 ? '#0f172a' : '#cbd5e1',
                      }}
                    >
                      {chip}
                    </div>
                  )
                )}
              </div>

              {/* Video Cards Grid */}
              <div
                style={{
                  flex: 1,
                  padding: 24,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 20,
                }}
              >
                {/* Card 1 (Hovered by cursor) */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    transform: `translateY(${-cardHover * 6}px) scale(${1 + cardHover * 0.02})`,
                    transition: 'transform 0.15s ease-out',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      height: 220,
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: cardHover > 0 ? '0 12px 24px -6px rgba(0,0,0,0.5)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div style={{ color: '#ef4444', fontSize: 36, opacity: 0.9 }}>▶</div>
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        padding: '2px 6px',
                        background: 'rgba(0,0,0,0.8)',
                        borderRadius: 4,
                        fontSize: 11,
                        color: '#ffffff',
                        fontWeight: 600,
                      }}
                    >
                      14:20
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: 12,
                      }}
                    >
                      NR
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: 14 }}>
                        Building Deterministic Motion Graphics with Code
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>
                        Nous Research • 140K views • 2 days ago
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div
                    style={{
                      height: 220,
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #172554 0%, #1e3a5f 100%)',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div style={{ color: '#38bdf8', fontSize: 36, opacity: 0.8 }}>▶</div>
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        padding: '2px 6px',
                        background: 'rgba(0,0,0,0.8)',
                        borderRadius: 4,
                        fontSize: 11,
                        color: '#ffffff',
                        fontWeight: 600,
                      }}
                    >
                      28:45
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: 12,
                      }}
                    >
                      RM
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: 14 }}>
                        Remotion Rendering Pipelines in GitHub Actions
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>
                        Remotion Devs • 85K views • 1 week ago
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 3 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div
                    style={{
                      height: 220,
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #451a03 0%, #78350f 100%)',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div style={{ color: '#f59e0b', fontSize: 36, opacity: 0.8 }}>▶</div>
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        padding: '2px 6px',
                        background: 'rgba(0,0,0,0.8)',
                        borderRadius: 4,
                        fontSize: 11,
                        color: '#ffffff',
                        fontWeight: 600,
                      }}
                    >
                      09:15
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: 12,
                      }}
                    >
                      AG
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: 14 }}>
                        Autonomous AI Coding Agents: Full Architecture
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>
                        Agent Systems • 52K views • 4 days ago
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Animated Realistic Pointer Cursor */}
      <div
        style={{
          position: 'absolute',
          left: cursorX,
          top: cursorY,
          transform: `scale(${cursorScale})`,
          transition: 'transform 0.05s ease',
          pointerEvents: 'none',
          zIndex: 9999,
          filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.45))',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M5.5 3.5L18.5 13.5L12 14.5L15 21L12.5 22L9.5 15.5L5.5 19V3.5Z"
            fill="#ffffff"
            stroke="#000000"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};
