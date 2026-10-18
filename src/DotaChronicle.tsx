import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  BEATS,
  WIDTH,
  HEIGHT,
  FINAL_CAPTION_FRAME,
} from './timeline';

// ============================================================
// Palette + helpers (shared art direction across all beats)
// ============================================================

const C = {
  bg0: '#0a1014',
  bg1: '#1a2329',
  bg2: '#233038',
  parchment0: '#e8d8b0',
  parchment1: '#c9b385',
  parchmentInk: '#3a2a14',
  ember: '#ff7a3c',
  emberSoft: '#ffb84d',
  emberDeep: '#b8421f',
  ward: '#3df27a',
  wardSoft: '#aef5c4',
  smoke: '#2fb8a8',
  smokeSoft: '#5fd9c8',
  crystal: '#9bb8ff',
  crystalSoft: '#c8d6ff',
  ink: '#0b0f12',
  bone: '#e8e4d6',
};

type Pt = [number, number];

function bez(t: number, p0: Pt, p1: Pt, p2: Pt, p3: Pt): Pt {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
          a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
}

function bezPath(p0: Pt, p1: Pt, p2: Pt, p3: Pt): string {
  return `M ${p0[0]} ${p0[1]} C ${p1[0]} ${p1[1]}, ${p2[0]} ${p2[1]}, ${p3[0]} ${p3[1]}`;
}

function clamp(x: number, lo = 0, hi = 1): number {
  return Math.max(lo, Math.min(hi, x));
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// single shared grain texture overlay (rendered once at composition root)
const GrainLayer: React.FC<{ opacity?: number }> = ({ opacity = 0.07 }) => (
  <AbsoluteFill style={{ pointerEvents: 'none', mixBlendMode: 'overlay', opacity }}>
    <svg width={WIDTH} height={HEIGHT} style={{ width: '100%', height: '100%' }}>
      <filter id="grainFilter">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grainFilter)" />
    </svg>
  </AbsoluteFill>
);

type Shape = 'diamond' | 'hexagon' | 'triangle' | 'square' | 'pentagon';

function shapePath(shape: Shape, r: number): string {
  switch (shape) {
    case 'diamond':
      return `M 0 ${-r} L ${r} 0 L 0 ${r} L ${-r} 0 Z`;
    case 'hexagon':
      return Array.from({ length: 6 })
        .map((_, i) => {
          const a = (i * Math.PI) / 3;
          return `${i === 0 ? 'M' : 'L'} ${Math.cos(a) * r} ${Math.sin(a) * r}`;
        })
        .join(' ') + ' Z';
    case 'triangle':
      return `M 0 ${-r} L ${r * 0.866} ${r * 0.5} L ${-r * 0.866} ${r * 0.5} Z`;
    case 'square':
      return `M ${-r * 0.82} ${-r * 0.82} L ${r * 0.82} ${-r * 0.82} L ${r * 0.82} ${r * 0.82} L ${-r * 0.82} ${r * 0.82} Z`;
    case 'pentagon':
      return Array.from({ length: 5 })
        .map((_, i) => {
          const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
          return `${i === 0 ? 'M' : 'L'} ${Math.cos(a) * r} ${Math.sin(a) * r}`;
        })
        .join(' ') + ' Z';
  }
}

const HeroToken: React.FC<{
  x: number; y: number; rot: number; color: string; shape: Shape; size?: number;
}> = ({ x, y, rot, color, shape, size = 36 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <path d={shapePath(shape, size)} fill={color} stroke={C.ink} strokeWidth={2} />
    <path d={shapePath(shape, size)} fill="none" stroke="#fff" strokeWidth={1} opacity={0.35} />
  </g>
);

// citadel crystal used in lanes + assault
const Citadel: React.FC<{ x: number; y: number; scale: number; rot: number; crack?: number }> = ({
  x, y, scale, rot, crack = 0,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
    <polygon
      points="0,-130 75,-45 75,85 0,145 -75,85 -75,-45"
      fill={C.crystal}
      stroke={C.crystalSoft}
      strokeWidth={3}
      opacity={0.9 - crack * 0.25}
    />
    <polygon points="0,-130 75,-45 0,0 -75,-45" fill={C.crystalSoft} opacity={0.55} />
    <polygon points="0,0 75,-45 75,85 0,145" fill="#fff" opacity={0.14} />
    {/* cracks */}
    {crack > 0 && (
      <g stroke={C.emberDeep} strokeWidth={2 + crack * 2} fill="none" opacity={crack}>
        <path d="M 0 -130 L -10 -40 L 6 30 L -8 90 L 4 145" />
        <path d="M 0 -130 L 14 -20 L -6 60 L 10 120" />
        <path d="M -40 0 L 0 30 L 50 10" />
      </g>
    )}
  </g>
);

// ============================================================
// Beat 1 — Draft (0-192)
// Five geometric hero tokens choose routes on a parchment map.
// ============================================================

const DraftScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  type Route = { shape: Shape; color: string; p0: Pt; p1: Pt; p2: Pt; p3: Pt };
  const routes: Route[] = [
    { shape: 'diamond',  color: C.ember,     p0: [240, 140],  p1: [240, 460], p2: [380, 740], p3: [420, 920] },
    { shape: 'hexagon',  color: C.ward,      p0: [540, 140],  p1: [540, 460], p2: [620, 740], p3: [660, 920] },
    { shape: 'triangle', color: C.smoke,     p0: [960, 140],  p1: [960, 460], p2: [960, 740], p3: [960, 920] },
    { shape: 'square',   color: C.emberSoft, p0: [1380, 140], p1: [1380, 460], p2: [1300, 740], p3: [1260, 920] },
    { shape: 'pentagon', color: C.crystal,   p0: [1680, 140], p1: [1680, 460], p2: [1540, 740], p3: [1500, 920] },
  ];

  // route drawing
  const routeProgress = clamp(interpolate(frame, [16, 170], [0, 1]));

  // token entry uses spring for arrival, staggered
  const captionOpacity = clamp(interpolate(frame, [80, 100, 170, 188], [0, 1, 1, 0]));

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.parchment0}, ${C.parchment1})` }}>
      <svg width={WIDTH} height={HEIGHT} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <radialGradient id="parchVig" cx="50%" cy="50%" r="75%">
            <stop offset="55%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor={C.parchmentInk} stopOpacity="0.55" />
          </radialGradient>
          <filter id="parchTex">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.32  0 0 0 0 0.24  0 0 0 0 0.12  0 0 0 0.18 0" />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
        </defs>
        {/* tactical grid */}
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`v${i}`} x1={((i + 1) * WIDTH) / 13} y1={0} x2={((i + 1) * WIDTH) / 13} y2={HEIGHT}
                stroke={C.parchmentInk} strokeWidth={0.5} opacity={0.16} />
        ))}
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={((i + 1) * HEIGHT) / 8} x2={WIDTH} y2={((i + 1) * HEIGHT) / 8}
                stroke={C.parchmentInk} strokeWidth={0.5} opacity={0.16} />
        ))}
        <rect width={WIDTH} height={HEIGHT} filter="url(#parchTex)" opacity={0.5} />

        {/* routes */}
        {routes.map((r, i) => {
          const d = bezPath(r.p0, r.p1, r.p2, r.p3);
          return (
            <g key={i}>
              <path d={d} stroke={r.color} strokeWidth={12} fill="none" opacity={0.12}
                    strokeDasharray="1" pathLength={1} strokeDashoffset={1 - routeProgress} />
              <path d={d} stroke={r.color} strokeWidth={3} fill="none" opacity={0.92}
                    strokeDasharray="1" pathLength={1} strokeDashoffset={1 - routeProgress} />
            </g>
          );
        })}

        {/* destination nodes */}
        {routes.map((r, i) => (
          <circle key={`d${i}`} cx={r.p3[0]} cy={r.p3[1]} r={10} fill="none"
                  stroke={r.color} strokeWidth={2} opacity={routeProgress} />
        ))}

        {/* hero tokens moving along routes */}
        {routes.map((r, i) => {
          const startF = 22 + i * 4;
          const endF = 170;
          const sp = spring({ frame: frame - startF, fps, config: { damping: 18, stiffness: 90, mass: 0.9 } });
          const p = clamp(interpolate(frame, [startF, endF], [0, 1])) * (0.85 + sp * 0.15);
          const [x, y] = bez(p, r.p0, r.p1, r.p2, r.p3);
          const rot = interpolate(frame, [startF, endF], [0, 180 + i * 36]);
          return <HeroToken key={`t${i}`} x={x} y={y} rot={rot} color={r.color} shape={r.shape} />;
        })}

        <rect width={WIDTH} height={HEIGHT} fill="url(#parchVig)" />
      </svg>

      {/* caption off focal vector (lower-right) */}
      <div style={{
        position: 'absolute', right: 96, bottom: 96, opacity: captionOpacity,
        color: C.parchmentInk, fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: 36, letterSpacing: 8, fontWeight: 600,
      }}>
        SETIAP PILIHAN
      </div>
    </AbsoluteFill>
  );
};

// ============================================================
// Beat 2 — Lanes (192-312)
// Three organic lane paths converge toward a crystal citadel.
// ============================================================

const LanesScene: React.FC = () => {
  const frame = useCurrentFrame();

  const lanes: { color: string; p0: Pt; p1: Pt; p2: Pt; p3: Pt }[] = [
    { color: C.ember, p0: [80, 220],   p1: [420, 380],  p2: [720, 480],  p3: [920, 540] },
    { color: C.ward,  p0: [1840, 220], p1: [1500, 380], p2: [1200, 480], p3: [1000, 540] },
    { color: C.smoke, p0: [960, 1020], p1: [960, 860],  p2: [960, 700],  p3: [960, 600] },
  ];

  const draw = clamp(interpolate(frame, [0, 80], [0, 1]));
  const citadelGrow = clamp(interpolate(frame, [28, 96], [0, 1]));
  const citadelRot = interpolate(frame, [0, 120], [0, 90]);
  const cap = clamp(interpolate(frame, [28, 40, 64, 84], [0, 1, 1, 0]));
  const lockPulse = 1 + Math.sin(frame * 0.18) * 0.06;

  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, ${C.bg2} 0%, ${C.bg0} 78%)` }}>
      <svg width={WIDTH} height={HEIGHT} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <filter id="lanesGlow"><feGaussianBlur stdDeviation="6" /></filter>
        </defs>
        {lanes.map((l, i) => {
          const d = bezPath(l.p0, l.p1, l.p2, l.p3);
          const runner = clamp(interpolate(frame, [12 + i * 8, 100 + i * 8], [0, 1]));
          const [rx, ry] = bez(runner, l.p0, l.p1, l.p2, l.p3);
          return (
            <g key={i}>
              <path d={d} stroke={l.color} strokeWidth={24} fill="none" opacity={0.18} filter="url(#lanesGlow)"
                    strokeDasharray="1" pathLength={1} strokeDashoffset={1 - draw} />
              <path d={d} stroke={l.color} strokeWidth={4} fill="none" opacity={0.95}
                    strokeDasharray="1" pathLength={1} strokeDashoffset={1 - draw} />
              <circle cx={rx} cy={ry} r={10} fill={l.color} opacity={draw} />
              <circle cx={rx} cy={ry} r={23} fill="none" stroke={l.color} strokeWidth={2} opacity={0.42 * draw} />
            </g>
          );
        })}
        <circle cx={960} cy={540} r={190 * lockPulse} fill="none" stroke={C.crystalSoft} strokeWidth={1.5} opacity={citadelGrow * 0.25} />
        <Citadel x={960} y={540} scale={0.25 + citadelGrow * 1.05} rot={citadelRot} />
      </svg>

      {/* brief centered caption — held only ~24 frames */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 132, textAlign: 'center',
        opacity: cap, color: C.bone, fontFamily: 'Georgia, serif',
        letterSpacing: 10, textShadow: '0 2px 24px rgba(0,0,0,0.7)',
      }}>
        <div style={{ fontSize: 46 }}>LIMA HERO</div>
        <div style={{ fontSize: 46, marginTop: 6 }}>SATU ANCIENT</div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================
// Beat 3 — Vision (312-528)
// Ward totem projects a readable green vision cone and radius,
// then teal smoke rolls through.
// ============================================================

const VisionScene: React.FC = () => {
  const frame = useCurrentFrame();

  const totemRise = interpolate(frame, [0, 60], [80, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const coneSpread = clamp(interpolate(frame, [60, 130], [0, 1]));
  const coneAngle = coneSpread * 32; // half-angle in degrees
  const coneLen = 1220;
  const radiusGrow = clamp(interpolate(frame, [72, 132], [0, 1]));
  const radiusR = interpolate(frame, [72, 164], [90, 650], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const radiusPulse = 1 + Math.sin(frame * 0.18) * 0.04;
  const smokeX = interpolate(frame, [180, 216], [-300, WIDTH + 300], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const smokeOpacity = clamp(interpolate(frame, [180, 200, 210, 216], [0, 1, 1, 0.5]));

  const wx = 455;
  const wy = 730 + totemRise;

  // wedge path: from totem, two rays at ±coneAngle, arc back
  const a1 = (-coneAngle * Math.PI) / 180;
  const a2 = (coneAngle * Math.PI) / 180;
  const wedgePath =
    `M ${wx} ${wy} ` +
    `L ${wx + Math.cos(a1) * coneLen} ${wy + Math.sin(a1) * coneLen} ` +
    `A ${coneLen} ${coneLen} 0 0 1 ${wx + Math.cos(a2) * coneLen} ${wy + Math.sin(a2) * coneLen} Z`;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.bg0}, ${C.bg1})` }}>
      <svg width={WIDTH} height={HEIGHT} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <radialGradient id="coneGrad" cx="0%" cy="50%" r="100%">
            <stop offset="0%" stopColor={C.ward} stopOpacity={0.55} />
            <stop offset="70%" stopColor={C.wardSoft} stopOpacity={0.08} />
            <stop offset="100%" stopColor={C.wardSoft} stopOpacity={0} />
          </radialGradient>
          <linearGradient id="smokeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={C.smoke} stopOpacity="0" />
            <stop offset="50%" stopColor={C.smokeSoft} stopOpacity="0.7" />
            <stop offset="100%" stopColor={C.smoke} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* radius circle */}
        <circle cx={wx} cy={wy} r={radiusR * radiusPulse} fill="none" stroke={C.ward}
                strokeWidth={1.5} opacity={radiusGrow * 0.55} strokeDasharray="5 7" />
        <circle cx={wx} cy={wy} r={radiusR * 0.72} fill="none" stroke={C.wardSoft}
                strokeWidth={1} opacity={radiusGrow * 0.28} />

        {/* vision cone wedge */}
        {coneSpread > 0 && (
          <path d={wedgePath} fill="url(#coneGrad)" opacity={coneSpread} />
        )}
        {/* crisp cone edges */}
        {coneSpread > 0 && (
          <g opacity={coneSpread * 0.85} stroke={C.ward} strokeWidth={1.5}>
            <line x1={wx} y1={wy} x2={wx + Math.cos(a1) * coneLen} y2={wy + Math.sin(a1) * coneLen} />
            <line x1={wx} y1={wy} x2={wx + Math.cos(a2) * coneLen} y2={wy + Math.sin(a2) * coneLen} />
          </g>
        )}

        {/* smoke roll */}
        <g opacity={smokeOpacity} transform={`translate(${smokeX} 0) skewX(-12)`}>
          <rect x={-260} y={360} width={620} height={520} fill="url(#smokeGrad)" />
          <rect x={-180} y={300} width={460} height={520} fill="url(#smokeGrad)" opacity={0.6} />
        </g>

        {/* ward totem is deliberately oversized: this scene is about vision */}
        <g transform={`translate(${wx} ${wy})`}>
          <circle cx={0} cy={-142} r={124} fill={C.ward} opacity={0.16 + coneSpread * 0.16} />
          <rect x={-30} y={-202} width={60} height={202} fill={C.ink} stroke={C.ward} strokeWidth={4} />
          <polygon points="0,-246 43,-202 -43,-202" fill={C.ward} />
          <circle cx={0} cy={-222} r={12} fill="#fff" opacity={0.95} />
          <rect x={-62} y={0} width={124} height={24} fill={C.ink} stroke={C.ward} strokeWidth={3} />
        </g>
      </svg>

      <div style={{ position: 'absolute', left: wx + 140, top: wy + 42, opacity: radiusGrow,
        color: C.wardSoft, fontFamily: 'monospace', fontSize: 28, fontWeight: 700, letterSpacing: 5,
        textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}>VISION RANGE</div>
      <div style={{ position: 'absolute', left: wx + 158, top: wy - 128, opacity: coneSpread,
        color: C.wardSoft, fontFamily: 'monospace', fontSize: 26, fontWeight: 700, letterSpacing: 4,
        textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}>LINE OF SIGHT</div>
      <div style={{ position: 'absolute', left: wx - 118, top: wy - 290, opacity: clamp(interpolate(frame,[10,40],[0,1])),
        color: C.wardSoft, fontFamily: 'monospace', fontSize: 30, fontWeight: 700, letterSpacing: 6,
        textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}>WARD</div>
    </AbsoluteFill>
  );
};

// ============================================================
// Beat 4 — Turn (528-696)
// Camera pushes through a clash of two color-coded formations;
// strategic paths bend from disadvantage into advantage.
// ============================================================

const TurnScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const camScale = interpolate(frame, [0, 168], [1, 1.4], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const camX = interpolate(frame, [0, 168], [0, -200], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const turn = clamp(interpolate(frame, [40, 130], [0, 1]));
  // spring for snap-forward
  const snap = spring({ frame: frame - 130, fps, config: { damping: 14, stiffness: 120, mass: 0.8 } });
  const adv = turn + snap * (1 - turn) * 0.25;

  // ember formation left, ward formation right
  const ePos: Pt[] = [[260, 360], [260, 540], [260, 720]];
  const wPos: Pt[] = [[1660, 360], [1660, 540], [1660, 720]];

  // clash point shifts from disadvantage (back-center) to advantage (forward-center)
  const clash: Pt = [interpolate(adv, [0, 1], [960, 1120]), interpolate(adv, [0, 1], [640, 480])];

  // strategic paths bend: control points interpolate between "back" and "forward"
  // ember path goes from ember formation to clash; disadvantage pulls ctrl back, advantage pushes forward
  function emberRoute(idx: number): { p0: Pt; p1: Pt; p2: Pt; p3: Pt } {
    const src = ePos[idx];
    const p1back: Pt = [src[0] + 360, src[1] - 30];
    const p1fwd: Pt = [src[0] + 540, src[1] - 80];
    const p2back: Pt = [clash[0] - 200, clash[1] + 120];
    const p2fwd: Pt = [clash[0] - 120, clash[1] + 30];
    return {
      p0: src,
      p1: [interpolate(adv, [0, 1], [p1back[0], p1fwd[0]]), interpolate(adv, [0, 1], [p1back[1], p1fwd[1]])],
      p2: [interpolate(adv, [0, 1], [p2back[0], p2fwd[0]]), interpolate(adv, [0, 1], [p2back[1], p2fwd[1]])],
      p3: clash,
    };
  }
  function wardRoute(idx: number): { p0: Pt; p1: Pt; p2: Pt; p3: Pt } {
    const src = wPos[idx];
    const p1back: Pt = [src[0] - 360, src[1] - 30];
    const p1fwd: Pt = [src[0] - 540, src[1] - 80];
    const p2back: Pt = [clash[0] + 200, clash[1] + 120];
    const p2fwd: Pt = [clash[0] + 120, clash[1] + 30];
    return {
      p0: src,
      p1: [interpolate(adv, [0, 1], [p1back[0], p1fwd[0]]), interpolate(adv, [0, 1], [p1back[1], p1fwd[1]])],
      p2: [interpolate(adv, [0, 1], [p2back[0], p2fwd[0]]), interpolate(adv, [0, 1], [p2back[1], p2fwd[1]])],
      p3: clash,
    };
  }

  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 55%, ${C.bg2} 0%, ${C.bg0} 80%)` }}>
      <AbsoluteFill style={{ transform: `translateX(${camX}px) scale(${camScale})`, transformOrigin: '50% 50%' }}>
        <svg width={WIDTH} height={HEIGHT} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <filter id="turnGlow"><feGaussianBlur stdDeviation="5" /></filter>
          </defs>
          {/* ember routes */}
          {ePos.map((_, i) => {
            const r = emberRoute(i);
            const d = bezPath(r.p0, r.p1, r.p2, r.p3);
            return (
              <g key={`e${i}`}>
                <path d={d} stroke={C.ember} strokeWidth={14} fill="none" opacity={0.2} filter="url(#turnGlow)" />
                <path d={d} stroke={C.ember} strokeWidth={3.5} fill="none" opacity={0.95} />
              </g>
            );
          })}
          {/* ward routes */}
          {wPos.map((_, i) => {
            const r = wardRoute(i);
            const d = bezPath(r.p0, r.p1, r.p2, r.p3);
            return (
              <g key={`w${i}`}>
                <path d={d} stroke={C.ward} strokeWidth={14} fill="none" opacity={0.2} filter="url(#turnGlow)" />
                <path d={d} stroke={C.ward} strokeWidth={3.5} fill="none" opacity={0.95} />
              </g>
            );
          })}

          {/* clash burst marker */}
          <g transform={`translate(${clash[0]} ${clash[1]})`}>
            <circle r={28 + snap * 30} fill={C.emberSoft} opacity={0.18 + snap * 0.3} />
            <circle r={8} fill="#fff" opacity={0.85} />
          </g>

          {/* ember tokens */}
          {ePos.map((p, i) => (
            <HeroToken key={`et${i}`} x={p[0]} y={p[1]} rot={interpolate(frame,[0,168],[0,90+i*30])}
                       color={C.ember} shape="diamond" size={30} />
          ))}
          {wPos.map((p, i) => (
            <HeroToken key={`wt${i}`} x={p[0]} y={p[1]} rot={interpolate(frame,[0,168],[0,-90-i*30])}
                       color={C.ward} shape="hexagon" size={30} />
          ))}
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============================================================
// Beat 5 — Strategy (696-852)
// Split-screen: left frantic mechanical clicks, right map plan resolves.
// Visual hierarchy, no headline text.
// ============================================================

const StrategyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const rng = mulberry32(42);

  const clicks = Array.from({ length: 36 }).map(() => ({
    x: 90 + rng() * 760,
    y: 90 + rng() * 880,
    born: Math.floor(rng() * 150),
    life: 18 + Math.floor(rng() * 14),
  }));

  const splitX = 960;

  // right-side routes that converge into a coherent plan
  type Plan = { color: string; p0: Pt; p1: Pt; p2: Pt; p3: Pt };
  const plans: Plan[] = [
    { color: C.ember, p0: [1080, 240], p1: [1240, 460], p2: [1340, 580], p3: [1440, 700] },
    { color: C.ward,  p0: [1860, 240], p1: [1700, 460], p2: [1600, 580], p3: [1500, 700] },
    { color: C.smoke, p0: [1470, 920], p1: [1470, 820], p2: [1470, 760], p3: [1470, 720] },
  ];
  const planDraw = clamp(interpolate(frame, [8, 104], [0, 1]));
  const planResolve = clamp(interpolate(frame, [68, 124], [0, 1]));

  return (
    <AbsoluteFill style={{ background: C.bg0 }}>
      {/* divider */}
      <div style={{ position: 'absolute', left: splitX - 1, top: 0, bottom: 0, width: 2,
        background: 'rgba(255,255,255,0.06)' }} />

      {/* LEFT — frantic mechanical clicks */}
      <AbsoluteFill style={{ left: 0, width: splitX, background: `linear-gradient(180deg, ${C.bg0}, ${C.bg1})` }}>
        <svg width={splitX} height={HEIGHT} style={{ position: 'absolute', inset: 0 }}>
          {clicks.map((c, i) => {
            const age = frame - c.born;
            if (age < 0 || age > c.life) return null;
            const p = age / c.life;
            const r = interpolate(p, [0, 1], [4, 60]);
            const op = interpolate(p, [0, 0.2, 1], [0, 0.7, 0]);
            return (
              <g key={i}>
                <circle cx={c.x} cy={c.y} r={r} fill="none" stroke={C.emberSoft} strokeWidth={2} opacity={op} />
                <circle cx={c.x} cy={c.y} r={3} fill={C.emberSoft} opacity={op} />
              </g>
            );
          })}
          {/* overloaded mechanical reticle: activity without a literal mouse cursor */}
          {(() => {
            const cx = 420 + Math.sin(frame * 1.7) * 210 + Math.cos(frame * 2.3) * 76;
            const cy = 540 + Math.cos(frame * 1.9) * 240 + Math.sin(frame * 2.9) * 64;
            const spin = frame * 7;
            return (
              <g transform={`translate(${cx} ${cy}) rotate(${spin})`} opacity={0.88}>
                <circle r={58} fill="none" stroke={C.emberSoft} strokeWidth={2} strokeDasharray="10 7" />
                <circle r={20} fill="none" stroke={C.ember} strokeWidth={3} />
                <path d="M -82 0 H -34 M 34 0 H 82 M 0 -82 V -34 M 0 34 V 82" stroke={C.emberSoft} strokeWidth={3} />
                <circle r={5} fill={C.bone} />
              </g>
            );
          })()}
        </svg>
      </AbsoluteFill>

      {/* RIGHT — map plan resolves */}
      <AbsoluteFill style={{ left: splitX, width: WIDTH - splitX, background: `linear-gradient(180deg, ${C.bg1}, ${C.bg0})` }}>
        <svg x={0} y={0} width={WIDTH - splitX} height={HEIGHT} viewBox={`${splitX} 0 ${WIDTH - splitX} ${HEIGHT}`}
             style={{ position: 'absolute', inset: 0 }}>
          {plans.map((p, i) => {
            const d = bezPath(p.p0, p.p1, p.p2, p.p3);
            return (
              <g key={i}>
                <path d={d} stroke={p.color} strokeWidth={10} fill="none" opacity={0.18}
                      strokeDasharray="1" pathLength={1} strokeDashoffset={1 - planDraw} />
                <path d={d} stroke={p.color} strokeWidth={3} fill="none" opacity={0.95}
                      strokeDasharray="1" pathLength={1} strokeDashoffset={1 - planDraw} />
              </g>
            );
          })}
          {/* plan resolves into one unavoidable objective */}
          <g transform={`translate(1470 ${interpolate(planResolve, [0,1],[720,680])})`}>
            <circle r={128 + planResolve * 38} fill={C.ward} opacity={0.13 * planResolve} />
            <circle r={76 + planResolve * 24} fill="none" stroke={C.wardSoft} strokeWidth={4} opacity={0.92 * planResolve} strokeDasharray="10 10" />
            <circle r={34 + planResolve * 16} fill="none" stroke={C.bone} strokeWidth={4} opacity={planResolve} />
            <circle r={10} fill={C.bone} opacity={planResolve} />
            <path d="M -32 0 H 32 M 0 -32 V 32" stroke={C.wardSoft} strokeWidth={3} opacity={planResolve} />
          </g>
          <text x="1470" y="876" textAnchor="middle" fill={C.wardSoft} fontFamily="monospace" fontSize="31" fontWeight="700" letterSpacing="5" opacity={planResolve}>
            OBJECTIVE LOCKED
          </text>
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============================================================
// Beat 6 — Read Map (852-1080)
// Large tactical overview, route scan, risk markers, deliberate
// camera travel.
// ============================================================

const ReadMapScene: React.FC = () => {
  const frame = useCurrentFrame();

  // virtual canvas wider than viewport; pan across
  const VW = 2400;
  const camPan = interpolate(frame, [0, 228], [0, -(VW - WIDTH)], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const scanX = interpolate(frame, [20, 200], [0, VW], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const scanFade = clamp(interpolate(frame, [200, 216], [1, 0]));

  const routes: { color: string; p0: Pt; p1: Pt; p2: Pt; p3: Pt }[] = [
    { color: C.ember, p0: [120, 700], p1: [600, 480], p2: [1100, 620], p3: [1700, 540] },
    { color: C.ward,  p0: [2280, 320], p1: [1800, 520], p2: [1500, 420], p3: [1100, 540] },
    { color: C.smoke, p0: [400, 1000], p1: [900, 820], p2: [1300, 700], p3: [1500, 600] },
  ];

  const markers: { x: number; y: number }[] = [
    { x: 620, y: 540 },
    { x: 1180, y: 600 },
    { x: 1760, y: 480 },
  ];

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.bg0}, ${C.bg1})` }}>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${VW} ${HEIGHT}`} preserveAspectRatio="xMidYMid slice"
           style={{ position: 'absolute', inset: 0, transform: `translateX(${camPan}px)` }}>
        <defs>
          <filter id="rmGlow"><feGaussianBlur stdDeviation="4" /></filter>
          <linearGradient id="scanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={C.wardSoft} stopOpacity="0" />
            <stop offset="50%" stopColor={C.wardSoft} stopOpacity="0.5" />
            <stop offset="100%" stopColor={C.wardSoft} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* faint topographic contour lines (original SVG, no full-screen grid) */}
        {[180, 360, 540, 720, 900].map((y, i) => (
          <path key={i}
                d={`M 0 ${y} C 400 ${y - 40}, 800 ${y + 50}, 1200 ${y} S 2000 ${y - 30}, ${VW} ${y}`}
                fill="none" stroke={C.bone} strokeWidth={1} opacity={0.07} />
        ))}

        {/* routes */}
        {routes.map((r, i) => {
          const d = bezPath(r.p0, r.p1, r.p2, r.p3);
          return (
            <g key={i}>
              <path d={d} stroke={r.color} strokeWidth={12} fill="none" opacity={0.18} filter="url(#rmGlow)" />
              <path d={d} stroke={r.color} strokeWidth={3} fill="none" opacity={0.9} />
            </g>
          );
        })}

        {/* risk markers (small triangle + ring) */}
        {markers.map((m, i) => {
          const op = clamp(interpolate(frame, [30 + i * 20, 50 + i * 20, 200, 216], [0, 1, 1, 0]));
          return (
            <g key={i} transform={`translate(${m.x} ${m.y})`} opacity={op}>
              <circle r={22} fill="none" stroke={C.ember} strokeWidth={1.5} strokeDasharray="3 4" />
              <polygon points="0,-12 11,8 -11,8" fill={C.ember} stroke={C.emberDeep} strokeWidth={1.5} />
              <line x1="0" y1="-4" x2="0" y2="2" stroke={C.ink} strokeWidth={2} />
              <circle cx="0" cy="6" r="1.5" fill={C.ink} />
            </g>
          );
        })}

        {/* scanner sweep */}
        <g opacity={scanFade}>
          <rect x={scanX - 60} y={0} width={120} height={HEIGHT} fill="url(#scanGrad)" />
          <line x1={scanX} y1={0} x2={scanX} y2={HEIGHT} stroke={C.wardSoft} strokeWidth={1.5} opacity={0.8} />
        </g>

        {/* destination citadel hint */}
        <Citadel x={2100} y={560} scale={0.5} rot={0} />
      </svg>

      {/* small off-focal label only */}
      <div style={{ position: 'absolute', left: 80, top: 80, opacity: 0.5,
        color: C.bone, fontFamily: 'monospace', fontSize: 13, letterSpacing: 4 }}>SCAN</div>
    </AbsoluteFill>
  );
};

// ============================================================
// Beat 7 — Assault (1080-1464)
// Citadel cracks, routes converge, orange sparks, final caption.
// ============================================================

const AssaultScene: React.FC = () => {
  const frame = useCurrentFrame();

  // FINAL_CAPTION_FRAME is global (1230); beat starts at 1080 → local 150
  const captionLocal = FINAL_CAPTION_FRAME - 1080;
  const captionOpacity = clamp(interpolate(frame, [captionLocal, captionLocal + 18], [0, 1]));
  const captionHold = frame >= captionLocal + 18;

  // citadel shake before crack
  const shakeAmp = (frame > 60 && frame < captionLocal) ? interpolate(frame, [60, captionLocal], [0, 1]) : 0;
  const shake = Math.sin(frame * 0.9) * 5 * shakeAmp + Math.cos(frame * 1.7) * 3 * shakeAmp;

  // crack progress
  const crack = clamp(interpolate(frame, [captionLocal, captionLocal + 50], [0, 1]));

  // routes converging toward citadel
  type Conv = { color: string; p0: Pt; p1: Pt; p2: Pt; p3: Pt };
  const cx = 960 + shake;
  const cy = 540;
  const routes: Conv[] = [
    { color: C.ember, p0: [120, 200], p1: [500, 400], p2: [760, 480], p3: [cx, cy] },
    { color: C.ward,  p0: [1800, 200], p1: [1420, 400], p2: [1160, 480], p3: [cx, cy] },
    { color: C.smoke, p0: [960, 1020], p1: [960, 860], p2: [960, 700], p3: [cx, cy + 80] },
    { color: C.emberSoft, p0: [240, 880], p1: [560, 760], p2: [780, 660], p3: [cx, cy] },
    { color: C.crystal, p0: [1680, 880], p1: [1360, 760], p2: [1140, 660], p3: [cx, cy] },
  ];
  const routeDraw = clamp(interpolate(frame, [0, 130], [0, 1]));

  // sparks (deterministic)
  const rng = mulberry32(99);
  const sparks = Array.from({ length: 70 }).map(() => ({
    x: cx - 180 + rng() * 360,
    y: cy - 120 + rng() * 240,
    born: Math.floor(rng() * 384),
    life: 22 + Math.floor(rng() * 30),
    vy: -2 - rng() * 4,
    vx: -1 + rng() * 2,
    r: 1.5 + rng() * 2.5,
  }));

  // ember particles drifting (restrained)
  const embers = Array.from({ length: 28 }).map((_, i) => {
    const rng2 = mulberry32(700 + i);
    return {
      x: 100 + rng2() * (WIDTH - 200),
      y0: HEIGHT + 40,
      born: Math.floor(rng2() * 200),
      vy: -0.6 - rng2() * 1.2,
      drift: rng2() * 40 - 20,
      r: 1 + rng2() * 1.8,
    };
  });

  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, ${C.bg2} 0%, ${C.bg0} 82%)` }}>
      <svg width={WIDTH} height={HEIGHT} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <filter id="assaultGlow"><feGaussianBlur stdDeviation="5" /></filter>
          <radialGradient id="bloom" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={C.emberSoft} stopOpacity={0.35} />
            <stop offset="100%" stopColor={C.ember} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* citadel bloom */}
        <circle cx={cx} cy={cy} r={260 + crack * 80} fill="url(#bloom)" opacity={0.7 + crack * 0.3} />

        {/* converging routes */}
        {routes.map((r, i) => {
          const d = bezPath(r.p0, r.p1, r.p2, r.p3);
          return (
            <g key={i}>
              <path d={d} stroke={r.color} strokeWidth={14} fill="none" opacity={0.2} filter="url(#assaultGlow)"
                    strokeDasharray="1" pathLength={1} strokeDashoffset={1 - routeDraw} />
              <path d={d} stroke={r.color} strokeWidth={3} fill="none" opacity={0.95}
                    strokeDasharray="1" pathLength={1} strokeDashoffset={1 - routeDraw} />
            </g>
          );
        })}

        {/* drifting embers */}
        {embers.map((e, i) => {
          const age = frame - e.born;
          if (age < 0) return null;
          const y = e.y0 + e.vy * age;
          const x = e.x + Math.sin(age * 0.05 + i) * e.drift;
          const op = clamp(interpolate(age, [0, 30, 200, 260], [0, 0.7, 0.7, 0]));
          return <circle key={`em${i}`} cx={x} cy={y} r={e.r} fill={C.emberSoft} opacity={op} />;
        })}

        {/* sparks (only after crack begins) */}
        {sparks.map((s, i) => {
          const age = frame - s.born;
          if (age < 0 || age > s.life) return null;
          const p = age / s.life;
          const x = s.x + s.vx * age;
          const y = s.y + s.vy * age - p * p * 30;
          const op = interpolate(p, [0, 0.2, 1], [0, 1, 0]);
          return (
            <g key={`sp${i}`} opacity={op}>
              <circle cx={x} cy={y} r={s.r} fill={C.emberSoft} />
              <circle cx={x} cy={y} r={s.r * 2.4} fill={C.ember} opacity={0.3} />
            </g>
          );
        })}

        {/* citadel with cracks */}
        <Citadel x={cx} y={cy} scale={1.1 + crack * 0.04} rot={shake * 0.3} crack={crack} />
      </svg>

      {/* final line remains part of the battlefield, not a separate end card */}
      {(captionOpacity > 0 || captionHold) && (
        <div style={{
          position: 'absolute', top: 102, left: 104, width: 620, opacity: captionOpacity,
          transform: `translateY(${interpolate(captionOpacity, [0, 1], [-20, 0])}px) rotate(-2deg)`,
          color: C.bone, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 54, fontWeight: 700,
          lineHeight: 0.94, letterSpacing: 3, textShadow: '0 4px 20px rgba(0,0,0,0.95)',
        }}>
          <div>NO VICTORY</div>
          <div style={{ color: C.emberSoft }}>IS FREE.</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ============================================================
// Composition root — sequences + narration audio + grain overlay
// ============================================================

export const DotaChronicle: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg0 }}>
      {/* narration plays across the full composition via Remotion Audio */}
      <Audio src={staticFile('dota-narration.wav')} />

      {BEATS.map((beat, i) => (
        <Sequence
          key={beat.id}
          from={beat.start}
          durationInFrames={beat.durationInFrames}
          name={`${i + 1}. ${beat.label}`}
        >
          {beat.id === 'draft'    && <DraftScene />}
          {beat.id === 'lanes'    && <LanesScene />}
          {beat.id === 'vision'   && <VisionScene />}
          {beat.id === 'turn'     && <TurnScene />}
          {beat.id === 'strategy' && <StrategyScene />}
          {beat.id === 'readmap'  && <ReadMapScene />}
          {beat.id === 'assault'  && <AssaultScene />}
        </Sequence>
      ))}

      {/* understated grain texture over the whole composition */}
      <GrainLayer opacity={0.06} />
    </AbsoluteFill>
  );
};
