import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  BEATS,
  FINAL_CAPTION_FRAME,
  HEIGHT,
  WIDTH,
} from './timeline';

const C = {
  ink: '#071014',
  bone: '#ebe2d1',
  ember: '#e06b35',
  emberSoft: '#ffc06a',
  ward: '#72d4a2',
  wardSoft: '#b6e9c8',
  smoke: '#75bdb2',
};

const matte = (name: string) => staticFile(`assets/mattes/${name}`);

const clamp = (value: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, value));

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

type BackdropProps = {
  file: string;
  frame: number;
  duration: number;
  zoomFrom?: number;
  zoomTo?: number;
  xFrom?: number;
  xTo?: number;
  yFrom?: number;
  yTo?: number;
  position?: string;
  brightness?: number;
};

const MatteBackdrop: React.FC<BackdropProps> = ({
  file,
  frame,
  duration,
  zoomFrom = 1.03,
  zoomTo = 1.1,
  xFrom = 0,
  xTo = 0,
  yFrom = 0,
  yTo = 0,
  position = '50% 50%',
  brightness = 0.86,
}) => {
  const progress = clamp(interpolate(frame, [0, duration], [0, 1]));
  const zoom = interpolate(progress, [0, 1], [zoomFrom, zoomTo]);
  const x = interpolate(progress, [0, 1], [xFrom, xTo]);
  const y = interpolate(progress, [0, 1], [yFrom, yTo]);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: C.ink }}>
      <Img
        src={matte(file)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: position,
          transform: `scale(${zoom}) translate(${x}px, ${y}px)`,
          transformOrigin: '50% 50%',
          filter: `saturate(0.78) contrast(1.08) brightness(${brightness})`,
        }}
      />
      <AbsoluteFill style={{
        background: 'radial-gradient(ellipse at center, transparent 36%, rgba(3,8,10,0.36) 100%)',
        pointerEvents: 'none',
      }} />
      <AbsoluteFill style={{
        background: 'linear-gradient(90deg, rgba(4,9,11,0.18), transparent 18%, transparent 82%, rgba(4,9,11,0.18))',
        pointerEvents: 'none',
      }} />
    </AbsoluteFill>
  );
};

const FogBank: React.FC<{
  frame: number;
  duration: number;
  from: 'left' | 'right';
  opacity?: number;
}> = ({ frame, duration, from, opacity = 0.22 }) => {
  const travel = interpolate(frame, [0, duration], [from === 'left' ? -18 : 18, from === 'left' ? 18 : -18]);
  return (
    <div style={{
      position: 'absolute',
      top: '18%',
      bottom: '4%',
      width: '62%',
      [from]: '-22%',
      opacity,
      transform: `translateX(${travel}%)`,
      background: 'radial-gradient(ellipse at center, rgba(147,207,193,0.36), rgba(62,122,119,0.15) 42%, transparent 73%)',
      filter: 'blur(30px)',
      mixBlendMode: 'screen',
      pointerEvents: 'none',
    }} />
  );
};

const LightSweep: React.FC<{
  frame: number;
  duration: number;
  color?: string;
  opacity?: number;
}> = ({ frame, duration, color = C.wardSoft, opacity = 0.2 }) => {
  const x = interpolate(frame, [0, duration], [-30, 108]);
  return (
    <div style={{
      position: 'absolute',
      top: '-10%',
      left: `${x}%`,
      width: '12%',
      height: '125%',
      transform: 'skewX(-18deg)',
      background: `linear-gradient(90deg, transparent, ${color}44, transparent)`,
      opacity,
      filter: 'blur(18px)',
      mixBlendMode: 'screen',
      pointerEvents: 'none',
    }} />
  );
};

const Embers: React.FC<{
  frame: number;
  amount?: number;
  color?: string;
  opacity?: number;
}> = ({ frame, amount = 20, color = C.emberSoft, opacity = 0.56 }) => {
  const rand = mulberry32(917);
  const points = Array.from({ length: amount }, (_, index) => ({
    x: rand() * WIDTH,
    y: HEIGHT * (0.55 + rand() * 0.48),
    speed: 0.35 + rand() * 1.2,
    drift: rand() * 1.2 - 0.6,
    size: 1 + rand() * 2,
    phase: rand() * Math.PI * 2,
    index,
  }));

  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {points.map((point) => {
        const age = frame * point.speed + point.phase * 8;
        const y = point.y - (age % 280) * 1.05;
        const x = point.x + Math.sin(age * 0.06 + point.phase) * 36 * point.drift;
        const localOpacity = opacity * (0.35 + 0.65 * Math.sin(age * 0.08) ** 2);
        return <circle key={point.index} cx={x} cy={y} r={point.size} fill={color} opacity={localOpacity} />;
      })}
    </svg>
  );
};

const TraceRoutes: React.FC<{
  frame: number;
  paths: string[];
  color?: string;
  opacity?: number;
  width?: number;
}> = ({ frame, paths, color = C.emberSoft, opacity = 0.38, width = 2 }) => {
  const reveal = clamp(interpolate(frame, [8, 112], [0, 1]));
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <filter id="route-soft"><feGaussianBlur stdDeviation="3" /></filter>
      {paths.map((path, index) => (
        <g key={path} opacity={opacity * (0.72 + index * 0.08)}>
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={width * 4}
            opacity={0.16}
            filter="url(#route-soft)"
            strokeDasharray="1"
            pathLength={1}
            strokeDashoffset={1 - reveal}
          />
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={width}
            strokeLinecap="round"
            strokeDasharray="1"
            pathLength={1}
            strokeDashoffset={1 - reveal}
          />
        </g>
      ))}
    </svg>
  );
};

const Caption: React.FC<{
  children: React.ReactNode;
  opacity: number;
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  color?: string;
  size?: number;
  align?: 'left' | 'right' | 'center';
}> = ({ children, opacity, left, right, top, bottom, color = C.bone, size = 34, align = 'left' }) => (
  <div style={{
    position: 'absolute', left, right, top, bottom,
    opacity,
    color,
    fontFamily: 'Georgia, Times New Roman, serif',
    fontSize: size,
    fontWeight: 600,
    lineHeight: 1.05,
    letterSpacing: 4,
    textAlign: align,
    textShadow: '0 3px 16px rgba(0,0,0,0.9)',
  }}>
    {children}
  </div>
);

const DraftScene: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = clamp(interpolate(frame, [24, 46, 154, 182], [0, 1, 1, 0]));
  return (
    <AbsoluteFill>
      <MatteBackdrop file="strategy.png" frame={frame} duration={192} zoomFrom={1.02} zoomTo={1.11} xFrom={-5} xTo={4} yFrom={5} yTo={-4} brightness={0.9} />
      <TraceRoutes frame={frame} color="#d6a365" opacity={0.28} width={1.4} paths={[
        'M 250 800 C 520 640, 700 720, 950 560 S 1380 440, 1580 380',
        'M 360 260 C 620 360, 740 470, 1030 560 S 1400 650, 1690 710',
      ]} />
      <FogBank frame={frame} duration={192} from="right" opacity={0.1} />
      <Caption opacity={fade} left={104} bottom={100} size={40}>SETIAP PILIHAN</Caption>
    </AbsoluteFill>
  );
};

const LanesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const copy = clamp(interpolate(frame, [18, 34, 72, 94], [0, 1, 1, 0]));
  return (
    <AbsoluteFill>
      <MatteBackdrop file="lanes.png" frame={frame} duration={120} zoomFrom={1.01} zoomTo={1.1} yFrom={3} yTo={-4} brightness={0.86} />
      <TraceRoutes frame={frame} color={C.emberSoft} opacity={0.3} paths={[
        'M -20 760 C 380 620, 620 670, 970 570',
        'M 1940 430 C 1500 440, 1270 520, 1030 570',
        'M 1120 1100 C 1110 820, 1060 650, 1010 570',
      ]} />
      <LightSweep frame={frame} duration={120} color={C.wardSoft} opacity={0.18} />
      <Caption opacity={copy} left={106} top={92} size={34}>
        <div>LIMA HERO</div>
        <div style={{ color: C.emberSoft, marginTop: 5 }}>SATU ANCIENT</div>
      </Caption>
    </AbsoluteFill>
  );
};

const VisionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = spring({ frame: frame - 48, fps: useVideoConfig().fps, config: { damping: 18, stiffness: 65, mass: 1 } });
  const label = clamp(interpolate(frame, [54, 76, 172, 204], [0, 1, 1, 0]));
  const radius = 180 + pulse * 260;
  return (
    <AbsoluteFill>
      <MatteBackdrop file="vision.png" frame={frame} duration={216} zoomFrom={1.04} zoomTo={1.11} xFrom={-4} xTo={3} position="49% 51%" brightness={0.8} />
      <svg width={WIDTH} height={HEIGHT} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <circle cx={830} cy={508} r={radius} fill="none" stroke={C.wardSoft} strokeWidth={1.3} opacity={0.22 * clamp(pulse)} strokeDasharray="7 12" />
        <path d="M 830 508 C 1110 430, 1370 430, 1830 570" fill="none" stroke={C.wardSoft} strokeWidth={2} opacity={0.34 * label} />
      </svg>
      <FogBank frame={frame} duration={216} from="right" opacity={0.2} />
      <LightSweep frame={frame} duration={216} color={C.wardSoft} opacity={0.15} />
      <Caption opacity={label} right={118} top={124} size={29} align="right" color={C.wardSoft}>VISION MENEMUKAN CELAH</Caption>
    </AbsoluteFill>
  );
};

const TurnScene: React.FC = () => {
  const frame = useCurrentFrame();
  const burst = clamp(interpolate(frame, [58, 94, 132], [0, 1, 0]));
  return (
    <AbsoluteFill>
      <MatteBackdrop file="turn.png" frame={frame} duration={168} zoomFrom={1.02} zoomTo={1.18} xFrom={2} xTo={-5} yFrom={4} yTo={-3} brightness={0.84} />
      <svg width={WIDTH} height={HEIGHT} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen' }}>
        <radialGradient id="turn-burst"><stop stopColor={C.emberSoft} stopOpacity="0.55" /><stop offset="1" stopColor={C.ember} stopOpacity="0" /></radialGradient>
        <circle cx={1015} cy={555} r={80 + burst * 260} fill="url(#turn-burst)" opacity={burst * 0.52} />
      </svg>
      <Embers frame={frame} amount={26} opacity={0.42} />
      <FogBank frame={frame} duration={168} from="left" opacity={0.12} />
    </AbsoluteFill>
  );
};

const StrategyScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <MatteBackdrop file="strategy.png" frame={frame} duration={156} zoomFrom={1.08} zoomTo={1.19} xFrom={7} xTo={-6} yFrom={0} yTo={-5} position="52% 52%" brightness={0.86} />
      <LightSweep frame={frame} duration={156} color={C.wardSoft} opacity={0.11} />
      <FogBank frame={frame} duration={156} from="left" opacity={0.07} />
    </AbsoluteFill>
  );
};

const ReadMapScene: React.FC = () => {
  const frame = useCurrentFrame();
  const scan = interpolate(frame, [20, 204], [-10, 110]);
  const scanOpacity = clamp(interpolate(frame, [20, 42, 190, 216], [0, 0.42, 0.42, 0]));
  return (
    <AbsoluteFill>
      <MatteBackdrop file="readmap.png" frame={frame} duration={228} zoomFrom={1.02} zoomTo={1.11} xFrom={-8} xTo={7} yFrom={5} yTo={-3} brightness={0.83} />
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: `${scan}%`, width: '11%', opacity: scanOpacity,
        background: `linear-gradient(90deg, transparent, ${C.wardSoft}44, transparent)`,
        filter: 'blur(14px)', mixBlendMode: 'screen', pointerEvents: 'none',
      }} />
      <LightSweep frame={frame} duration={228} color={C.wardSoft} opacity={0.12} />
      <Caption opacity={0.54} left={104} top={94} size={25} color={C.wardSoft}>BACA PETA. BACA RISIKO.</Caption>
    </AbsoluteFill>
  );
};

const AssaultScene: React.FC = () => {
  const frame = useCurrentFrame();
  const captionLocal = FINAL_CAPTION_FRAME - 1080;
  const caption = clamp(interpolate(frame, [captionLocal, captionLocal + 18], [0, 1]));
  const impact = clamp(interpolate(frame, [84, 154, 220], [0, 1, 0.62]));
  return (
    <AbsoluteFill>
      <MatteBackdrop file="assault.png" frame={frame} duration={384} zoomFrom={1.01} zoomTo={1.08} xFrom={-3} xTo={3} yFrom={1} yTo={-2} position="50% 50%" brightness={0.84} />
      <svg width={WIDTH} height={HEIGHT} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen' }}>
        <radialGradient id="impact-glow"><stop stopColor={C.emberSoft} stopOpacity="0.56" /><stop offset="0.48" stopColor={C.ember} stopOpacity="0.18" /><stop offset="1" stopColor={C.ember} stopOpacity="0" /></radialGradient>
        <circle cx={1220} cy={528} r={160 + impact * 240} fill="url(#impact-glow)" opacity={impact * 0.74} />
      </svg>
      <FogBank frame={frame} duration={384} from="right" opacity={0.14} />
      <Embers frame={frame} amount={36} opacity={0.58} />
      <Caption opacity={caption} left={106} top={154} size={57}>
        <div>NO VICTORY</div>
        <div style={{ color: C.emberSoft, marginTop: 8 }}>IS FREE.</div>
      </Caption>
    </AbsoluteFill>
  );
};

const GrainLayer: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: 'none', opacity: 0.045, mixBlendMode: 'overlay' }}>
    <svg width={WIDTH} height={HEIGHT} style={{ width: '100%', height: '100%' }}>
      <filter id="grain-filter">
        <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain-filter)" />
    </svg>
  </AbsoluteFill>
);

export const DotaChronicle: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.ink }}>
    <Audio src={staticFile('dota-narration.wav')} />
    {BEATS.map((beat, index) => (
      <Sequence key={beat.id} from={beat.start} durationInFrames={beat.durationInFrames} name={`${index + 1}. ${beat.label}`}>
        {beat.id === 'draft' && <DraftScene />}
        {beat.id === 'lanes' && <LanesScene />}
        {beat.id === 'vision' && <VisionScene />}
        {beat.id === 'turn' && <TurnScene />}
        {beat.id === 'strategy' && <StrategyScene />}
        {beat.id === 'readmap' && <ReadMapScene />}
        {beat.id === 'assault' && <AssaultScene />}
      </Sequence>
    ))}
    <GrainLayer />
  </AbsoluteFill>
);
