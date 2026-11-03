import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const BrowserMotion: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ----------------------------------------------------
  // 1. CAMERA SYSTEM (Focal Zoom / Dynamic Punch-In)
  // ----------------------------------------------------
  // Target focal coordinates (scene coordinates centered on viewport)
  // camZoom: 1.0 (wide) -> 1.75 (dock) -> 1.55 (address bar) -> 1.0 (full)
  let camZoom = 1.0;
  let camX = 960;
  let camY = 540;

  if (frame < 40) {
    // Wide desktop view
    camZoom = 1.0;
    camX = 960;
    camY = 540;
  } else if (frame < 80) {
    // Dynamic Punch-in / Zoom into Chrome dock icon
    camZoom = interpolate(frame, [40, 65], [1.0, 1.75], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    camX = 960;
    camY = interpolate(frame, [40, 65], [540, 1000], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else if (frame < 115) {
    // Reframe camera from dock to browser address bar as window opens
    camZoom = interpolate(frame, [80, 110], [1.75, 1.55], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    camX = 960;
    camY = interpolate(frame, [80, 110], [1000, 205], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else if (frame < 180) {
    // Punch-in locked on address bar while typing
    camZoom = 1.55;
    camX = 960;
    camY = 205;
  } else if (frame < 215) {
    // Enter pressed: Camera pulls back (Zoom-Out) to full view
    camZoom = interpolate(frame, [180, 215], [1.55, 1.0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    camX = 960;
    camY = interpolate(frame, [180, 215], [205, 540], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else {
    // Full view
    camZoom = 1.0;
    camX = 960;
    camY = 540;
  }

  // ----------------------------------------------------
  // 2. CURSOR CHOREOGRAPHY
  // ----------------------------------------------------
  let cursorX = 1350;
  let cursorY = 700;
  let isClicking = false;

  if (frame < 45) {
    // Glide from desktop right to dock Chrome icon
    cursorX = interpolate(frame, [10, 45], [1350, 960], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    cursorY = interpolate(frame, [10, 45], [700, 1000], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else if (frame < 80) {
    // Hover and click Chrome icon
    cursorX = 960;
    cursorY = 1000;
    isClicking = frame >= 58 && frame <= 65;
  } else if (frame < 115) {
    // Move up to browser address bar as window opens
    cursorX = interpolate(frame, [85, 112], [960, 960], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    cursorY = interpolate(frame, [85, 112], [1000, 205], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else if (frame < 180) {
    // Address bar focus & typing
    cursorX = 960;
    cursorY = 205;
    isClicking = frame >= 115 && frame <= 122;
  } else if (frame < 225) {
    // Move down into web content area
    cursorX = interpolate(frame, [185, 225], [960, 520], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    cursorY = interpolate(frame, [185, 225], [205, 480], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else {
    // Hover on first video
    cursorX = 520;
    cursorY = 480;
  }

  const cursorScale = isClicking ? 0.82 : 1.0;

  // ----------------------------------------------------
  // 3. DOCK & CHROME ICON ANIMATION
  // ----------------------------------------------------
  const dockIconBounce = frame >= 60 && frame <= 85
    ? Math.sin((frame - 60) * 0.3) * 12
    : 0;

  // ----------------------------------------------------
  // 4. BROWSER WINDOW LAUNCH (Opens at frame 75)
  // ----------------------------------------------------
  const showBrowser = frame >= 75;
  const browserSpring = spring({
    frame: Math.max(0, frame - 75),
    fps,
    config: { damping: 15, mass: 0.9 },
  });
  const browserScale = interpolate(browserSpring, [0, 1], [0.2, 1]);
  const browserOpacity = interpolate(frame, [75, 88], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ----------------------------------------------------
  // 5. ADDRESS BAR TYPING
  // ----------------------------------------------------
  const targetUrl = 'https://www.youtube.com';
  const typeProgress = Math.floor(
    interpolate(frame, [125, 168], [0, targetUrl.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const currentUrl = targetUrl.slice(0, typeProgress);
  const isTyping = frame >= 120 && frame < 172;
  const cursorBlink = isTyping && Math.floor(frame / 5) % 2 === 0;

  // ----------------------------------------------------
  // 6. PAGE LOADING & YOUTUBE FEED
  // ----------------------------------------------------
  const showLoading = frame >= 172 && frame < 205;
  const loadProgress = interpolate(frame, [172, 202], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const isPageLoaded = frame >= 195;
  const tabTitle = frame >= 190 ? 'YouTube' : 'New Tab';

  // Video hover lift
  const cardHover = interpolate(frame, [225, 245], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        backgroundColor: '#020617',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* VIRTUAL CAMERA CONTAINER */}
      <div
        style={{
          width: 1920,
          height: 1080,
          position: 'absolute',
          top: 0,
          left: 0,
          transform: `translate(960px, 540px) scale(${camZoom}) translate(${-camX}px, ${-camY}px)`,
          transformOrigin: '0 0',
        }}
      >
        {/* DESKTOP BACKGROUND */}
        <div
          style={{
            width: 1920,
            height: 1080,
            position: 'absolute',
            top: 0,
            left: 0,
            background: 'radial-gradient(ellipse at 50% 20%, #1e1b4b 0%, #0f172a 45%, #020617 100%)',
          }}
        >
          {/* Subtle wallpaper gradient mesh glow */}
          <div
            style={{
              position: 'absolute',
              width: 1000,
              height: 500,
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.12)',
              filter: 'blur(120px)',
              top: '20%',
              left: '25%',
            }}
          />

          {/* Desktop Top Menu Bar */}
          <div
            style={{
              height: 32,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(16px)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 20px',
              fontSize: 13,
              color: '#e2e8f0',
              fontWeight: 500,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <span style={{ fontWeight: 700 }}></span>
              <span>Finder</span>
              <span style={{ color: '#94a3b8' }}>File</span>
              <span style={{ color: '#94a3b8' }}>Edit</span>
              <span style={{ color: '#94a3b8' }}>View</span>
              <span style={{ color: '#94a3b8' }}>Go</span>
              <span style={{ color: '#94a3b8' }}>Window</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: '#cbd5e1' }}>
              <span>Wi-Fi</span>
              <span>100%</span>
              <span style={{ fontWeight: 600 }}>09:41 AM</span>
            </div>
          </div>

          {/* DESKTOP DOCK (Bottom center) */}
          <div
            style={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              height: 76,
              padding: '0 16px',
              borderRadius: 22,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              zIndex: 10,
            }}
          >
            {/* Finder Icon */}
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                fontSize: 22,
              }}
            >
              😊
            </div>

            {/* Terminal Icon */}
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: '#090d16',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                fontSize: 18,
                color: '#22c55e',
                fontWeight: 'bold',
                fontFamily: 'monospace',
              }}
            >
              &gt;_
            </div>

            {/* CHROME BROWSER ICON (TARGET) */}
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                transform: `translateY(${-dockIconBounce}px) scale(${1 + (dockIconBounce > 0 ? 0.08 : 0)})`,
                position: 'relative',
              }}
            >
              {/* Chrome circular logo representation */}
              <svg width="38" height="38" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="#ea4335" />
                <path d="M 50,50 L 92,26 A 48,48 0 0,1 92,74 Z" fill="#fbbc05" />
                <path d="M 50,50 L 50,98 A 48,48 0 0,1 8,26 Z" fill="#34a853" />
                <circle cx="50" cy="50" r="22" fill="#ffffff" />
                <circle cx="50" cy="50" r="17" fill="#4285f4" />
              </svg>
              {/* Active app dot */}
              <div
                style={{
                  position: 'absolute',
                  bottom: -8,
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: '#ffffff',
                }}
              />
            </div>

            {/* Code / Editor Icon */}
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                fontSize: 20,
                color: '#fff',
              }}
            >
              ⚡
            </div>

            {/* Settings Icon */}
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                fontSize: 20,
              }}
            >
              ⚙️
            </div>
          </div>
        </div>

        {/* BROWSER WINDOW (Launches & Expands) */}
        {showBrowser && (
          <div
            style={{
              position: 'absolute',
              top: 80,
              left: 240,
              width: 1440,
              height: 860,
              borderRadius: 16,
              background: '#0f172a',
              boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              transform: `scale(${browserScale})`,
              transformOrigin: '50% 90%',
              opacity: browserOpacity,
              zIndex: 20,
            }}
          >
            {/* Window Topbar / Tab Strip */}
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
              {/* macOS Traffic Lights */}
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
                {frame >= 190 ? (
                  <span style={{ color: '#ef4444', fontSize: 14 }}>▶</span>
                ) : (
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>🌐</span>
                )}
                <span>{tabTitle}</span>
                <span style={{ marginLeft: 8, color: '#64748b', fontSize: 12 }}>×</span>
              </div>
            </div>

            {/* Navigation & Address Bar Header */}
            <div
              style={{
                height: 50,
                background: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                gap: 12,
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                position: 'relative',
              }}
            >
              {/* Back / Forward / Refresh */}
              <div style={{ display: 'flex', gap: 10, color: '#64748b', fontSize: 14 }}>
                <span>←</span>
                <span>→</span>
                <span>↻</span>
              </div>

              {/* Focused URL Address Input Box */}
              <div
                style={{
                  flex: 1,
                  height: 34,
                  background: '#1e293b',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 12px',
                  fontSize: 13,
                  color: '#f8fafc',
                  border: isTyping
                    ? '1.5px solid #3b82f6'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: isTyping ? '0 0 12px rgba(59, 130, 246, 0.4)' : 'none',
                }}
              >
                <span style={{ color: '#10b981', marginRight: 8, fontSize: 11 }}>🔒</span>
                <span style={{ fontWeight: 500, letterSpacing: 0.2 }}>{currentUrl}</span>
                {cursorBlink && (
                  <span style={{ color: '#3b82f6', fontWeight: 'bold', marginLeft: 1 }}>|</span>
                )}
                {currentUrl.length === 0 && (
                  <span style={{ color: '#64748b' }}>Search or enter web address</span>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 12, color: '#64748b', fontSize: 14 }}>
                <span>⭐</span>
                <span>⋮</span>
              </div>

              {/* Loading progress bar */}
              {showLoading && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: 2.5,
                    width: `${loadProgress}%`,
                    background: '#ef4444',
                    boxShadow: '0 0 10px #ef4444',
                  }}
                />
              )}
            </div>

            {/* Viewport Content Area */}
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
                /* Blank / Skeleton Loader */
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 24,
                    gap: 20,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ width: 120, height: 28, background: '#1e293b', borderRadius: 6 }} />
                    <div style={{ width: 360, height: 28, background: '#1e293b', borderRadius: 14 }} />
                    <div style={{ width: 32, height: 32, background: '#1e293b', borderRadius: '50%' }} />
                  </div>
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
                /* YouTube Web Page UI */
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* YouTube Topbar */}
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

                  {/* Filter Chips */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      padding: '12px 24px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    }}
                  >
                    {['All', 'Motion Graphics', 'Remotion & Code', 'Design Systems', 'Tech', 'Music'].map(
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

                  {/* Video Grid */}
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
        )}

        {/* Pointer Cursor (Glued to Scene Coordinates) */}
        <div
          style={{
            position: 'absolute',
            left: cursorX,
            top: cursorY,
            transform: `scale(${cursorScale})`,
            transition: 'transform 0.05s ease',
            pointerEvents: 'none',
            zIndex: 9999,
            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))',
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
    </div>
  );
};
