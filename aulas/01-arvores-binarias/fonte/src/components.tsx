import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { FPS, W, H, C } from './theme';
import { SCENES, type SceneDef } from './remotion/catalog';
import { StepScene, STEP_FRAMES, stepDuration } from './remotion/StepScene';
import {
  CODE_BUSCA, CODE_INSERIR, CODE_PERCURSO, CODE_REMOVER, insertSteps, layout, removeSteps, searchSteps,
  traversalSteps, type Hl, type Kind, type Step,
} from './bst';

// ------------------------------------------------------------ Marca IFPA (recriada em SVG)
export const IfLogo: React.FC<{ light?: boolean; campus?: string }> = ({ light, campus = 'Campus Breves' }) => {
  // Marca institucional: mantém as cores oficiais do IF mesmo com a paleta nova do portal
  const sq = light ? '#fff' : '#2F9E41';
  const cells: [number, number, 'c' | 's'][] = [[0, 0, 'c'], [1, 0, 's'], [2, 0, 's'], [0, 1, 's'], [1, 1, 's'], [0, 2, 's'], [1, 2, 's'], [2, 2, 's'], [0, 3, 's'], [1, 3, 's']];
  return (
    <div className="iflogo">
      <svg viewBox="0 0 70 94" width="34" height="46">
        {cells.map(([x, y, t], i) => t === 'c'
          ? <circle key={i} cx={x * 24 + 10} cy={y * 24 + 10} r={10} fill="#CD191E" />
          : <rect key={i} x={x * 24} y={y * 24} width={20} height={20} rx={2} fill={sq} />)}
      </svg>
      <div className="iflogo-text" style={{ color: light ? '#fff' : '#2F9E41' }}>
        <b>INSTITUTO FEDERAL</b>
        <span>Pará</span>
        <small>{campus}</small>
      </div>
    </div>
  );
};

// ------------------------------------------------------------ Player com controles de passo
// O Player mede o próprio tamanho ao montar. Por isso ele só monta depois que a
// transição do slide termina (settled) e remonta quando a escala da tela muda.
export const StageCtx = createContext({ scale: 1, settled: true });

export const Anim: React.FC<{ id?: string; scene?: SceneDef; autoPlay?: boolean; loop?: boolean; compact?: boolean }> = ({ id, scene, autoPlay = true, loop = true, compact }) => {
  const S = scene ?? SCENES[id!];
  const { scale, settled } = useContext(StageCtx);
  const ref = useRef<PlayerRef>(null);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [rate, setRate] = useState(1);
  const steps = (S.props?.steps as Step[] | undefined)?.length;

  useEffect(() => {
    const p = ref.current;
    if (!p) return;
    const onF = (e: { detail: { frame: number } }) => setFrame(e.detail.frame);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    p.addEventListener('frameupdate', onF);
    p.addEventListener('play', onPlay);
    p.addEventListener('pause', onPause);
    return () => {
      p.removeEventListener('frameupdate', onF);
      p.removeEventListener('play', onPlay);
      p.removeEventListener('pause', onPause);
    };
  }, [S, settled, scale]);

  const stepIdx = steps ? Math.min(steps - 1, Math.floor(frame / STEP_FRAMES)) : 0;
  const go = (k: number) => {
    if (!steps) return;
    const n = Math.max(0, Math.min(steps - 1, k));
    ref.current?.pause();
    ref.current?.seekTo(n * STEP_FRAMES + 30);
  };

  return (
    <div className={`anim ${compact ? 'compact' : ''}`}>
      <div className="anim-stage">
        {settled && (
          <Player key={scale.toFixed(4)} ref={ref} component={S.component} inputProps={S.props ?? {}} durationInFrames={S.duration}
            compositionWidth={W} compositionHeight={H} fps={FPS} autoPlay={autoPlay} loop={loop}
            playbackRate={rate} style={{ width: '100%', height: '100%' }} clickToPlay={false} />
        )}
      </div>
      <div className="anim-bar" onKeyDown={(e) => e.stopPropagation()}>
        {steps && <button title="Passo anterior" onClick={() => go(stepIdx - 1)}>⏮</button>}
        <button title="Reproduzir / pausar" className="play" onClick={() => (playing ? ref.current?.pause() : ref.current?.play())}>{playing ? '❚❚' : '▶'}</button>
        {steps && <button title="Próximo passo" onClick={() => go(stepIdx + 1)}>⏭</button>}
        <input type="range" min={0} max={S.duration - 1} value={frame} onChange={(e) => { ref.current?.pause(); ref.current?.seekTo(+e.target.value); }} />
        {steps ? <span className="anim-step">passo {stepIdx + 1}/{steps}</span> : <span className="anim-step">{(frame / FPS).toFixed(1)}s</span>}
        {[0.5, 1, 2].map((r) => <button key={r} className={rate === r ? 'on' : ''} onClick={() => setRate(r)}>{r}×</button>)}
      </div>
    </div>
  );
};

// ------------------------------------------------------------ Árvore estática (ilustrações)
export const MiniTree: React.FC<{
  pre: number[]; hl?: Record<number, Hl>; w?: number; h?: number; r?: number; halves?: boolean; labels?: Record<number, string>;
}> = ({ pre, hl = {}, w = 520, h = 300, r = 24, halves, labels = {} }) => {
  const L = layout(pre);
  const gap = Math.min(90, (h - 2 * r - 10) / Math.max(1, L.depth));
  const P = (v: number) => ({ x: 20 + L.pos[v].x * (w - 40), y: r + 6 + L.pos[v].y * gap });
  const fill: Record<string, string> = { cur: C.orange, visit: C.greenLight, found: '#1F8A4C', new: C.orange, del: C.red, succ: C.blue, dim: '#D2DAE5', done: C.navy };
  const root = pre[0];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="minitree">
      {halves && root !== undefined && (
        <>
          <rect x={0} y={r * 2 + 10} width={P(root).x - 8} height={h - r * 2 - 10} rx={16} fill={C.blue} opacity={0.16} />
          <rect x={P(root).x + 8} y={r * 2 + 10} width={w - P(root).x - 8} height={h - r * 2 - 10} rx={16} fill={C.greenLight} opacity={0.22} />
          <text x={18} y={h - 14} fontWeight={800} fontSize={22} fill={C.blue}>&lt; {root}</text>
          <text x={w - 18} y={h - 14} textAnchor="end" fontWeight={800} fontSize={22} fill={C.green}>&gt; {root}</text>
        </>
      )}
      {L.edges.map(([a, b]) => <line key={`${a}-${b}`} x1={P(a).x} y1={P(a).y} x2={P(b).x} y2={P(b).y} stroke="#6B7A8F" strokeWidth={3} />)}
      {pre.map((v) => (
        <g key={v} transform={`translate(${P(v).x},${P(v).y})`}>
          <circle r={r} fill={fill[hl[v] ?? ''] ?? C.green} stroke="#fff" strokeWidth={3} />
          <text textAnchor="middle" dy="0.35em" fontWeight={800} fontSize={r * 0.8} fill={hl[v] === 'cur' || hl[v] === 'new' ? C.ink : '#fff'}>{labels[v] ?? v}</text>
        </g>
      ))}
    </svg>
  );
};

// ------------------------------------------------------------ Laboratório interativo de ABB
type Op = 'inserir' | 'buscar' | 'remover' | Kind;

export const Lab: React.FC = () => {
  const [tree, setTree] = useState<number[]>([50, 30, 80, 20, 40, 70, 90]);
  const [val, setVal] = useState('45');
  const [run, setRun] = useState<{ steps: Step[]; code: string[]; title: string; key: number } | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const exec = (op: Op) => {
    const v = parseInt(val, 10);
    const needs = op === 'inserir' || op === 'buscar' || op === 'remover';
    if (needs && Number.isNaN(v)) return;
    let steps: Step[]; let code: string[]; let title: string;
    if (op === 'inserir') { steps = insertSteps(tree, v); code = CODE_INSERIR; title = `inserir(${v})`; }
    else if (op === 'buscar') { steps = searchSteps(tree, v); code = CODE_BUSCA; title = `busca(${v})`; }
    else if (op === 'remover') { steps = removeSteps(tree, v); code = CODE_REMOVER; title = `remover(${v})`; }
    else { steps = traversalSteps(tree, op); code = CODE_PERCURSO[op]; title = `${op}_ordem`; }
    setRun({ steps, code, title, key: Date.now() });
    setTree(steps[steps.length - 1].tree);
    setLog((l) => [`${title} → ${steps[steps.length - 1].caption}`, ...l].slice(0, 6));
  };

  const scene = useMemo<SceneDef>(() => run
    ? { component: StepScene, props: { steps: run.steps, code: run.code, title: run.title }, duration: stepDuration(run.steps) }
    : { component: StepScene, props: { steps: [{ tree, caption: 'Digite um valor e escolha uma operação. Use ⏮ ⏭ para andar passo a passo.' }] }, duration: 60 },
  [run, tree]);

  const preset = (p: number[], name: string) => { setTree(p); setRun(null); setLog((l) => [`nova árvore: ${name}`, ...l].slice(0, 6)); };

  return (
    <div className="lab">
      <div className="lab-left">
        <Anim key={run?.key ?? 'idle'} scene={scene} loop={false} />
      </div>
      <div className="lab-right" onKeyDown={(e) => e.stopPropagation()}>
        <label className="lab-label">Valor</label>
        <input className="lab-input" value={val} onChange={(e) => setVal(e.target.value.replace(/[^0-9-]/g, ''))}
          onKeyDown={(e) => { if (e.key === 'Enter') exec('inserir'); }} />
        <div className="lab-btns">
          <button className="b-or" onClick={() => exec('inserir')}>＋ Inserir</button>
          <button className="b-gr" onClick={() => exec('buscar')}>🔍 Buscar</button>
          <button className="b-rd" onClick={() => exec('remover')}>✕ Remover</button>
        </div>
        <label className="lab-label">Percursos</label>
        <div className="lab-btns">
          <button onClick={() => exec('pre')}>Pré</button>
          <button onClick={() => exec('em')}>Em</button>
          <button onClick={() => exec('pos')}>Pós</button>
        </div>
        <label className="lab-label">Árvores prontas</label>
        <div className="lab-btns">
          <button onClick={() => preset([50, 30, 80, 20, 40, 70, 90], 'balanceada')}>Balanceada</button>
          <button onClick={() => preset([10, 20, 30, 40, 50], 'degenerada')}>Degenerada</button>
          <button onClick={() => {
            const vals = Array.from(new Set(Array.from({ length: 9 }, () => 1 + Math.floor(Math.random() * 99))));
            preset(vals, 'aleatória');
          }}>🎲 Aleatória</button>
        </div>
        <div className="lab-log">
          {log.length === 0 ? <i>Histórico das operações aparece aqui.</i> : log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------ Cartão que revela a resposta
export const Reveal: React.FC<{ q: React.ReactNode; a: React.ReactNode }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`reveal-card ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}>
      <div className="reveal-q">{q}</div>
      <div className="reveal-a">{open ? a : <span className="reveal-hint">clique para revelar a resposta</span>}</div>
    </div>
  );
};
