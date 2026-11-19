import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { buildCode, type TravKind } from './code';
import { emptyTree, runOp, runScript, sameSlot, type Id, type Run, type Slot, type Tree } from './tracer';
import { TreeView, slotKey, type Mark } from './TreeView';
import { CodePanel, ConsolePanel, IfLogo, StackPanel, VarsPanel } from './panels';
import { Challenges } from './Challenges';

type Nivel = 'nenhuma' | 'essenciais' | 'todas';
type Answer = { tries: number; done: boolean; ok: boolean };

const parseNums = (s: string | null) => {
  if (!s) return null;
  const v = s.split(/[^0-9-]+/).filter(Boolean).map(Number).filter((n) => Number.isFinite(n) && n > -1000 && n < 1000);
  return v.length ? v.slice(0, 15) : null;
};
const params = new URLSearchParams(location.search);
const NIVEIS: Nivel[] = ['nenhuma', 'essenciais', 'todas'];
const INIT = {
  numeros: parseNums(params.get('numeros')) ?? [45, 20, 60, 10, 30, 50, 70],
  busca: parseNums(params.get('busca'))?.[0] ?? 30,
  nivel: (NIVEIS.includes(params.get('perguntas') as Nivel) ? params.get('perguntas') : 'essenciais') as Nivel,
  modo: params.get('modo') === 'desafios' ? 'desafios' : 'codigo',
};

function emptyRun(t: Tree): Run {
  return { title: 'árvore vazia', final: t, snaps: [{ line: 0, note: 'A árvore está vazia. Use "inserir" ou rode o script completo.', tree: t, stack: [], console: [], globals: {}, done: [] }] };
}

// ------------------------------------------------------------------ painel do professor
function Settings({ numeros, valorTeste, nivel, onApply, onClose }: {
  numeros: number[]; valorTeste: number; nivel: Nivel; onApply: (n: number[], v: number) => void; onClose: () => void;
}) {
  const [txt, setTxt] = useState(numeros.join(', '));
  const [vt, setVt] = useState(String(valorTeste));
  const [copiado, setCopiado] = useState(false);
  const nums = parseNums(txt) ?? numeros;
  const v = parseNums(vt)?.[0] ?? valorTeste;
  const link = () => {
    const u = new URL(location.href);
    u.search = '';
    u.hash = '';
    u.searchParams.set('numeros', nums.join(','));
    u.searchParams.set('busca', String(v));
    u.searchParams.set('perguntas', nivel);
    return u.toString();
  };
  return (
    <div className="settings" role="dialog" aria-label="Configurações do professor">
      <div className="set-row">
        <label>numeros = [<input value={txt} onChange={(e) => setTxt(e.target.value)} />]</label>
        <label>valor_teste = <input className="short" value={vt} onChange={(e) => setVt(e.target.value)} /></label>
        <button className="btn primary" onClick={() => onApply(nums, v)}>Aplicar e rodar o script</button>
        <button className="btn" onClick={() => { navigator.clipboard?.writeText(link()); setCopiado(true); setTimeout(() => setCopiado(false), 2000); }}>
          {copiado ? '✔ Link copiado' : '🔗 Copiar link para os alunos'}
        </button>
        <button className="btn ghost" onClick={onClose} aria-label="Fechar">✕</button>
      </div>
      <p className="set-help">O link abre o simulador já com esta lista, este valor de busca e o nível de perguntas atual. Até 15 números.</p>
    </div>
  );
}

// ------------------------------------------------------------------
export function App() {
  const [mode, setMode] = useState(INIT.modo);
  const [numeros, setNumeros] = useState(INIT.numeros);
  const [valorTeste, setValorTeste] = useState(INIT.busca);
  const [nivel, setNivel] = useState<Nivel>(INIT.nivel);
  const code = useMemo(() => buildCode(numeros, valorTeste), [numeros, valorTeste]);

  const [tree, setTree] = useState<Tree>(emptyTree());
  const [run, setRun] = useState<Run>(() => runScript(INIT.numeros, INIT.busca, buildCode(INIT.numeros, INIT.busca).L));
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [wrong, setWrong] = useState<Mark | null>(null);
  const [wrongChoice, setWrongChoice] = useState<number | null>(null);
  const [reveal, setReveal] = useState<Mark | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const [opVal, setOpVal] = useState('25');
  const [score, setScore] = useState({ ok: 0, total: 0 });
  const [showCfg, setShowCfg] = useState(false);

  useEffect(() => { setTree(run.final); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const last = run.snaps.length - 1;
  const snap = run.snaps[Math.min(idx, last)];
  const levelOn = (lv: 1 | 2) => nivel === 'todas' || (nivel === 'essenciais' && lv === 1);
  const blocked = useCallback((i: number) => {
    const q = run.snaps[i]?.q;
    return !!q && levelOn(q.level) && !answers[i]?.done;
  }, [run, answers, nivel]); // eslint-disable-line react-hooks/exhaustive-deps
  const q = snap.q && levelOn(snap.q.level) && !answers[idx]?.done ? snap.q : undefined;
  const revealed = !!q && (answers[idx]?.tries ?? 0) >= 2;
  const canNext = idx < last && !blocked(idx);

  const clearMarks = () => { setWrong(null); setWrongChoice(null); setReveal(null); };
  const go = (i: number) => { setIdx(i); setFeedback(null); clearMarks(); };

  const start = (r: Run) => {
    setRun(r); setTree(r.final); setIdx(0); setAnswers({}); setFeedback(null); clearMarks(); setPlaying(false);
  };

  const next = useCallback(() => {
    if (idx >= last || blocked(idx)) return false;
    go(idx + 1);
    return true;
  }, [idx, last, blocked]);
  const back = () => { setPlaying(false); if (idx > 0) go(idx - 1); };
  const runUntil = (cond: (depth: number) => boolean) => {
    setPlaying(false);
    let j = idx;
    while (j < last && !blocked(j)) {
      j++;
      if (cond(run.snaps[j].stack.length)) break;
    }
    go(j);
  };
  const d0 = snap.stack.length;
  const stepOver = () => runUntil((d) => d <= d0);
  const stepOut = () => runUntil((d) => d < d0);

  // reprodução automática: para sozinha nas perguntas
  useEffect(() => {
    if (!playing) return;
    if (!canNext) { setPlaying(false); return; }
    const t = setTimeout(() => next(), 1000 / speed);
    return () => clearTimeout(t);
  }, [playing, idx, speed, canNext, next]);

  // atalhos de teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || mode !== 'codigo') return;
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
      else if (e.key === ' ') { e.preventDefault(); setPlaying((p) => !p); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ------------------------------------------------------------ respostas
  const acertou = (explain: string) => {
    const a = answers[idx] ?? { tries: 0, done: false, ok: false };
    const first = a.tries === 0;
    setAnswers({ ...answers, [idx]: { tries: a.tries + 1, done: true, ok: first } });
    setScore((s) => ({ ok: s.ok + (first ? 1 : 0), total: s.total + 1 }));
    clearMarks();
    setFeedback({ ok: true, text: `${first ? '✔ Correto!' : '✔ Agora sim!'} ${explain}` });
    if (idx < last) setIdx(idx + 1);
  };
  const errou = (hint: string | undefined, mark: Mark | null, certo: Mark | null, respostaTxt: string, explain: string) => {
    const a = answers[idx] ?? { tries: 0, done: false, ok: false };
    const tries = a.tries + 1;
    setAnswers({ ...answers, [idx]: { tries, done: false, ok: false } });
    setWrong(mark);
    if (tries >= 2) {
      setReveal(certo);
      setFeedback({ ok: false, text: `A resposta é: ${respostaTxt}. ${explain}` });
    } else {
      setFeedback({ ok: false, text: `✖ Ainda não. ${hint ?? 'Releia a linha destacada com calma.'}` });
    }
  };
  const continuar = () => {
    setAnswers({ ...answers, [idx]: { ...(answers[idx] ?? { tries: 2, ok: false }), done: true } });
    setScore((s) => ({ ...s, total: s.total + 1 }));
    clearMarks();
    setFeedback(null);
    if (idx < last) setIdx(idx + 1);
  };
  const answerChoice = (i: number) => {
    if (!q || q.kind !== 'choice' || revealed) return;
    if (i === q.answer) acertou(q.explain);
    else { setWrongChoice(i); errou(q.hint, null, null, q.options[q.answer], q.explain); }
  };
  const answerNode = (id: Id) => {
    if (!q || q.kind !== 'node' || revealed) return;
    if (id === q.answer) acertou(q.explain);
    else errou(q.hint, { type: 'node', id: String(id), nonce: Date.now() }, { type: 'node', id: String(q.answer), nonce: Date.now() }, `o ${snap.tree.nodes[q.answer].valor} (piscando)`, q.explain);
  };
  const answerSlot = (s: Slot) => {
    if (!q || q.kind !== 'slot' || revealed) return;
    if (sameSlot(s, q.answer)) acertou(q.explain);
    else errou(q.hint, { type: 'slot', id: slotKey(s), nonce: Date.now() }, { type: 'slot', id: slotKey(q.answer), nonce: Date.now() }, 'a vaga que está piscando', q.explain);
  };

  // ------------------------------------------------------------ operações
  const val = parseNums(opVal)?.[0];
  const op = (kind: 'inserir' | 'buscar' | TravKind) => {
    if ((kind === 'inserir' || kind === 'buscar') && val === undefined) return;
    if (kind === 'inserir' && Object.keys(tree.nodes).length >= 31) return;
    start(kind === 'inserir' || kind === 'buscar' ? runOp(tree, { kind, valor: val! }, code.L) : runOp(tree, { kind }, code.L));
  };
  const runAll = (n = numeros, v = valorTeste) => start(runScript(n, v, buildCode(n, v).L));

  // ------------------------------------------------------------ o que mostrar na árvore
  const opFrames = snap.stack.filter((f) => f.fn !== 'modulo' && f.fn !== 'init');
  const top = opFrames[opFrames.length - 1];
  const focus = top && top.raiz !== null ? top.raiz : null;
  const noneSlot: Slot | null = top && top.raiz === null && top.parent !== undefined ? { parent: top.parent ?? null, side: top.side ?? null } : null;
  const stackIds = opFrames.map((f) => f.raiz).filter((r): r is Id => r !== null && r !== undefined);
  const token = top && (top.fn === 'inserir' || top.fn === 'buscar') && top.valor !== undefined
    ? { valor: top.valor, at: top.raiz ?? null, slot: noneSlot, busca: top.fn === 'buscar' } : undefined;
  const badges: Record<Id, number> = {};
  snap.done.forEach((id, i) => { badges[id] = i + 1; });
  const waiting = snap.stack.slice(0, -1).map((f) => f.line).filter((l) => l > 0);
  const tweenMs = playing ? Math.min(520, 800 / speed) : 520;

  if (mode === 'desafios') {
    return (
      <div className="app">
        <Header mode={mode} setMode={setMode} score={null} onCfg={() => setShowCfg(!showCfg)} />
        <Challenges onShowCode={(nums) => { setNumeros(nums); setMode('codigo'); runAll(nums, valorTeste); }} />
      </div>
    );
  }

  return (
    <div className="app">
      <Header mode={mode} setMode={setMode} score={score} onCfg={() => setShowCfg(!showCfg)} />
      {showCfg && (
        <Settings numeros={numeros} valorTeste={valorTeste} nivel={nivel} onClose={() => setShowCfg(false)}
          onApply={(n, v) => { setNumeros(n); setValorTeste(v); runAll(n, v); setShowCfg(false); }} />
      )}
      <div className="opbar">
        <button className="btn primary" onClick={() => runAll()}>▶ Rodar o script inteiro</button>
        <span className="sep" />
        <label className="opval">valor <input value={opVal} onChange={(e) => setOpVal(e.target.value)} inputMode="numeric" aria-label="valor" /></label>
        <button className="btn" onClick={() => op('inserir')} disabled={val === undefined}>inserir</button>
        <button className="btn" onClick={() => op('buscar')} disabled={val === undefined || tree.root === null}>buscar</button>
        <span className="sep" />
        {(['em_ordem', 'pre_ordem', 'pos_ordem'] as TravKind[]).map((k) => (
          <button key={k} className="btn" onClick={() => op(k)} disabled={tree.root === null}>{k}</button>
        ))}
        <span className="sep" />
        <button className="btn ghost" onClick={() => { const t = emptyTree(); start(emptyRun(t)); }}>Limpar árvore</button>
        <label className="nivel">Perguntas
          <select value={nivel} onChange={(e) => setNivel(e.target.value as Nivel)}>
            <option value="nenhuma">Desligadas</option>
            <option value="essenciais">Essenciais</option>
            <option value="todas">Todas (desafiador)</option>
          </select>
        </label>
      </div>

      <main className="main">
        <div className="left">
          <section className="panel tree-panel">
            <h3>Árvore <small>{run.title}</small></h3>
            <TreeView tree={snap.tree} pending={snap.pending} flash={snap.flash} flashKey={idx} focus={focus} stack={stackIds}
              noneSlot={noneSlot} token={token} done={snap.done} appended={snap.appended} found={snap.found} badges={badges}
              onPickNode={q?.kind === 'node' && !revealed ? answerNode : undefined}
              onPickSlot={q?.kind === 'slot' && !revealed ? answerSlot : undefined}
              wrong={wrong} reveal={reveal} tweenMs={tweenMs} emptyText="raiz_completa = None (árvore vazia)" />
            <div className="legend">
              <span><i className="lg focus" /> chamada atual</span>
              <span><i className="lg stackb">2</i> chamadas na pilha</span>
              <span><i className="lg done" /> já na lista</span>
              <span><i className="lg pend" /> criado, não ligado</span>
              <span><i className="lg tok">30</i> valor da chamada</span>
            </div>
          </section>

          <section className={`panel stepbox ${q ? 'asking' : ''}`} aria-live="polite">
            {feedback && <div className={`fb ${feedback.ok ? 'ok' : 'bad'}`}>{feedback.text}</div>}
            <div className="note">
              {snap.line > 0 && <span className="lntag">linha {snap.line}</span>}
              <p>{snap.note}</p>
            </div>
            {q && (
              <div className="ask">
                <div className="ask-title">🤔 Sua vez: {q.text}</div>
                {q.kind === 'choice' ? (
                  <div className="ask-opts">
                    {q.options.map((o, i) => (
                      <button key={i} className={`opt ${wrongChoice === i ? 'wrong' : ''} ${revealed && i === q.answer ? 'right' : ''}`}
                        onClick={() => answerChoice(i)} disabled={revealed}>{o}</button>
                    ))}
                  </div>
                ) : (
                  <p className="ask-hint">👆 {q.kind === 'node' ? 'Clique em um nó da árvore.' : 'Clique em uma vaga ⊕ na árvore.'}</p>
                )}
                {revealed && <button className="btn primary" onClick={continuar}>Entendi, continuar ▶</button>}
              </div>
            )}
          </section>

          <div className="controls">
            <button className="btn icon" onClick={() => go(0)} title="Voltar ao início" aria-label="Voltar ao início">⏮</button>
            <button className="btn" onClick={back} disabled={idx === 0}>◀ Voltar</button>
            <button className="btn primary big" onClick={() => next()} disabled={!canNext}>Próximo passo ▶</button>
            <button className="btn" onClick={stepOver} disabled={!canNext} title="Executa a chamada inteira e para quando ela devolver o resultado">⤼ Pular chamada</button>
            <button className="btn" onClick={stepOut} disabled={!canNext} title="Executa até a função atual terminar">⤴ Terminar função</button>
            <button className="btn" onClick={() => setPlaying(!playing)} disabled={!canNext && !playing}>{playing ? '⏸ Pausar' : '⏵ Reproduzir'}</button>
            <label className="speed" title="Velocidade da reprodução">🐢<input type="range" min={0.5} max={4} step={0.5} value={speed} onChange={(e) => setSpeed(+e.target.value)} />🐇</label>
            <div className="prog">
              <div className="bar"><div style={{ width: `${((idx + 1) / run.snaps.length) * 100}%` }} /></div>
              <span>{q ? 'responda para continuar' : `passo ${idx + 1} de ${run.snaps.length}`}</span>
            </div>
          </div>

          <div className="bottom">
            <VarsPanel g={snap.globals} tree={snap.tree} />
            <ConsolePanel lines={snap.console} />
          </div>
        </div>

        <div className="right">
          <CodePanel lines={code.lines} active={snap.line} waiting={waiting} />
          <StackPanel stack={snap.stack} tree={snap.tree} />
        </div>
      </main>
    </div>
  );
}

function Header({ mode, setMode, score, onCfg }: { mode: string; setMode: (m: string) => void; score: { ok: number; total: number } | null; onCfg: () => void }) {
  return (
    <header className="topbar">
      <IfLogo />
      <div className="title">
        <h1>Simulador de Árvore Binária de Busca</h1>
        <span>Estrutura de Dados · o código Python executando, linha por linha</span>
      </div>
      <nav className="modes">
        <button className={mode === 'codigo' ? 'on' : ''} onClick={() => setMode('codigo')}>▶ Executar o código</button>
        <button className={mode === 'desafios' ? 'on' : ''} onClick={() => setMode('desafios')}>🎯 Desafios</button>
      </nav>
      {score && <div className="score" title="Perguntas acertadas na primeira tentativa">🎯 {score.ok}/{score.total} de primeira</div>}
      {mode === 'codigo' && <button className="btn ghost light" onClick={onCfg}>⚙ Professor</button>}
      <a className="btn ghost light portal-link" href="../../../index.html#atividades" title="Voltar ao portal de Estrutura de Dados">← Portal</a>
    </header>
  );
}
