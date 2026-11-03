import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const BrowserMotion: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ----------------------------------------------------
  // 1. CAMERA SYSTEM (Focal Zoom / Dynamic Punch-In)
  // ----------------------------------------------------
  // When typing, focal point (680, 126) is centered at (960, 540).
  let camZoom = 1.0;
  let camX = 960;
  let camY = 540;

  if (frame < 40) {
    // Wide desktop view
    camZoom = 1.0;
    camX = 960;
    camY = 540;
  } else if (frame < 80) {
    // Dynamic Punch-in / Zoom into Chrome icon on Windows Taskbar
    camZoom = interpolate(frame, [40, 65], [1.0, 2.0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    camX = interpolate(frame, [40, 65], [960, 980], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    camY = interpolate(frame, [40, 65], [540, 1056], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else if (frame < 115) {
    // Reframe camera from taskbar to the address bar text area (680, 126)
    camZoom = interpolate(frame, [80, 110], [2.0, 2.0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    camX = interpolate(frame, [80, 110], [980, 680], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    camY = interpolate(frame, [80, 110], [1056, 126], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else if (frame < 180) {
    // LOCKED AT DEAD CENTER: The typing text sits exactly in the center of the screen
    camZoom = 2.0;
    camX = 680;
    camY = 126;
  } else if (frame < 215) {
    // Enter pressed: Camera pulls back (Zoom-Out) smoothly to wide view
    camZoom = interpolate(frame, [180, 215], [2.0, 1.0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    camX = interpolate(frame, [180, 215], [680, 960], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    camY = interpolate(frame, [180, 215], [126, 540], {
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
    // Glide to Chrome icon in Windows taskbar
    cursorX = interpolate(frame, [10, 45], [1350, 980], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    cursorY = interpolate(frame, [10, 45], [700, 1056], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else if (frame < 80) {
    // Click Chrome icon
    cursorX = 980;
    cursorY = 1056;
    isClicking = frame >= 58 && frame <= 65;
  } else if (frame < 115) {
    // Move up to address bar as browser window opens
    cursorX = interpolate(frame, [85, 112], [980, 620], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    cursorY = interpolate(frame, [85, 112], [1056, 126], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else if (frame < 180) {
    // Focus in address bar
    cursorX = 620;
    cursorY = 126;
    isClicking = frame >= 115 && frame <= 122;
  } else if (frame < 225) {
    // Move down into web content area
    cursorX = interpolate(frame, [185, 225], [620, 520], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    cursorY = interpolate(frame, [185, 225], [126, 480], {
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
  // 3. TASKBAR & CHROME LAUNCH ANIMATION
  // ----------------------------------------------------
  const taskbarAppPulse = frame >= 60 && frame <= 85
    ? Math.sin((frame - 60) * 0.3) * 6
    : 0;

  const showBrowser = frame >= 75;
  const browserSpring = spring({
    frame: Math.max(0, frame - 75),
    fps,
    config: { damping: 15, mass: 0.9 },
  });
  const browserScale = interpolate(browserSpring, [0, 1], [0.25, 1]);
  const browserOpacity = interpolate(frame, [75, 88], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ----------------------------------------------------
  // 4. ADDRESS BAR TYPING
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
  // 5. PAGE LOADING & YOUTUBE FEED
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
        backgroundColor: '#0a0e17',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif',
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
        {/* WINDOWS 11 DESKTOP BACKGROUND */}
        <div
          style={{
            width: 1920,
            height: 1080,
            position: 'absolute',
            top: 0,
            left: 0,
            background: 'radial-gradient(circle at 50% 40%, #1e293b 0%, #0b1120 60%, #020617 100%)',
          }}
        >
          {/* Windows 11 Bloom Art Glow */}
          <div
            style={{
              position: 'absolute',
              width: 800,
              height: 600,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, rgba(99, 102, 241, 0.15) 50%, transparent 80%)',
              filter: 'blur(90px)',
              top: '22%',
              left: '29%',
            }}
          />

          {/* Desktop Shortcuts (Windows style) */}
          <div style={{ position: 'absolute', top: 20, left: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 70 }}>
              <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                🗑️
              </div>
              <span style={{ fontSize: 11, color: '#f8fafc', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>Recycle Bin</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 70 }}>
              <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                📁
              </div>
              <span style={{ fontSize: 11, color: '#f8fafc', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>Projects</span>
            </div>
          </div>

          {/* WINDOWS 11 TASKBAR (Bottom bar) */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: 1920,
              height: 48,
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(30px)',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 14px',
              zIndex: 30,
              boxShadow: '0 -4px 16px rgba(0,0,0,0.4)',
            }}
          >
            {/* Left empty spacer / widgets button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 13 }}>
              <span>⛅ 28°C Hujan</span>
            </div>

            {/* Centered Taskbar Icons (Windows 11 signature) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            >
              {/* Windows 11 Start Icon (4 blue squares) */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 9px)', gap: 3 }}>
                  <div style={{ width: 9, height: 9, background: '#0078d4', borderRadius: 1 }} />
                  <div style={{ width: 9, height: 9, background: '#0078d4', borderRadius: 1 }} />
                  <div style={{ width: 9, height: 9, background: '#0078d4', borderRadius: 1 }} />
                  <div style={{ width: 9, height: 9, background: '#0078d4', borderRadius: 1 }} />
                </div>
              </div>

              {/* Search Pill/Icon */}
              <div style={{ width: 40, height: 40, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: 16 }}>
                🔍
              </div>

              {/* Task View */}
              <div style={{ width: 40, height: 40, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: 16 }}>
                🗔
              </div>

              {/* File Explorer */}
              <div style={{ width: 40, height: 40, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                📂
              </div>

              {/* GOOGLE CHROME ICON (TARGET) */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 6,
                  background: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  transform: `scale(${1 + (taskbarAppPulse > 0 ? 0.1 : 0)})`,
                  transition: 'transform 0.1s ease',
                }}
              >
                {/* Chrome Icon SVG */}
                <svg width="28" height="28" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="48" fill="#ea4335" />
                  <path d="M 50,50 L 92,26 A 48,48 0 0,1 92,74 Z" fill="#fbbc05" />
                  <path d="M 50,50 L 50,98 A 48,48 0 0,1 8,26 Z" fill="#34a853" />
                  <circle cx="50" cy="50" r="22" fill="#ffffff" />
                  <circle cx="50" cy="50" r="17" fill="#4285f4" />
                </svg>
                {/* Windows 11 Running/Active Indicator Bar */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    width: showBrowser ? 16 : 6,
                    height: 3,
                    borderRadius: 2,
                    background: '#60a5fa',
                    transition: 'width 0.2s ease',
                  }}
                />
              </div>

              {/* Terminal */}
              <div style={{ width: 40, height: 40, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e', fontSize: 16, fontFamily: 'monospace', fontWeight: 'bold' }}>
                &gt;_
              </div>

              {/* VS Code */}
              <div style={{ width: 40, height: 40, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#0ea5e9' }}>
                ⚡
              </div>
            </div>

            {/* System Tray (Windows 11 Right Side) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: '#e2e8f0', fontSize: 12 }}>
              <span>^</span>
              <span>📶</span>
              <span>🔊</span>
              <span>🔋 100%</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
                <span style={{ fontWeight: 600 }}>09:41 AM</span>
                <span style={{ color: '#94a3b8', fontSize: 11 }}>03/11/2026</span>
              </div>
            </div>
          </div>
        </div>

        {/* WINDOWS 11 BROWSER WINDOW */}
        {showBrowser && (
          <div
            style={{
              position: 'absolute',
              top: 60,
              left: 200,
              width: 1520,
              height: 890,
              borderRadius: 8,
              background: '#0f172a',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              transform: `scale(${browserScale})`,
              transformOrigin: '50% 95%',
              opacity: browserOpacity,
              zIndex: 20,
            }}
          >
            {/* Windows 11 Chrome Titlebar & Tab Strip */}
            <div
              style={{
                height: 42,
                background: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingLeft: 12,
                paddingRight: 0,
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                position: 'relative',
              }}
            >
              {/* Tabs Section */}
              <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', gap: 4 }}>
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
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: '#f1f5f9',
                    boxShadow: '0 -1px 3px rgba(0,0,0,0.3)',
                  }}
                >
                  {frame >= 190 ? (
                    <span style={{ color: '#ef4444', fontSize: 13 }}>▶</span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>🌐</span>
                  )}
                  <span>{tabTitle}</span>
                  <span style={{ marginLeft: 8, color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>×</span>
                </div>

                {/* Add Tab '+' */}
                <div style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 16, marginBottom: 3 }}>
                  +
                </div>
              </div>

              {/* WINDOWS 11 WINDOW CONTROLS (Minimize, Maximize, Close on TOP RIGHT) */}
              <div style={{ display: 'flex', height: '100%' }}>
                {/* Minimize */}
                <div style={{ width: 46, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: 14 }}>
                  ─
                </div>
                {/* Maximize */}
                <div style={{ width: 46, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: 13 }}>
                  ▢
                </div>
                {/* Close (Windows Red highlight) */}
                <div style={{ width: 48, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: 14 }}>
                  ✕
                </div>
              </div>
            </div>

            {/* Navigation & Address Bar Bar */}
            <div
              style={{
                height: 48,
                background: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                padding: '0 14px',
                gap: 12,
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                position: 'relative',
              }}
            >
              {/* Nav arrows */}
              <div style={{ display: 'flex', gap: 10, color: '#94a3b8', fontSize: 14 }}>
                <span style={{ cursor: 'pointer' }}>←</span>
                <span style={{ cursor: 'pointer' }}>→</span>
                <span style={{ cursor: 'pointer' }}>↻</span>
              </div>

              {/* Address Input Box */}
              <div
                style={{
                  flex: 1,
                  height: 34,
                  background: '#1e293b',
                  borderRadius: 20,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 14px',
                  fontSize: 13,
                  color: '#f8fafc',
                  border: isTyping
                    ? '1.5px solid #3b82f6'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: isTyping ? '0 0 14px rgba(59, 130, 246, 0.45)' : 'none',
                }}
              >
                <span style={{ color: '#10b981', marginRight: 10, fontSize: 11 }}>🔒</span>
                {/* The exact text being typed */}
                <span style={{ fontWeight: 500, letterSpacing: 0.2 }}>{currentUrl}</span>
                {cursorBlink && (
                  <span style={{ color: '#3b82f6', fontWeight: 'bold', marginLeft: 1 }}>|</span>
                )}
                {currentUrl.length === 0 && (
                  <span style={{ color: '#64748b' }}>Search Google or type a URL</span>
                )}
              </div>

              {/* Right extension icons */}
              <div style={{ display: 'flex', gap: 12, color: '#94a3b8', fontSize: 14 }}>
                <span>🧩</span>
                <span>⭐</span>
                <span>⋮</span>
              </div>

              {/* Progress Loading Bar */}
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
