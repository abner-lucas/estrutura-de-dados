import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { layout, type Step, type Slot } from '../bst';
import { C, FONT, MONO, W, H } from '../theme';
import { Bg, Caption, CodePanel, Defs, NodeCircle, Title } from './parts';

export interface StepSceneProps {
  steps: Step[];
  code?: string[];
  codeTitle?: string;
  title?: string;
  stepFrames?: number;
}

export const STEP_FRAMES = 54;
export const stepDuration = (steps: Step[], f = STEP_FRAMES) => Math.max(1, steps.length) * f + 30;

type P = { x: number; y: number };

// Converte o layout normalizado em pixels dentro de uma caixa
function place(tree: number[], box: { x: number; y: number; w: number; h: number }) {
  const L = layout(tree);
  const gap = Math.min(110, box.h / Math.max(1, L.depth + 0.6));
  const spread = Math.min(box.w, Math.max(260, L.count * 92));
  const left = box.x + (box.w - spread) / 2;
  const pos: Record<number, P> = {};
  for (const [k, p] of Object.entries(L.pos)) pos[+k] = { x: left + p.x * spread, y: box.y + p.y * gap };
  const r = Math.max(22, Math.min(34, (spread / Math.max(1, L.count)) * 0.36));
  return { pos, edges: L.edges, gap, r, dx: Math.max(46, spread / Math.max(2, L.count) * 0.9) };
}

function slotPos(pl: ReturnType<typeof place>, s: Slot): P | undefined {
  const p = pl.pos[s.parent];
  if (!p) return undefined;
  return { x: p.x + (s.side === 'L' ? -pl.dx : pl.dx), y: p.y + pl.gap };
}

function ghostPos(pl: ReturnType<typeof place>, g: NonNullable<Step['ghost']>, box: { x: number; y: number; w: number }): P {
  if (g.slot) return slotPos(pl, g.slot) ?? { x: box.x + box.w / 2, y: box.y };
  if (g.near !== undefined && pl.pos[g.near]) {
    const p = pl.pos[g.near];
    return { x: p.x + 70, y: p.y - 46 };
  }
  const root = Object.values(pl.pos)[0];
  return { x: (root?.x ?? box.x + box.w / 2) + 120, y: box.y - 4 };
}

const lerp = (a: P, b: P, t: number): P => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

export const StepScene: React.FC<StepSceneProps> = ({ steps, code, codeTitle, title, stepFrames = STEP_FRAMES }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = steps.length;
  const i = Math.min(n - 1, Math.floor(frame / stepFrames));
  const local = frame - i * stepFrames;
  const t = i === 0 ? 1 : spring({ frame: local, fps, config: { damping: 200 }, durationInFrames: 22 });
  const pop = i === 0 ? 0 : Math.sin(Math.min(1, local / 16) * Math.PI);
  const cur = steps[i];
  const prev = steps[Math.max(0, i - 1)];

  const hasOut = steps.some((s) => s.out);
  const top = title ? 110 : 70;
  const box = code
    ? { x: 40, y: top, w: 700, h: (hasOut ? 400 : 470) - (top - 70) }
    : { x: 80, y: top, w: W - 160, h: (hasOut ? 400 : 470) - (top - 70) };

  const A = place(prev.tree, box);
  const B = place(cur.tree, box);
  const all = Array.from(new Set([...prev.tree, ...cur.tree]));
  const posOf = (v: number): P => lerp(A.pos[v] ?? B.pos[v], B.pos[v] ?? A.pos[v], t);
  const r = A.r + (B.r - A.r) * t;

  const edgeKeys = new Map<string, [number, number, number]>();
  A.edges.forEach(([a, b]) => edgeKeys.set(`${a}-${b}`, [a, b, 1 - t]));
  B.edges.forEach(([a, b]) => {
    const k = `${a}-${b}`;
    edgeKeys.set(k, [a, b, edgeKeys.has(k) ? 1 : t]);
  });
  const hot = new Set(cur.edges ?? []);

  const g0 = prev.ghost ? ghostPos(A, prev.ghost, box) : undefined;
  const g1 = cur.ghost ? ghostPos(B, cur.ghost, box) : undefined;
  const none = cur.none ? slotPos(B, cur.none) : undefined;

  const capIn = interpolate(local, [0, 10], [0.2, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
        <Defs />
        <Bg w={W} h={H} />
        {title && <Title text={title} />}
        {[...edgeKeys.values()].map(([a, b, op]) => {
          const pa = posOf(a), pb = posOf(b);
          const isHot = hot.has(`${a}-${b}`);
          return (
            <line key={`${a}-${b}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
              stroke={isHot ? C.orange : '#6B7A8F'} strokeWidth={isHot ? 7 : 3.5} strokeLinecap="round" opacity={op}
              strokeDasharray={isHot ? undefined : undefined} />
          );
        })}
        {none && (
          <g opacity={t}>
            <line x1={B.pos[cur.none!.parent].x} y1={B.pos[cur.none!.parent].y} x2={none.x} y2={none.y} stroke={C.orange} strokeWidth={3} strokeDasharray="8 7" />
            <rect x={none.x - 38} y={none.y - 20} width={76} height={40} rx={8} fill="#FFEDE7" stroke={C.orange} strokeWidth={3} strokeDasharray="7 5" />
            <text x={none.x} y={none.y} dy="0.35em" textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={18} fill="#B23A1C">None</text>
          </g>
        )}
        {all.map((v) => {
          const inA = prev.tree.includes(v), inB = cur.tree.includes(v);
          const op = inA && inB ? 1 : inB ? t : 1 - t;
          const changed = (prev.hl?.[v] ?? '') !== (cur.hl?.[v] ?? '');
          const p = posOf(v);
          return (
            <NodeCircle key={v} x={p.x} y={p.y} r={r} label={cur.labels?.[v] ?? String(v)}
              hl={cur.hl?.[v]} opacity={op} scale={1 + (changed ? 0.16 * pop : 0)} num={cur.nums?.[v]} />
          );
        })}
        {(g1 || (g0 && !cur.tree.includes(prev.ghost!.v))) && (() => {
          const gv = (cur.ghost ?? prev.ghost)!.v;
          const p = g1 && g0 ? lerp(g0, g1, t) : (g1 ?? g0)!;
          const op = g1 ? (g0 ? 1 : t) : 1 - t;
          return <NodeCircle x={p.x} y={p.y} r={r} label={String(gv)} hl="new" opacity={op} scale={1 + 0.08 * Math.sin(frame / 6)} />;
        })()}
        {hasOut && (
          <g transform={`translate(${box.x}, ${box.y + box.h + 18})`}>
            <text x={0} y={-8} fontFamily={FONT} fontWeight={700} fontSize={16} fill={C.green}>SAÍDA</text>
            {(cur.out ?? []).map((v, k) => {
              const isNew = k === (cur.out!.length - 1) && (prev.out?.length ?? 0) < cur.out!.length;
              return (
                <g key={k} transform={`translate(${k * 66}, ${isNew ? (1 - t) * -40 : 0})`} opacity={isNew ? t : 1}>
                  <rect width={60} height={46} rx={8} fill={isNew ? C.orange : '#fff'} stroke={C.green} strokeWidth={2.5} />
                  <text x={30} y={23} dy="0.35em" textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={22} fill={C.ink}>{v}</text>
                </g>
              );
            })}
          </g>
        )}
        {code && <CodePanel lines={code} active={cur.code} x={745} y={top - 10} w={505} title={codeTitle} fontSize={code.length > 10 ? 15.5 : 18} />}
        <Caption text={cur.caption} x={40} y={H - 92} w={W - 80} opacity={capIn} />
        <g transform={`translate(${W - 40}, ${H - 108})`}>
          <text textAnchor="end" fontFamily={FONT} fontWeight={700} fontSize={14} fill={C.green}>PASSO {i + 1}/{n}</text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
