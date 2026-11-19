import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, random } from 'remotion';
import { C, FONT, MONO, W, H } from '../theme';
import { Bg, Caption, CodePanel, Defs, NodeCircle, Title } from './parts';
import { layout, type Hl } from '../bst';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const useSp = (delay: number, dur = 24) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: { damping: 200 }, durationInFrames: dur });
};

const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill>
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%"><Defs /><Bg w={W} h={H} />{children}</svg>
  </AbsoluteFill>
);

// ------------------------------------------------------------ Crescimento O(1) / O(log n) / O(n)
export const GrowthChart: React.FC = () => {
  const f = useCurrentFrame();
  const p = interpolate(f, [20, 200], [0, 1], clamp);
  const x0 = 120, y0 = 600, w = 760, h = 460;
  const N = Math.round(1 + p * 999999);
  const curve = (fn: (u: number) => number) => {
    const pts: string[] = [];
    for (let k = 0; k <= 100 * p; k++) {
      const u = k / 100;
      pts.push(`${x0 + u * w},${y0 - fn(u) * h}`);
    }
    return pts.join(' ');
  };
  const lines = [
    { fn: (u: number) => u, color: C.red, label: 'O(n) · linear', val: N },
    { fn: (u: number) => Math.log2(1 + u * 1023) / 10 * 0.55, color: C.blue, label: 'O(log n) · logarítmico', val: Math.ceil(Math.log2(N + 1)) },
    { fn: () => 0.08, color: C.orange, label: 'O(1) · constante', val: 1 },
  ];
  return (
    <Svg>
      <Title text="A moeda da computação é o TEMPO" />
      <line x1={x0} y1={y0} x2={x0 + w + 20} y2={y0} stroke={C.ink} strokeWidth={3} />
      <line x1={x0} y1={y0} x2={x0} y2={y0 - h - 20} stroke={C.ink} strokeWidth={3} />
      <text x={x0 + w / 2} y={y0 + 44} textAnchor="middle" fontFamily={FONT} fontSize={20} fill={C.ink}>Volume de dados (n)</text>
      <text transform={`translate(${x0 - 40},${y0 - h / 2}) rotate(-90)`} textAnchor="middle" fontFamily={FONT} fontSize={20} fill={C.ink}>Passos necessários</text>
      {lines.map((l, i) => (
        <g key={i}>
          <polyline points={curve(l.fn)} fill="none" stroke={l.color} strokeWidth={6} strokeLinecap="round" />
        </g>
      ))}
      <g transform="translate(920,150)">
        <rect width={320} height={380} rx={16} fill="#fff" stroke={C.green} strokeWidth={2} />
        <text x={24} y={46} fontFamily={FONT} fontWeight={800} fontSize={22} fill={C.green}>n = {N.toLocaleString('pt-BR')}</text>
        {lines.map((l, i) => (
          <g key={i} transform={`translate(24,${100 + i * 92})`}>
            <rect width={16} height={16} y={-13} rx={4} fill={l.color} />
            <text x={26} fontFamily={FONT} fontSize={17} fill={C.ink}>{l.label}</text>
            <text x={26} y={36} fontFamily={MONO} fontWeight={700} fontSize={26} fill={l.color}>{l.val.toLocaleString('pt-BR')} passos</text>
          </g>
        ))}
      </g>
      <Caption x={40} y={H - 92} w={W - 80} text="A eficiência não depende do processador, e sim de como o algoritmo cresce com os dados." opacity={interpolate(f, [200, 220], [0, 1], clamp)} />
    </Svg>
  );
};

// ------------------------------------------------------------ Busca sequencial
const ARR = [42, 7, 19, 88, 3, 56, 71, 25, 64, 13];
export const SequentialScene: React.FC<{ target?: number }> = ({ target = 71 }) => {
  const f = useCurrentFrame();
  const idx = ARR.indexOf(target);
  const STEP = 24;
  const k = Math.min(idx, Math.floor(Math.max(0, f - 20) / STEP));
  const found = f - 20 >= idx * STEP + STEP;
  const bw = 100, x0 = (W - ARR.length * bw) / 2, y = 250;
  return (
    <Svg>
      <Title text="Força bruta: busca sequencial" />
      <text x={W / 2} y={170} textAnchor="middle" fontFamily={FONT} fontSize={26} fill={C.ink}>Procurando <tspan fontWeight={800} fill={C.red}>{target}</tspan> em dados SEM ordem</text>
      {ARR.map((v, i) => {
        const isCur = i === k && !found;
        const done = i < k || (found && i < idx);
        const hit = found && i === idx;
        return (
          <g key={i} transform={`translate(${x0 + i * bw},${y})`}>
            <rect width={bw - 10} height={bw - 10} rx={10} fill={hit ? '#1F8A4C' : isCur ? C.orange : done ? '#D2DAE5' : '#fff'} stroke={C.green} strokeWidth={3} />
            <text x={(bw - 10) / 2} y={(bw - 10) / 2} dy="0.35em" textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={32} fill={hit ? '#fff' : C.ink}>{v}</text>
            <text x={(bw - 10) / 2} y={bw + 16} textAnchor="middle" fontFamily={MONO} fontSize={16} fill={C.gray}>[{i}]</text>
          </g>
        );
      })}
      <g transform={`translate(${x0 + k * bw + 45},${y - 30})`}>
        <path d="M-14 -22 L14 -22 L0 0 Z" fill={C.blue} />
      </g>
      <text x={W / 2} y={440} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={30} fill={C.navy}>comparações: {k + 1}{found ? '  ✔ encontrado' : ''}</text>
      <CodePanel x={330} y={470} w={620} fontSize={16} lines={['def busca_sequencial(vetor, alvo):', '    for i, item in enumerate(vetor):', '        if item == alvo: return i', '    return -1']} active={found ? 2 : 1} />
    </Svg>
  );
};

// ------------------------------------------------------------ Busca binária
const SORTED = [2, 5, 8, 12, 16, 23, 38, 45, 56, 61, 72, 78, 84, 91, 95, 99];
export const BinaryScene: React.FC<{ target?: number }> = ({ target = 23 }) => {
  const f = useCurrentFrame();
  const rounds: { lo: number; hi: number; mid: number }[] = [];
  let lo = 0, hi = SORTED.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    rounds.push({ lo, hi, mid });
    if (SORTED[mid] === target) break;
    if (target < SORTED[mid]) hi = mid - 1; else lo = mid + 1;
  }
  const STEP = 60;
  const r = Math.min(rounds.length - 1, Math.floor(Math.max(0, f - 15) / STEP));
  const R = rounds[r];
  const found = SORTED[R.mid] === target && f - 15 > r * STEP + 30;
  const bw = 72, x0 = (W - SORTED.length * bw) / 2, y = 250;
  const ptr = (i: number, label: string, color: string, dy: number) => (
    <g transform={`translate(${x0 + i * bw + 32},${y - 20 - dy})`}>
      <text textAnchor="middle" y={-26} fontFamily={MONO} fontWeight={700} fontSize={18} fill={color}>{label}</text>
      <path d="M-10 -18 L10 -18 L0 0 Z" fill={color} />
    </g>
  );
  const msg = found ? `vetor[${R.mid}] == ${target} → encontrado em ${r + 1} passos!` :
    target < SORTED[R.mid] ? `${target} < ${SORTED[R.mid]} → descartamos a metade direita` : `${target} > ${SORTED[R.mid]} → descartamos a metade esquerda`;
  return (
    <Svg>
      <Title text="O poder da ordem: busca binária" />
      <text x={W / 2} y={150} textAnchor="middle" fontFamily={FONT} fontSize={24} fill={C.ink}>Procurando <tspan fontWeight={800} fill={C.red}>{target}</tspan> · cada comparação corta o espaço pela METADE</text>
      {SORTED.map((v, i) => {
        const out = i < R.lo || i > R.hi;
        const isMid = i === R.mid;
        return (
          <g key={i} transform={`translate(${x0 + i * bw},${y})`} opacity={out ? 0.25 : 1}>
            <rect width={bw - 8} height={64} rx={8} fill={isMid ? (found ? '#1F8A4C' : C.orange) : '#fff'} stroke={C.green} strokeWidth={2.5} />
            <text x={(bw - 8) / 2} y={32} dy="0.35em" textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={24} fill={isMid && found ? '#fff' : C.ink}>{v}</text>
          </g>
        );
      })}
      {ptr(R.lo, 'início', C.blue, 0)}
      {ptr(R.mid, 'meio', C.orange, 0)}
      {ptr(R.hi, 'fim', C.navy, 0)}
      <g transform="translate(140,370)">
        <text fontFamily={MONO} fontWeight={700} fontSize={24} fill={C.navy}>passos: {r + 1}   ·   sequencial levaria: {SORTED.indexOf(target) + 1}</text>
        <text y={44} fontFamily={FONT} fontSize={20} fill={C.ink}>1.000 itens → ≈ 10 passos   ·   1.000.000 itens → ≈ 20 passos</text>
      </g>
      <CodePanel x={140} y={450} w={560} fontSize={14.5} lines={['while low <= high:', '    mid = (low + high) // 2', '    if vetor[mid] == alvo: return mid', '    elif alvo < vetor[mid]: high = mid - 1', '    else: low = mid + 1']} active={found ? 2 : target < SORTED[R.mid] ? 3 : 4} />
      <Caption x={730} y={480} w={510} text={msg} />
    </Svg>
  );
};

// ------------------------------------------------------------ Paradoxo: inserir num vetor ordenado
export const ShiftScene: React.FC = () => {
  const f = useCurrentFrame();
  const base = [1, 2, 3, 4, 6, 7, 8, 9, 10];
  const ins = 5, at = 4;
  const moves = base.length - at;
  const STEP = 14;
  const done = Math.min(moves, Math.floor(Math.max(0, f - 30) / STEP));
  const landed = f > 30 + moves * STEP + 10;
  const bw = 96, x0 = (W - (base.length + 1) * bw) / 2, y = 300;
  return (
    <Svg>
      <Title text="O paradoxo dinâmico" />
      <text x={W / 2} y={170} textAnchor="middle" fontFamily={FONT} fontSize={26} fill={C.ink}>Inserir <tspan fontWeight={800} fill={C.blue}>5</tspan> num vetor ordenado exige deslocar todos os vizinhos</text>
      {base.map((v, i) => {
        const shiftIdx = base.length - 1 - i;
        const moved = i >= at && shiftIdx < done;
        return (
          <g key={v} transform={`translate(${x0 + (i + (moved ? 1 : 0)) * bw},${y})`}>
            <rect width={bw - 10} height={80} rx={8} fill={moved ? '#FCE4E8' : '#fff'} stroke={C.green} strokeWidth={3} />
            <text x={(bw - 10) / 2} y={40} dy="0.35em" textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={30} fill={C.ink}>{v}</text>
          </g>
        );
      })}
      <g transform={`translate(${x0 + at * bw},${landed ? y : y - 130})`}>
        <rect width={bw - 10} height={80} rx={8} fill={C.blue} />
        <text x={(bw - 10) / 2} y={40} dy="0.35em" textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={30} fill="#fff">{ins}</text>
      </g>
      <text x={W / 2} y={470} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={30} fill={C.red}>deslocamentos: {done} → custo O(n)</text>
      <Caption x={40} y={H - 92} w={W - 80} text="Busca binária é rápida para CONSULTAR, mas lenta para MUDAR. Como ter os dois? → Árvores!" opacity={landed ? 1 : 0.3} />
    </Svg>
  );
};

// ------------------------------------------------------------ Hash
const hashOf = (s: string, m: number) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0) % m;
export const HashScene: React.FC<{ mode?: 'basico' | 'colisao' | 'encadeamento' | 'sondagem' }> = ({ mode = 'basico' }) => {
  const f = useCurrentFrame();
  const M = 10;
  // "Beto" (394) e "Rui" (304) caem ambos na posição 4: colisão real
  const keys = mode === 'basico' ? ['João'] : ['Beto', 'Rui'];
  const per = 90;
  const k = Math.min(keys.length - 1, Math.floor(f / per));
  const local = f - k * per;
  const travel = interpolate(local, [10, 50], [0, 1], clamp);
  const tx = 930, ty0 = 120, rh = 48;
  const slots = keys.map((key) => hashOf(key, M));
  const idxOf = (j: number) => slots[j];
  const finalSlot = (j: number) => (mode === 'sondagem' && j === 1 ? (idxOf(1) + 1) % M : idxOf(j));
  const sum = (s: string) => [...s].map((c) => c.charCodeAt(0));
  return (
    <Svg>
      <Title text={mode === 'basico' ? 'O atalho supremo: tabela hash' : mode === 'colisao' ? 'A inevitabilidade das colisões' : mode === 'encadeamento' ? 'Resolvendo colisões: encadeamento' : 'Resolvendo colisões: sondagem linear'} />
      {Array.from({ length: M }).map((_, i) => {
        const used = keys.some((_, j) => j <= k && finalSlot(j) === i && (j < k || travel >= 1));
        const clash = mode !== 'basico' && k === 1 && travel >= 1 && i === idxOf(0) && mode === 'colisao';
        return (
          <g key={i} transform={`translate(${tx},${ty0 + i * rh})`}>
            <text x={-16} y={rh / 2} dy="0.35em" textAnchor="end" fontFamily={MONO} fontSize={18} fill={C.gray}>{i}</text>
            <rect width={150} height={rh - 6} rx={6} fill={clash ? C.red : used ? C.green : '#fff'} stroke={C.green} strokeWidth={2} />
            {keys.map((key, j) => (j <= k && finalSlot(j) === i && (j < k || travel >= 1) && !((mode === 'encadeamento' || mode === 'colisao') && j === 1)) ? (
              <text key={j} x={75} y={rh / 2 - 3} dy="0.35em" textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={18} fill="#fff">{key}</text>) : null)}
            {clash && <text x={170} y={rh / 2 - 3} dy="0.35em" fontFamily={FONT} fontWeight={800} fontSize={18} fill={C.red}>⚠ COLISÃO!</text>}
          </g>
        );
      })}
      {keys.map((key, j) => {
        if (j > k) return null;
        const tt = j < k ? 1 : travel;
        const yEnd = ty0 + finalSlot(j) * rh + rh / 2 - 3;
        const x = interpolate(tt, [0, 0.5, 1], [130, 560, 860]);
        const y = interpolate(tt, [0, 0.5, 1], [260 + j * 90, 330, yEnd]);
        return (
          <g key={key}>
            <rect x={90} y={230 + j * 90} width={170} height={56} rx={10} fill="#fff" stroke={C.navy} strokeWidth={2.5} />
            <text x={175} y={258 + j * 90} dy="0.35em" textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={22} fill={C.navy}>"{key}"</text>
            {tt < 1 && <circle cx={x} cy={y} r={10} fill={C.orange} />}
          </g>
        );
      })}
      <g transform="translate(420,260)">
        <rect width={300} height={130} rx={14} fill="#15223A" />
        <text x={150} y={42} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={22} fill="#fff">h(x) = Σ códigos % {M}</text>
        <text x={150} y={84} textAnchor="middle" fontFamily={MONO} fontSize={15} fill="#E6EDF7">{sum(keys[k]).join('+')}</text>
        <text x={150} y={112} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={20} fill={C.orange}>= {sum(keys[k]).reduce((a, b) => a + b, 0)} % {M} = {hashOf(keys[k], M)}</text>
      </g>
      {mode === 'encadeamento' && k === 1 && travel >= 1 && (
        <g transform={`translate(${tx + 160},${ty0 + idxOf(0) * rh + 6})`}>
          <line x1={-10} y1={18} x2={20} y2={18} stroke={C.blue} strokeWidth={3} markerEnd="url(#arrow)" />
          <rect x={24} width={86} height={36} rx={6} fill={C.blue} />
          <text x={67} y={18} dy="0.35em" textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={16} fill="#fff">{keys[1]}</text>
        </g>
      )}
      {mode === 'sondagem' && k === 1 && travel > 0.6 && (
        <path d={`M${tx + 150} ${ty0 + idxOf(0) * rh + 20} q40 ${rh / 2} 0 ${rh}`} fill="none" stroke={C.red} strokeWidth={3} markerEnd="url(#arrow)" />
      )}
      <Caption x={40} y={H - 92} w={900} text={
        mode === 'basico' ? 'Chave → transformação matemática → endereço exato. Acesso médio O(1)!' :
        mode === 'colisao' ? 'Princípio da Casa dos Pombos: chaves infinitas em espaço finito → colisões são inevitáveis.' :
        mode === 'encadeamento' ? 'Encadeamento: cada posição guarda uma lista. Nunca "enche", mas gasta ponteiros.' :
        'Sondagem linear: ocupado? tenta a próxima posição. Ótimo para cache, risco de aglomeração.'} />
    </Svg>
  );
};

// ------------------------------------------------------------ Grafos: BFS e DFS
const GN: Record<string, { x: number; y: number }> = {
  A: { x: 300, y: 180 }, B: { x: 520, y: 130 }, C: { x: 180, y: 360 }, D: { x: 420, y: 340 }, E: { x: 640, y: 300 },
  F: { x: 280, y: 540 }, G: { x: 540, y: 520 }, H: { x: 760, y: 470 },
};
const GE: [string, string][] = [['A', 'B'], ['A', 'C'], ['A', 'D'], ['B', 'E'], ['C', 'F'], ['D', 'G'], ['D', 'E'], ['E', 'H'], ['G', 'H'], ['F', 'G']];
const adj = (v: string) => GE.filter((e) => e.includes(v)).map((e) => (e[0] === v ? e[1] : e[0])).sort();

function bfsOrder(s: string) {
  const seen = new Set([s]); const q = [s]; const order: { v: string; from?: string; q: string[]; lvl: number }[] = [];
  const lvl: Record<string, number> = { [s]: 0 }; const from: Record<string, string> = {};
  while (q.length) {
    const v = q.shift()!;
    for (const u of adj(v)) if (!seen.has(u)) { seen.add(u); q.push(u); lvl[u] = lvl[v] + 1; from[u] = v; }
    order.push({ v, from: from[v], q: [...q], lvl: lvl[v] });
  }
  return order;
}
function dfsOrder(s: string) {
  const seen = new Set<string>(); const order: { v: string; from?: string; q: string[]; lvl: number }[] = []; const stack: string[] = [];
  const go = (v: string, from?: string, d = 0) => {
    seen.add(v); stack.push(v); order.push({ v, from, q: [...stack], lvl: d });
    for (const u of adj(v)) if (!seen.has(u)) go(u, v, d + 1);
    stack.pop();
  };
  go(s);
  return order;
}

export const GraphScene: React.FC<{ kind?: 'bfs' | 'dfs' }> = ({ kind = 'bfs' }) => {
  const f = useCurrentFrame();
  const order = kind === 'bfs' ? bfsOrder('A') : dfsOrder('A');
  const STEP = 40;
  const k = Math.min(order.length - 1, Math.floor(f / STEP));
  const local = f - k * STEP;
  const visited = new Set(order.slice(0, k + 1).map((o) => o.v));
  const tree = new Set(order.slice(1, k + 1).map((o) => [o.from, o.v].sort().join('')));
  const cur = order[k];
  const ring = interpolate(local, [0, STEP], [0, 1], clamp);
  return (
    <Svg>
      <Title text={kind === 'bfs' ? 'A onda de expansão: busca em largura (BFS)' : 'O fio de Ariadne: busca em profundidade (DFS)'} />
      {kind === 'bfs' && [1, 2, 3].map((l) => (
        <circle key={l} cx={GN.A.x} cy={GN.A.y} r={l * 150 * Math.min(1, (k + ring) / (l * 2.2))} fill="none" stroke={C.blue} strokeDasharray="10 10" strokeWidth={2} opacity={0.35} />
      ))}
      {GE.map(([a, b]) => {
        const on = tree.has([a, b].sort().join(''));
        return <line key={a + b} x1={GN[a].x} y1={GN[a].y} x2={GN[b].x} y2={GN[b].y} stroke={on ? C.orange : '#7E8EA5'} strokeWidth={on ? 7 : 3} strokeLinecap="round" />;
      })}
      {Object.entries(GN).map(([v, p]) => (
        <NodeCircle key={v} x={p.x} y={p.y} r={32} label={v} hl={v === cur.v ? 'cur' : visited.has(v) ? 'done' : undefined}
          scale={v === cur.v ? 1 + 0.12 * Math.sin(Math.min(1, local / 14) * Math.PI) : 1} />
      ))}
      <g transform="translate(900,120)">
        <rect width={340} height={420} rx={16} fill="#fff" stroke={C.green} strokeWidth={2} />
        <text x={20} y={40} fontFamily={FONT} fontWeight={800} fontSize={22} fill={C.green}>{kind === 'bfs' ? 'FILA (FIFO)' : 'PILHA (LIFO) / recursão'}</text>
        {cur.q.map((v, i) => (
          <g key={v + i} transform={kind === 'bfs' ? `translate(${20 + i * 56},70)` : `translate(20,${360 - i * 50})`}>
            <rect width={48} height={42} rx={8} fill={kind === 'bfs' ? C.blue : C.navy} />
            <text x={24} y={21} dy="0.35em" textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={20} fill="#fff">{v}</text>
          </g>
        ))}
        <text x={20} y={kind === 'bfs' ? 170 : 110} fontFamily={FONT} fontWeight={700} fontSize={18} fill={C.ink}>Ordem de visita:</text>
        <text x={20} y={kind === 'bfs' ? 205 : 145} fontFamily={MONO} fontWeight={700} fontSize={24} fill={C.orange}>{order.slice(0, k + 1).map((o) => o.v).join(' → ')}</text>
        {kind === 'bfs' && <text x={20} y={260} fontFamily={FONT} fontSize={18} fill={C.ink}>Camada atual: {cur.lvl}</text>}
      </g>
      <Caption x={40} y={H - 92} w={W - 80} text={kind === 'bfs'
        ? `Visitando ${cur.v} (camada ${cur.lvl}). Vizinhos entram no FIM da fila → explora camada por camada (rota mais curta).`
        : `Visitando ${cur.v}. Mergulha o mais fundo possível; sem saída? recua (backtracking). Marcadores evitam loops.`} />
    </Svg>
  );
};

// ------------------------------------------------------------ Terminologia
export const AnatomyScene: React.FC = () => {
  const f = useCurrentFrame();
  const P: Record<number, { x: number; y: number }> = {
    50: { x: 430, y: 230 }, 30: { x: 300, y: 350 }, 70: { x: 560, y: 350 },
    20: { x: 230, y: 470 }, 40: { x: 370, y: 470 }, 60: { x: 500, y: 470 }, 80: { x: 630, y: 470 },
  };
  const edges: [number, number][] = [[50, 30], [50, 70], [30, 20], [30, 40], [70, 60], [70, 80]];
  const pre = [50, 30, 20, 40, 70, 60, 80];
  const items = [
    { at: 30, text: 'RAIZ: topo da árvore', nodes: [50], hl: 'cur' as const, color: C.orange },
    { at: 100, text: 'PAI: 70 tem filhos', nodes: [70], hl: 'succ' as const, color: C.blue },
    { at: 170, text: 'IRMÃOS: mesmo pai', nodes: [60, 80], hl: 'visit' as const, color: C.greenLight },
    { at: 240, text: 'FOLHAS: sem filhos', nodes: [20, 40, 60, 80], hl: 'del' as const, color: C.red },
  ];
  const active = items.filter((it) => f >= it.at).pop();
  const hlOf: Record<number, Hl> = {};
  if (active) active.nodes.forEach((v) => { hlOf[v] = active.hl; });
  const levelY = [230, 350, 470];
  const altOp = interpolate(f, [300, 320], [0, 1], clamp);
  return (
    <Svg>
      <Title text="Anatomia de uma árvore" />
      {levelY.map((y, d) => (
        <text key={d} x={60} y={y} dy="0.35em" fontFamily={FONT} fontWeight={700} fontSize={22} fill={C.navy}
          opacity={interpolate(f, [d * 12, d * 12 + 15], [0, 1], clamp)}>Nível {d}</text>
      ))}
      {edges.map(([a, b]) => (
        <line key={`${a}-${b}`} x1={P[a].x} y1={P[a].y} x2={P[b].x} y2={P[b].y} stroke="#6B7A8F" strokeWidth={4} />
      ))}
      {pre.map((v) => (
        <NodeCircle key={v} x={P[v].x} y={P[v].y} r={34} label={String(v)} hl={hlOf[v]} />
      ))}
      <g opacity={altOp}>
        <line x1={700} x2={700} y1={230} y2={470} stroke={C.orange} strokeWidth={5} />
        <text x={716} y={350} dy="0.35em" fontFamily={FONT} fontWeight={800} fontSize={24} fill={C.orange}>altura = 2</text>
      </g>
      {items.map((it, i) => (
        <g key={i} opacity={interpolate(f, [it.at, it.at + 15], [0, 1], clamp)} transform={`translate(800,${190 + i * 84})`}>
          <rect width={18} height={52} rx={6} fill={it.color} />
          <text x={34} y={26} dy="0.35em" fontFamily={FONT} fontWeight={800} fontSize={24} fill={C.ink}>{it.text}</text>
        </g>
      ))}
      <Caption x={40} y={H - 92} w={W - 80} text="Estrutura não-linear e hierárquica: nós ligados por arestas, partindo de uma única raiz." />
    </Svg>
  );
};

// ------------------------------------------------------------ O nó (cápsula)
export const NodeAnatomy: React.FC = () => {
  const f = useCurrentFrame();
  const a = useSp(10), b = useSp(40), c = useSp(80);
  const pulse = 1 + 0.03 * Math.sin(f / 8);
  return (
    <Svg>
      <Title text="O nó: uma cápsula de dado + 2 endereços" />
      <g transform={`translate(330,360) scale(${a * pulse})`}>
        <circle r={190} fill="#fff" stroke={C.green} strokeWidth={8} />
        <clipPath id="cap"><circle r={186} /></clipPath>
        <g clipPath="url(#cap)">
          <rect x={-70} y={-200} width={140} height={400} fill={C.green} />
        </g>
        <text x={-128} dy="0.35em" textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={40} fill={C.navy}>esq</text>
        <text dy="0.35em" textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={40} fill="#fff">dado</text>
        <text x={128} dy="0.35em" textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={40} fill={C.navy}>dir</text>
      </g>
      <g opacity={b}>
        <path d={`M200 470 L${200 - 120 * b} ${470 + 120 * b}`} stroke={C.orange} strokeWidth={6} markerEnd="url(#arrow)" />
        <path d={`M460 470 L${460 + 120 * b} ${470 + 120 * b}`} stroke={C.orange} strokeWidth={6} markerEnd="url(#arrow)" />
        <text x={40} y={620} fontFamily={MONO} fontWeight={700} fontSize={26} fill="#B23A1C">None</text>
        <text x={560} y={620} fontFamily={MONO} fontWeight={700} fontSize={26} fill="#B23A1C">None</text>
      </g>
      <g opacity={c} transform={`translate(${720 + (1 - c) * 60},170)`}>
        <CodePanel x={0} y={0} w={500} fontSize={20} lines={['class Node:', '    def __init__(self, dado):', '        self.dado = dado', '        self.esq = None', '        self.dir = None']} active={Math.floor(f / 30) % 5} />
        <foreignObject x={0} y={290} width={500} height={160}>
          <div style={{ fontFamily: FONT, fontSize: 24, color: C.ink, lineHeight: 1.35 }}>
            Guarda a <b style={{ color: C.green }}>informação</b> e as <b style={{ color: C.orange }}>coordenadas</b> (endereços de memória) de seus dois descendentes.
          </div>
        </foreignObject>
      </g>
    </Svg>
  );
};

// ------------------------------------------------------------ Abertura (vídeo)
export const Cover: React.FC<{ title?: string; subtitle?: string; bare?: boolean }> = ({ title = 'Árvores Binárias de Busca', subtitle = 'A jornada do dado: da força bruta ao O(log n)', bare }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const grow = (d: number) => spring({ frame: f - d, fps, config: { damping: 18, mass: 0.6 } });
  const branches: { x1: number; y1: number; x2: number; y2: number; d: number }[] = [];
  const rec = (x: number, y: number, ang: number, len: number, depth: number, d: number) => {
    if (depth > 6) return;
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    branches.push({ x1: x, y1: y, x2, y2, d });
    rec(x2, y2, ang - 0.42, len * 0.74, depth + 1, d + 7);
    rec(x2, y2, ang + 0.42, len * 0.74, depth + 1, d + 7);
  };
  rec(W / 2 + 260, H + 10, -Math.PI / 2, 150, 0, 0);
  const tIn = interpolate(f, [30, 60], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 70% 40%, #0A7A72 0%, ${C.green} 45%, #0F1828 100%)` }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
        <Defs />
        {Array.from({ length: 60 }).map((_, i) => {
          const x = random(`x${i}`) * W, sp = 0.3 + random(`s${i}`) * 0.8;
          const y = (H - ((f * sp * 3 + random(`y${i}`) * H) % (H + 40)));
          return <text key={i} x={x} y={y} fontFamily={MONO} fontSize={14 + random(`f${i}`) * 10} fill="#9DB0C9" opacity={0.18}>{random(`b${i}`) > 0.5 ? '1' : '0'}</text>;
        })}
        {branches.map((b, i) => {
          const g = Math.max(0, Math.min(1, grow(b.d)));
          return <line key={i} x1={b.x1} y1={b.y1} x2={b.x1 + (b.x2 - b.x1) * g} y2={b.y1 + (b.y2 - b.y1) * g} stroke="#BFE8E2" strokeWidth={Math.max(1.5, 9 - b.d / 7)} strokeLinecap="round" opacity={0.85} />;
        })}
        {branches.filter((b) => b.d >= 42).map((b, i) => {
          const g = grow(b.d + 8);
          return <circle key={i} cx={b.x2} cy={b.y2} r={7 * Math.max(0, g)} fill={i % 7 === 0 ? C.orange : '#E3F4F2'} filter={i % 7 === 0 ? 'url(#glow)' : undefined} />;
        })}
        <g opacity={bare ? 0 : tIn} transform={`translate(${70 - (1 - tIn) * 40},0)`}>
          <text x={0} y={250} fontFamily={FONT} fontWeight={700} fontSize={22} letterSpacing={6} fill={C.orange}>ESTRUTURAS DE DADOS · IFPA</text>
          <foreignObject x={0} y={270} width={720} height={250}>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 70, color: '#fff', lineHeight: 1.05 }}>{title}</div>
          </foreignObject>
          <text x={0} y={560} fontFamily={FONT} fontSize={26} fill="#DCE6F2">{subtitle}</text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------ Arte gerativa para capas de seção (imagens)
export const ArtStill: React.FC<{ variant?: number; hue?: string }> = ({ variant = 0, hue = C.green }) => {
  const nodes = Array.from({ length: 70 }).map((_, i) => ({
    x: random(`ax${variant}-${i}`) * W, y: random(`ay${variant}-${i}`) * H, r: 3 + random(`ar${variant}-${i}`) * 10,
  }));
  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${hue} 0%, #0A101B 100%)` }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
        <Defs />
        {variant === 0 && nodes.map((a, i) => nodes.slice(i + 1, i + 4).map((b, j) => (
          <line key={`${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#9FDCD4" strokeWidth={1} opacity={0.25} />
        )))}
        {variant === 1 && Array.from({ length: 6 }).map((_, d) => Array.from({ length: 2 ** d }).map((__, k) => {
          const x = ((k + 0.5) / 2 ** d) * W, y = 80 + d * 115;
          const px = ((Math.floor(k / 2) + 0.5) / 2 ** (d - 1)) * W;
          return (
            <g key={`${d}-${k}`}>
              {d > 0 && <line x1={px} y1={y - 115} x2={x} y2={y} stroke="#BFE8E2" strokeWidth={2} opacity={0.4} />}
              <circle cx={x} cy={y} r={Math.max(5, 22 - d * 3)} fill={(k + d) % 5 === 0 ? C.orange : '#E3F4F2'} opacity={0.75} filter="url(#glow)" />
            </g>
          );
        }))}
        {variant === 2 && Array.from({ length: 12 }).map((_, i) => (
          <circle key={i} cx={W * 0.7} cy={H * 0.5} r={40 + i * 55} fill="none" stroke={i % 3 === 0 ? C.orange : '#9FDCD4'} strokeWidth={2} strokeDasharray="12 10" opacity={0.5 - i * 0.03} />
        ))}
        {variant === 3 && Array.from({ length: 14 }).map((_, i) => (
          <g key={i} transform={`translate(${80 + i * 82},${120 + (i % 4) * 110})`}>
            <rect width={70} height={70} rx={10} fill="none" stroke="#9FDCD4" strokeWidth={2} opacity={0.5} />
            <text x={35} y={35} dy="0.35em" textAnchor="middle" fontFamily={MONO} fontSize={22} fill="#E3F4F2" opacity={0.6}>{i}</text>
          </g>
        ))}
        {nodes.map((a, i) => <circle key={i} cx={a.x} cy={a.y} r={a.r} fill={i % 9 === 0 ? C.orange : '#E3F4F2'} opacity={i % 9 === 0 ? 0.9 : 0.35} filter={i % 9 === 0 ? 'url(#glow)' : undefined} />)}
      </svg>
    </AbsoluteFill>
  );
};
