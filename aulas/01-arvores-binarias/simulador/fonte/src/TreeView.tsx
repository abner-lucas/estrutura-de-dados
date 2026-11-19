import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Id, Pending, Side, Slot, Tree } from './tracer';

export interface Pos { x: number; y: number }
const W = 1000;
const H = 520;
const R = 25;

export const slotKey = (s: Slot) => `${s.parent ?? 'r'}-${s.side ?? ''}`;

interface Layout {
  pos: Record<Id, Pos>;
  edges: { p: Id; c: Id; side: Side; pending: boolean }[];
  slots: Slot[];
  root: Id | null;
  spacing: number;
  gap: number;
  top: number;
}

// Posição em-ordem: x = ordem crescente, y = profundidade. O nó pendente (criado
// mas ainda não ligado) já aparece na vaga onde vai ficar.
function layoutTree(t: Tree, pending?: Pending): Layout {
  const child = (id: Id, s: Side): Id | null => {
    const v = t.nodes[id][s];
    if (v !== null) return v;
    if (pending && pending.parent === id && pending.side === s) return pending.id;
    return null;
  };
  const root = t.root ?? (pending && pending.parent === null ? pending.id : null);
  const order: { id: Id; d: number }[] = [];
  const edges: Layout['edges'] = [];
  const slots: Slot[] = [];
  let depth = 0;
  const walk = (id: Id | null, d: number) => {
    if (id === null) return;
    depth = Math.max(depth, d);
    const l = child(id, 'esq');
    const r = child(id, 'dir');
    walk(l, d + 1);
    order.push({ id, d });
    walk(r, d + 1);
    for (const [s, c] of [['esq', l], ['dir', r]] as const) {
      if (c !== null) edges.push({ p: id, c, side: s, pending: t.nodes[id][s] === null });
      else slots.push({ parent: id, side: s });
    }
  };
  walk(root, 0);
  if (root === null) slots.push({ parent: null, side: null });
  const top = 64;
  const spacing = Math.min(100, (W - 80) / Math.max(1, order.length));
  const gap = Math.min(96, (H - top - 40) / (depth + 1));
  const left = (W - spacing * order.length) / 2;
  const pos: Record<Id, Pos> = {};
  order.forEach((o, i) => { pos[o.id] = { x: left + (i + 0.5) * spacing, y: top + o.d * gap }; });
  return { pos, edges, slots, root, spacing, gap, top };
}

// Interpola suavemente as posições quando a árvore muda
function useTween(target: Record<string, Pos>, ms: number) {
  const [cur, setCur] = useState(target);
  const curRef = useRef(target);
  const sig = JSON.stringify(target);
  useEffect(() => {
    const from = curRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = ms <= 0 ? 1 : Math.min(1, (now - start) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      const next: Record<string, Pos> = {};
      for (const key of Object.keys(target)) {
        const a = from[key] ?? target[key];
        const b = target[key];
        next[key] = { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e };
      }
      curRef.current = next;
      setCur(next);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, ms]);
  // chaves que acabaram de surgir ainda não passaram pela animação: usam o destino direto
  const out: Record<string, Pos> = {};
  for (const key of Object.keys(target)) out[key] = cur[key] ?? target[key];
  return out;
}

export interface Mark { type: 'node' | 'slot'; id: string; nonce: number }

export interface TreeViewProps {
  tree: Tree;
  pending?: Pending;
  flash?: { parent: Id | null; side: Side | null; child: Id | null; same: boolean };
  flashKey?: number;
  focus?: Id | null;
  stack?: Id[];
  noneSlot?: Slot | null;
  token?: { valor: number; at: Id | null; slot: Slot | null; busca: boolean };
  done?: Id[];
  appended?: Id;
  found?: Id | null;
  badges?: Record<Id, number>;
  onPickNode?: (id: Id) => void;
  onPickSlot?: (s: Slot) => void;
  onlySlots?: Slot[];
  wrong?: Mark | null;
  reveal?: Mark | null;
  tweenMs?: number;
  rootLabel?: string;
  emptyText?: string;
}

export function TreeView(p: TreeViewProps) {
  const lay = useMemo(() => layoutTree(p.tree, p.pending), [p.tree, p.pending]);
  const targets: Record<string, Pos> = {};
  for (const [id, pos] of Object.entries(lay.pos)) targets['n' + id] = pos;
  const slotOf = (s: Slot, P: (id: Id) => Pos): Pos => {
    if (s.parent === null) return { x: W / 2, y: lay.top };
    const pp = P(s.parent);
    return { x: pp.x + (s.side === 'esq' ? -1 : 1) * Math.max(lay.spacing * 0.5, 34), y: pp.y + lay.gap };
  };
  const rawP = (id: Id) => lay.pos[id];
  if (p.token) {
    const base = p.token.at !== null && lay.pos[p.token.at] ? lay.pos[p.token.at] : p.token.slot ? slotOf(p.token.slot, rawP) : null;
    if (base) targets.token = { x: base.x + 58, y: base.y - 30 };
  }
  // enquadramento: o "zoom" acompanha o tamanho da árvore (e também é animado)
  const pts: Pos[] = [...Object.values(lay.pos), ...lay.slots.map((s) => slotOf(s, rawP))];
  if (targets.token) pts.push(targets.token);
  const xs = pts.map((q) => q.x), ys = pts.map((q) => q.y);
  let x0 = Math.min(...xs) - 70, x1 = Math.max(...xs) + 80;
  const y0 = Math.min(...ys) - 72;
  let y1 = Math.max(...ys) + 48;
  if (x1 - x0 < 560) { const c = (x0 + x1) / 2; x0 = c - 280; x1 = c + 280; }
  if (y1 - y0 < 300) y1 = y0 + 300;
  targets.vb0 = { x: x0, y: y0 };
  targets.vb1 = { x: x1 - x0, y: y1 - y0 };
  const cur = useTween(targets, p.tweenMs ?? 520);
  const P = (id: Id): Pos => cur['n' + id] ?? lay.pos[id];

  const stackIdx: Record<Id, number> = {};
  (p.stack ?? []).forEach((id, i) => { stackIdx[id] = i + 1; });
  const done = new Set(p.done ?? []);
  const slots = p.onPickSlot ? (p.onlySlots ?? lay.slots) : [];
  const pendingAtNone = p.noneSlot && p.pending && p.pending.parent === p.noneSlot.parent && p.pending.side === p.noneSlot.side;
  const rootId = lay.root;

  const cut = (a: Pos, b: Pos) => {
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
    return { x1: a.x + (dx / d) * R, y1: a.y + (dy / d) * R, x2: b.x - (dx / d) * (R + 2), y2: b.y - (dy / d) * (R + 2) };
  };

  return (
    <svg className="tree" viewBox={`${cur.vb0.x} ${cur.vb0.y} ${cur.vb1.x} ${cur.vb1.y}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#6B7A8F" />
        </marker>
        <marker id="arO" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#FF6A45" />
        </marker>
      </defs>

      {/* ponteiro raiz_completa */}
      {rootId !== null ? (() => {
        const rp = P(rootId);
        const isFlash = p.flash && p.flash.parent === null;
        return (
          <g key={`rootptr-${isFlash ? p.flashKey : 'x'}`} className={`rootptr ${isFlash ? (p.flash!.same ? 'flash-same' : 'flash') : ''}`}>
            <text x={rp.x} y={rp.y - 50} textAnchor="middle">{p.rootLabel ?? 'raiz_completa'}</text>
            <line x1={rp.x} y1={rp.y - 44} x2={rp.x} y2={rp.y - R - 4} markerEnd="url(#ar)" />
          </g>
        );
      })() : p.emptyText ? (
        <text className="empty-tree" x={W / 2} y={lay.top - 24} textAnchor="middle">{p.emptyText}</text>
      ) : null}

      {/* arestas */}
      {lay.edges.map((e) => {
        const c = cut(P(e.p), P(e.c));
        const isFlash = p.flash && p.flash.parent === e.p && p.flash.side === e.side;
        const cls = e.pending ? 'edge pending' : isFlash ? (p.flash!.same ? 'edge flash-same' : 'edge flash') : 'edge';
        return (
          <g key={`${e.p}-${e.c}-${isFlash ? p.flashKey : ''}`}>
            <line className={cls} {...c} markerEnd={e.pending ? 'url(#arO)' : 'url(#ar)'} />
            {e.pending && <text className="pending-label" x={(c.x1 + c.x2) / 2 + (e.side === 'esq' ? -64 : 10)} y={(c.y1 + c.y2) / 2}>ainda não ligado</text>}
          </g>
        );
      })}

      {/* chamada com raiz = None */}
      {p.noneSlot && !pendingAtNone && (() => {
        const sp = slotOf(p.noneSlot, P);
        const pp = p.noneSlot.parent !== null ? P(p.noneSlot.parent) : null;
        return (
          <g key={`none-${slotKey(p.noneSlot)}`} className="none-box">
            {pp && <line {...cut(pp, sp)} className="edge none-edge" />}
            <rect x={sp.x - 34} y={sp.y - 17} width={68} height={34} rx={8} />
            <text x={sp.x} y={sp.y} dy="0.35em" textAnchor="middle">None</text>
          </g>
        );
      })()}

      {/* vagas clicáveis */}
      {slots.map((s) => {
        const sp = slotOf(s, P);
        const k = slotKey(s);
        const wrong = p.wrong?.type === 'slot' && p.wrong.id === k;
        const reveal = p.reveal?.type === 'slot' && p.reveal.id === k;
        const pp = s.parent !== null ? P(s.parent) : null;
        return (
          <g key={`slot-${k}-${wrong ? p.wrong!.nonce : ''}`} className={`slot ${wrong ? 'wrong' : ''} ${reveal ? 'reveal' : ''}`}
            onClick={() => p.onPickSlot?.(s)} role="button" aria-label={`vaga ${s.side ?? 'raiz'}`}>
            {pp && <line {...cut(pp, sp)} className="slot-edge" />}
            <g transform={`translate(${sp.x},${sp.y})`}>
              <g className="slot-body">
                <circle r={18} />
                <text dy="0.36em" textAnchor="middle">+</text>
              </g>
            </g>
          </g>
        );
      })}

      {/* nós */}
      {Object.keys(lay.pos).map((k) => {
        const id = Number(k);
        const n = p.tree.nodes[id];
        const pos = P(id);
        const isPending = p.pending?.id === id;
        const cls = ['node'];
        if (p.found === id) cls.push('found');
        else if (p.focus === id) cls.push('focus');
        else if (p.appended === id) cls.push('appended');
        else if (done.has(id)) cls.push('done');
        if (stackIdx[id] && p.focus !== id) cls.push('instack');
        if (isPending) cls.push('pending');
        if (p.onPickNode) cls.push('pickable');
        const wrong = p.wrong?.type === 'node' && p.wrong.id === k;
        const reveal = p.reveal?.type === 'node' && p.reveal.id === k;
        if (wrong) cls.push('wrong');
        if (reveal) cls.push('reveal');
        return (
          <g key={`node-${id}-${wrong ? p.wrong!.nonce : ''}`} transform={`translate(${pos.x},${pos.y})`} className={cls.join(' ')}
            onClick={() => p.onPickNode?.(id)} role={p.onPickNode ? 'button' : undefined} aria-label={`nó ${n.valor}`}>
            <g className="node-body">
              {(p.focus === id || p.found === id) && <circle className="pulse" r={R + 6} />}
              <circle className="disc" r={R} />
              <text className="val" dy="0.36em" textAnchor="middle">{n.valor}</text>
              {stackIdx[id] && (
                <g className="sbadge" transform={`translate(${-R + 2},${-R + 2})`}>
                  <circle r={10} />
                  <text dy="0.36em" textAnchor="middle">{stackIdx[id]}</text>
                </g>
              )}
              {p.badges?.[id] !== undefined && (
                <g className="obadge" transform={`translate(${R - 2},${-R + 2})`}>
                  <circle r={11} />
                  <text dy="0.36em" textAnchor="middle">{p.badges[id]}</text>
                </g>
              )}
            </g>
          </g>
        );
      })}

      {/* valor "viajando" pela recursão */}
      {p.token && cur.token && (
        <g transform={`translate(${cur.token.x},${cur.token.y})`} className={`token ${p.token.busca ? 'busca' : ''}`}>
          <rect x={-30} y={-17} width={60} height={34} rx={17} />
          <text dy="0.36em" textAnchor="middle">{p.token.busca ? '🔍' : ''}{p.token.valor}</text>
        </g>
      )}
    </svg>
  );
}
