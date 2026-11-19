import React from 'react';
import { C, FONT, MONO } from '../theme';
import type { Hl } from '../bst';

export const NODE_STYLE: Record<Hl | 'base', { fill: string; text: string; ring?: string; glow?: string; op?: number }> = {
  base: { fill: C.green, text: '#fff' },
  cur: { fill: C.orange, text: C.ink, ring: '#fff', glow: C.orange },
  visit: { fill: C.greenLight, text: '#fff' },
  found: { fill: '#1F8A4C', text: '#fff', ring: '#fff', glow: '#1F8A4C' },
  new: { fill: C.orange, text: C.ink, glow: C.orange },
  del: { fill: C.red, text: '#fff', glow: C.red },
  succ: { fill: C.blue, text: '#fff', glow: C.blue },
  dim: { fill: '#D2DAE5', text: '#fff', op: 0.45 },
  done: { fill: C.navy, text: '#fff' },
};

export const Defs: React.FC = () => (
  <defs>
    <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="9" result="b" />
      <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M32 0H0V32" fill="none" stroke={C.grid} strokeWidth="1.2" />
    </pattern>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill={C.orange} />
    </marker>
  </defs>
);

export const Bg: React.FC<{ w: number; h: number }> = ({ w, h }) => (
  <>
    <rect width={w} height={h} fill="#F8FAFC" />
    <rect width={w} height={h} fill="url(#grid)" />
  </>
);

export const NodeCircle: React.FC<{
  x: number; y: number; r: number; label: string; hl?: Hl; opacity?: number; scale?: number; num?: number;
}> = ({ x, y, r, label, hl, opacity = 1, scale = 1, num }) => {
  const s = NODE_STYLE[hl ?? 'base'];
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity * (s.op ?? 1)}>
      {s.glow && <circle r={r * 1.15} fill={s.glow} opacity={0.45} filter="url(#glow)" />}
      <circle r={r} fill={s.fill} stroke={s.ring ?? 'rgba(0,0,0,.18)'} strokeWidth={s.ring ? 4 : 2} />
      <text textAnchor="middle" dy="0.35em" fontFamily={FONT} fontWeight={800} fontSize={r * 0.78} fill={s.text}>{label}</text>
      {num !== undefined && (
        <g transform={`translate(${r * 0.78},${-r * 0.78})`}>
          <circle r={r * 0.42} fill={C.orange} stroke="#fff" strokeWidth={2.5} />
          <text textAnchor="middle" dy="0.36em" fontFamily={FONT} fontWeight={800} fontSize={r * 0.45} fill={C.ink}>{num}</text>
        </g>
      )}
    </g>
  );
};

export const CodePanel: React.FC<{
  lines: string[]; active?: number; x: number; y: number; w: number; title?: string; fontSize?: number;
}> = ({ lines, active, x, y, w, title = 'Python', fontSize = 17 }) => {
  const lh = fontSize * 1.65;
  const h = lines.length * lh + 64;
  return (
    <g transform={`translate(${x},${y})`}>
      <rect width={w} height={h} rx={14} fill="#0D1626" />
      <rect width={w} height={36} rx={14} fill="#15223A" />
      <rect y={22} width={w} height={14} fill="#15223A" />
      {[0, 1, 2].map((i) => <circle key={i} cx={22 + i * 20} cy={18} r={6} fill={[C.red, C.orange, C.greenLight][i]} />)}
      <text x={w - 16} y={23} textAnchor="end" fontFamily={MONO} fontSize={13} fill="#9DB0C9">{title}</text>
      {lines.map((ln, i) => (
        <g key={i} transform={`translate(0,${50 + i * lh})`}>
          {i === active && <rect x={6} y={-2} width={w - 12} height={lh} rx={6} fill={C.orange} opacity={0.25} stroke={C.orange} strokeWidth={1.5} />}
          {i === active && <path d={`M10 ${lh / 2 - 6} l9 6 l-9 6 z`} fill={C.orange} />}
          <text x={26} y={lh * 0.68} fontFamily={MONO} fontSize={fontSize} fill={i === active ? '#FFEDE7' : '#E6EDF7'} xmlSpace="preserve">
            {ln}
          </text>
        </g>
      ))}
    </g>
  );
};

// Maior fonte (28 → 18) em que o texto cabe na caixa de 74px de altura
const captionSize = (text: string, w: number) => {
  for (let fs = 28; fs > 18; fs--) {
    const perLine = Math.floor((w - 40) / (fs * 0.56));
    const lines = Math.ceil(text.length / perLine);
    if (lines * fs * 1.18 <= 68) return fs;
  }
  return 18;
};

export const Caption: React.FC<{ text: string; x: number; y: number; w: number; opacity?: number }> = ({ text, x, y, w, opacity = 1 }) => (
  <g transform={`translate(${x},${y})`} opacity={opacity}>
    <rect width={w} height={74} rx={12} fill="#fff" stroke={C.green} strokeWidth={2} />
    <rect width={10} height={74} rx={5} fill={C.orange} />
    <foreignObject x={22} y={0} width={w - 34} height={74}>
      <div style={{ height: 74, display: 'flex', alignItems: 'center', fontFamily: FONT, fontSize: captionSize(text, w), fontWeight: 600, color: C.ink, lineHeight: 1.15 }}>{text}</div>
    </foreignObject>
  </g>
);

export const Title: React.FC<{ text: string; x?: number; y?: number }> = ({ text, x = 40, y = 52 }) => (
  <text x={x} y={y} fontFamily={FONT} fontWeight={800} fontSize={34} fill={C.green}>{text}</text>
);
