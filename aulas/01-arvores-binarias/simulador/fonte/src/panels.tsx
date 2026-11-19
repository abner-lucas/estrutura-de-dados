import React, { useEffect, useMemo, useRef } from 'react';
import { tokenize } from './code';
import type { Frame, Globals, Id, Tree } from './tracer';

export const IfLogo: React.FC = () => {
  const cells: [number, number, 'c' | 's'][] = [[0, 0, 'c'], [1, 0, 's'], [2, 0, 's'], [0, 1, 's'], [1, 1, 's'], [0, 2, 's'], [1, 2, 's'], [2, 2, 's'], [0, 3, 's'], [1, 3, 's']];
  return (
    <div className="iflogo">
      <svg viewBox="0 0 70 94" width="26" height="35" aria-hidden="true">
        {cells.map(([x, y, t], i) => (t === 'c'
          ? <circle key={i} cx={x * 24 + 10} cy={y * 24 + 10} r={10} fill="#CD191E" />
          : <rect key={i} x={x * 24} y={y * 24} width={20} height={20} rx={2} fill="#fff" />))}
      </svg>
      <div className="iflogo-text"><b>INSTITUTO FEDERAL</b><span>Pará · Campus Breves</span></div>
    </div>
  );
};

export const Chip: React.FC<{ id: Id | null | undefined; tree: Tree }> = ({ id, tree }) =>
  id === null || id === undefined || !tree.nodes[id]
    ? <span className="chip none">None</span>
    : <span className="chip">{tree.nodes[id].valor}</span>;

// ------------------------------------------------------------------ código
export function CodePanel({ lines, active, waiting }: { lines: string[]; active: number; waiting: number[] }) {
  const box = useRef<HTMLDivElement>(null);
  const toks = useMemo(() => lines.map(tokenize), [lines]);
  useEffect(() => {
    const el = box.current?.querySelector(`[data-ln="${active}"]`) as HTMLElement | null;
    if (el && box.current) box.current.scrollTo({ top: el.offsetTop - box.current.clientHeight / 2 + el.clientHeight / 2, behavior: 'smooth' });
  }, [active]);
  return (
    <section className="panel code-panel">
      <h3>Código Python <small>(o mesmo da aula)</small></h3>
      <div className="code-box" ref={box}>
        {toks.map((tk, i) => {
          const ln = i + 1;
          const isActive = ln === active;
          const isWaiting = !isActive && waiting.includes(ln);
          return (
            <div key={i} data-ln={ln} className={`ln ${isActive ? 'active' : ''} ${isWaiting ? 'waiting' : ''}`}>
              <span className="ln-n">{ln}</span>
              <span className="ln-t">{tk.map((t, j) => <span key={j} className={t.c}>{t.t}</span>)}</span>
              {isWaiting && <span className="ln-tag">esperando retorno</span>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ pilha de chamadas
const FN_LABEL: Record<string, string> = { em_ordem: 'em_ordem', pre_ordem: 'pre_ordem', pos_ordem: 'pos_ordem' };

function FrameTitle({ f, tree }: { f: Frame; tree: Tree }) {
  if (f.fn === 'modulo') return <span className="fr-name">programa principal <small>(script)</small></span>;
  if (f.fn === 'init') return <span className="fr-name">No.__init__(valor=<b>{f.valor}</b>)</span>;
  if (f.fn === 'inserir' || f.fn === 'buscar') {
    return <span className="fr-name">{f.fn}(raiz=<Chip id={f.raiz} tree={tree} />, valor=<b>{f.valor}</b>)</span>;
  }
  return <span className="fr-name">{FN_LABEL[f.fn]}(raiz=<Chip id={f.raiz} tree={tree} />)</span>;
}

export function StackPanel({ stack, tree }: { stack: Frame[]; tree: Tree }) {
  const frames = [...stack].reverse();
  return (
    <section className="panel stack-panel">
      <h3>Pilha de chamadas <small>(a de cima é a que está executando)</small></h3>
      <div className="stack-box">
        {frames.length === 0 && <div className="empty">Pilha vazia: nenhuma função em execução.</div>}
        {frames.map((f, i) => (
          <div key={f.uid} className={`frame f-${f.fn} ${i === 0 ? 'top' : ''} ${f.ret !== undefined ? 'returning' : ''}`}>
            <div className="fr-head">
              <span className="fr-depth">{frames.length - i}</span>
              <FrameTitle f={f} tree={tree} />
              {f.line > 0 && <span className="fr-line">linha {f.line}</span>}
            </div>
            {f.elementos && (
              <div className="fr-list">elementos = [{f.elementos.map((v, k) => <b key={k}>{v}</b>)}]</div>
            )}
            {f.ret !== undefined && <div className="fr-ret">↩ return {f.ret}</div>}
            {i > 0 && f.fn !== 'modulo' && <div className="fr-wait">parada na linha {f.line}, esperando a chamada de cima</div>}
          </div>
        ))}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ variáveis
export function VarsPanel({ g, tree }: { g: Globals; tree: Tree }) {
  return (
    <section className="panel vars-panel">
      <h3>Variáveis do programa</h3>
      <div className="vars">
        <div className="var"><code>raiz_completa</code><Chip id={tree.root} tree={tree} /></div>
        {g.numeros && (
          <div className="var wide"><code>numeros</code>
            <span className="list">[{g.numeros.map((v, i) => <b key={i} className={i === g.numIdx ? 'cur' : g.numIdx !== undefined && i < g.numIdx ? 'past' : ''}>{v}</b>)}]</span>
          </div>
        )}
        {g.num !== undefined && <div className="var"><code>num</code><b className="val">{g.num}</b></div>}
        {g.valor_teste !== undefined && <div className="var"><code>valor_teste</code><b className="val">{g.valor_teste}</b></div>}
        {g.temBusca && <div className="var"><code>resultado_busca</code><Chip id={g.resultado_busca} tree={tree} /></div>}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ console
export function ConsolePanel({ lines }: { lines: string[] }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight, behavior: 'smooth' }); }, [lines.length]);
  return (
    <section className="panel console-panel">
      <h3>Saída (print)</h3>
      <div className="console" ref={box}>
        {lines.length === 0 ? <span className="muted">Nada impresso ainda.</span>
          : lines.map((l, i) => <div key={i} className={i === lines.length - 1 ? 'last' : ''}>{l || ' '}</div>)}
      </div>
    </section>
  );
}
