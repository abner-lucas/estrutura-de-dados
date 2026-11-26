import React, { useMemo, useState } from 'react';
import { TreeView, slotKey, type Mark } from './TreeView';
import type { TravKind } from './code';
import {
  emptyTree, finalSlot, insertPlain, pathText, REGRA, HINT, sameSlot, traverseIds, treeFrom,
  type Id, type Slot, type Tree,
} from './tracer';
import { BarrasSvg } from './barras';
import { bipe } from './som';
// a mesma regra usada pela página de conferência do professor (aulas/01-arvores-binarias/conferir/)
import { codigoCupom } from '../../../conferir/codigo-cupom.mjs';

// ------------------------------------------------------------------ cupom de comprovante
// Ao terminar uma missão, o simulador "imprime" um cupom com os dados sorteados e o resultado.
// O aluno copia esses dados na ficha e cola um print do cupom (entrega pelo SIGAA).
type Linha = [string, string];
function Cupom({ missao, num, percurso, linhas }: { missao: string; num: 1 | 2 | 3; percurso?: string; linhas: Linha[] }) {
  const quando = useMemo(() => new Date(), []);
  const dataHora = quando.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  const codigo = codigoCupom({ missao: num, percurso, campos: linhas.map((l) => l[1]), dataHora: quando });
  return (
    <div className="cupom" role="region" aria-label={`Comprovante da missão ${missao}`}>
      <div className="cupom-topo">
        <b>ESTOQUE ABB</b>
        <span>Estrutura de Dados · IFPA Campus Breves</span>
        <span>COMPROVANTE DE MISSÃO</span>
      </div>
      <div className="cupom-sep" />
      <div className="cupom-missao">{missao}</div>
      <dl>
        {linhas.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
      </dl>
      <div className="cupom-sep" />
      <div className="cupom-rodape"><span>{dataHora}</span><span>nº {codigo}</span></div>
      <BarrasSvg valor={codigo} />
      <p className="cupom-dica">Tire um print desta tela e cole na ficha, na Parte E.</p>
    </div>
  );
}

const clone = <T,>(x: T): T => structuredClone(x);
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

function randomValues(n: number): number[] {
  const set = new Set<number>();
  while (set.size < n) set.add(10 + Math.floor(Math.random() * 90));
  return [...set];
}
const height = (t: Tree) => { const h = (id: Id | null): number => (id === null ? 0 : 1 + Math.max(h(t.nodes[id].esq), h(t.nodes[id].dir))); return h(t.root); };
function randomList(n: number, maxH = 4): number[] {
  for (let i = 0; i < 80; i++) { const v = randomValues(n); if (height(treeFrom(v)) <= maxH) return v; }
  return randomValues(n);
}

type Msg = { ok: boolean; text: string } | null;

function Feedback({ msg }: { msg: Msg }) {
  if (!msg) return null;
  return <div className={`ch-msg ${msg.ok ? 'ok' : 'bad'}`}>{msg.text}</div>;
}

// ------------------------------------------------------------------ 1. Monte a árvore
function Montar({ onShowCode, som }: { onShowCode: (nums: number[]) => void; som: boolean }) {
  const [nums, setNums] = useState(() => randomList(7));
  const [k, setK] = useState(0);
  const [t, setT] = useState<Tree>(emptyTree());
  const [errs, setErrs] = useState(0);
  const [tries, setTries] = useState(0);
  const [msg, setMsg] = useState<Msg>(null);
  const [wrong, setWrong] = useState<Mark | null>(null);
  const [reveal, setReveal] = useState<Mark | null>(null);
  const v = nums[k];
  const fim = k >= nums.length;

  const reset = () => { setNums(randomList(7)); setK(0); setT(emptyTree()); setErrs(0); setTries(0); setMsg(null); setWrong(null); setReveal(null); };

  const choose = (s: Slot) => {
    if (fim) return;
    const exp = finalSlot(t, v);
    if (sameSlot(s, exp)) {
      const nt = clone(t);
      insertPlain(nt, v);
      if (som) bipe(k + 1 >= nums.length ? 'ok' : 'cadastro');
      setMsg({ ok: true, text: exp.parent === null ? `O ${v} é o primeiro: vira a raiz.` : `Isso! ${pathText(t, v)} → espaço vazio.` });
      setT(nt); setK(k + 1); setTries(0); setWrong(null); setReveal(null);
    } else {
      const n = tries + 1;
      setErrs(errs + 1); setTries(n);
      if (som) bipe('nao');
      setWrong({ type: 'slot', id: slotKey(s), nonce: Date.now() });
      if (n >= 2) {
        setReveal({ type: 'slot', id: slotKey(exp), nonce: Date.now() });
        setMsg({ ok: false, text: `Veja o caminho completo: ${pathText(t, v)}. O espaço certo está piscando.` });
      } else {
        setMsg({ ok: false, text: `Não é aí. Sempre comece pela raiz: ${pathText(t, v, 1)} …` });
      }
    }
  };

  return (
    <div className="ch-body">
      <div className="ch-side">
        <h2>Monte a árvore</h2>
        <p>Chegou um lote de caixas. Cadastre os códigos <b>na ordem da fila</b>, clicando no espaço vazio (+) onde cada caixa vai ficar. Compare com a raiz e desça.</p>
        <div className="ch-queue">{nums.map((n, i) => <b key={i} className={i < k ? 'past' : i === k ? 'cur' : ''}>{n}</b>)}</div>
        {!fim && <div className="ch-now">Agora: <b>{v}</b></div>}
        <Feedback msg={msg} />
        {fim && (
          <div className="ch-end">
            <Cupom missao="1 · Monte a árvore" num={1} linhas={[['Os 7 números', nums.join(', ')], ['Raiz', String(nums[0])], ['Nº de erros', String(errs)]]} />
            <button className="btn" onClick={() => onShowCode(nums)}>Ver esta árvore sendo montada no simulador</button>
          </div>
        )}
        <button className="btn" onClick={reset}>Nova rodada</button>
      </div>
      <div className="ch-tree">
        <TreeView tree={t} onPickSlot={fim ? undefined : choose} wrong={wrong} reveal={reveal} emptyText="estoque vazio: clique no + para colocar a raiz" />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ 2. Ordem de visita
function Percurso({ som }: { som: boolean }) {
  const [t, setT] = useState(() => treeFrom(randomList(8)));
  const [kind, setKind] = useState<TravKind>('em_ordem');
  const order = useMemo(() => traverseIds(t, kind), [t, kind]);
  const [k, setK] = useState(0);
  const [errs, setErrs] = useState(0);
  const [tries, setTries] = useState(0);
  const [msg, setMsg] = useState<Msg>(null);
  const [wrong, setWrong] = useState<Mark | null>(null);
  const [reveal, setReveal] = useState<Mark | null>(null);
  const fim = k >= order.length;
  const badges: Record<Id, number> = {};
  order.slice(0, k).forEach((id, i) => { badges[id] = i + 1; });

  const restart = (nt: Tree, nk: TravKind) => { setT(nt); setKind(nk); setK(0); setErrs(0); setTries(0); setMsg(null); setWrong(null); setReveal(null); };

  const click = (id: Id) => {
    if (fim || badges[id] !== undefined) return;
    if (id === order[k]) {
      setK(k + 1); setTries(0); setWrong(null); setReveal(null);
      if (som) bipe(k + 1 >= order.length ? 'ok' : 'leitura');
      setMsg({ ok: true, text: `${t.nodes[id].valor} entra na lista.` });
    } else {
      const n = tries + 1;
      setErrs(errs + 1); setTries(n);
      if (som) bipe('nao');
      setWrong({ type: 'node', id: String(id), nonce: Date.now() });
      if (n >= 2) {
        setReveal({ type: 'node', id: String(order[k]), nonce: Date.now() });
        setMsg({ ok: false, text: `O próximo é o ${t.nodes[order[k]].valor} (piscando). ${HINT[kind]}` });
      } else setMsg({ ok: false, text: `Ainda não. ${HINT[kind]}` });
    }
  };

  return (
    <div className="ch-body">
      <div className="ch-side">
        <h2>Ordem de visita</h2>
        <div className="seg">
          {(['em_ordem', 'pre_ordem', 'pos_ordem'] as TravKind[]).map((kk) => (
            <button key={kk} className={kk === kind ? 'on' : ''} onClick={() => restart(t, kk)}>{kk.replace('_', '-')}</button>
          ))}
        </div>
        <p>O gerente pediu o relatório. <b>{REGRA[kind]}</b>: clique nas caixas na ordem em que elas entram na lista (<code>elementos.append</code>).</p>
        <div className="ch-queue">[{order.slice(0, k).map((id, i) => <b key={i}>{t.nodes[id].valor}</b>)}{!fim && <i>?</i>}]</div>
        <Feedback msg={msg} />
        {fim && (
          <div className="ch-end">
            <Cupom missao={`2 · Ordem de visita (${kind})`} num={2} percurso={kind} linhas={(() => { const vs = order.map((id) => t.nodes[id].valor); return [['Menor e maior nó', `${Math.min(...vs)} e ${Math.max(...vs)}`], ['Lista final gerada', `[${vs.join(', ')}]`], ['Nº de erros', String(errs)]] as Linha[]; })()} />
          </div>
        )}
        <button className="btn" onClick={() => restart(treeFrom(randomList(8)), kind)}>Nova árvore</button>
      </div>
      <div className="ch-tree">
        <TreeView tree={t} badges={badges} done={order.slice(0, k)} onPickNode={click} wrong={wrong} reveal={reveal} rootLabel="raiz" />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ 3. Caminho da busca
function novaBusca() {
  const vals = randomList(8);
  const t = treeFrom(vals);
  let alvo: number;
  if (Math.random() < 0.5) alvo = pick(vals);
  else { do { alvo = 10 + Math.floor(Math.random() * 90); } while (vals.includes(alvo)); }
  return { t, alvo };
}

function Busca({ som }: { som: boolean }) {
  const [{ t, alvo }, setJogo] = useState(novaBusca);
  const caminho = useMemo(() => {
    const ids: Id[] = [];
    let cur = t.root;
    let fimSlot: Slot | null = null;
    while (cur !== null) {
      ids.push(cur);
      const n = t.nodes[cur];
      if (n.valor === alvo) break;
      const s = n.valor > alvo ? 'esq' : 'dir';
      if (n[s] === null) { fimSlot = { parent: cur, side: s }; break; }
      cur = n[s];
    }
    return { ids, fimSlot };
  }, [t, alvo]);
  const [k, setK] = useState(0);
  const [errs, setErrs] = useState(0);
  const [tries, setTries] = useState(0);
  const [msg, setMsg] = useState<Msg>(null);
  const [fim, setFim] = useState<'achou' | 'none' | null>(null);
  const [wrong, setWrong] = useState<Mark | null>(null);
  const [reveal, setReveal] = useState<Mark | null>(null);

  const restart = () => { setJogo(novaBusca()); setK(0); setErrs(0); setTries(0); setMsg(null); setFim(null); setWrong(null); setReveal(null); };

  const ultimo = k > 0 ? caminho.ids[k - 1] : null;
  const vagas: Slot[] = ultimo === null ? [] : (['esq', 'dir'] as const).filter((s) => t.nodes[ultimo][s] === null).map((s) => ({ parent: ultimo, side: s }));

  const errar = (mark: Mark, certo: Mark, dica: string) => {
    const n = tries + 1;
    setErrs(errs + 1); setTries(n); setWrong(mark);
    if (som) bipe('nao');
    if (n >= 2) { setReveal(certo); setMsg({ ok: false, text: `O próximo passo está piscando. ${dica}` }); }
    else setMsg({ ok: false, text: dica });
  };
  const certoAgora = (): Mark => (k < caminho.ids.length
    ? { type: 'node', id: String(caminho.ids[k]), nonce: Date.now() }
    : { type: 'slot', id: slotKey(caminho.fimSlot!), nonce: Date.now() });
  const dica = () => (ultimo === null ? 'Toda busca começa pela raiz.' : `Compare: ${t.nodes[ultimo].valor} > ${alvo}? ${t.nodes[ultimo].valor > alvo ? 'Sim → esquerda.' : 'Não → direita.'}`);

  const clickNode = (id: Id) => {
    if (fim || caminho.ids.slice(0, k).includes(id)) return;
    if (k < caminho.ids.length && id === caminho.ids[k]) {
      setK(k + 1); setTries(0); setWrong(null); setReveal(null);
      if (t.nodes[id].valor === alvo) { if (som) bipe('ok'); setFim('achou'); setMsg({ ok: true, text: `${alvo} == ${alvo}: encontrado em ${k + 1} chamada(s) de buscar!` }); }
      else { if (som) bipe('leitura'); setMsg({ ok: true, text: `buscar(raiz=${t.nodes[id].valor}, valor=${alvo})` }); }
    } else errar({ type: 'node', id: String(id), nonce: Date.now() }, certoAgora(), dica());
  };
  const clickSlot = (s: Slot) => {
    if (fim) return;
    if (caminho.fimSlot && k === caminho.ids.length && sameSlot(s, caminho.fimSlot)) {
      setFim('none'); setTries(0); setWrong(null); setReveal(null);
      if (som) bipe('nao');
      setMsg({ ok: true, text: `Chegou em None: o ${alvo} NÃO está no estoque (return None).` });
    } else errar({ type: 'slot', id: slotKey(s), nonce: Date.now() }, certoAgora(), dica());
  };

  return (
    <div className="ch-body">
      <div className="ch-side">
        <h2>Caminho da busca</h2>
        <p>Um cliente pediu o produto <b className="alvo">{alvo}</b>. Faça o papel do leitor (<code>buscar</code>): clique nas caixas que ele visita, em ordem. Se chegar a um espaço vazio, clique nele (é o <code>None</code>).</p>
        <div className="ch-queue">{caminho.ids.slice(0, k).map((id, i) => <b key={i}>{t.nodes[id].valor}</b>)}{!fim && <i>?</i>}</div>
        <Feedback msg={msg} />
        {fim && (
          <div className="ch-end">
            <p>A busca visitou só {caminho.ids.length} de {Object.keys(t.nodes).length} caixas.</p>
            <Cupom missao="3 · Caminho da busca" num={3} linhas={[['Valor buscado', String(alvo)], ['Encontrou?', fim === 'achou' ? 'Sim' : 'Não'], ['Caminho', caminho.ids.map((id) => t.nodes[id].valor).join(' → ') + (fim === 'none' ? ' → None' : '')], ['Nº de erros', String(errs)]]} />
          </div>
        )}
        <button className="btn" onClick={restart}>Nova busca</button>
      </div>
      <div className="ch-tree">
        <TreeView tree={t} rootLabel="raiz" onPickNode={clickNode} onPickSlot={clickSlot} onlySlots={fim ? [] : vagas}
          stack={caminho.ids.slice(0, k)} found={fim === 'achou' ? caminho.ids[k - 1] : undefined} wrong={wrong} reveal={reveal} />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
type Kind = 'montar' | 'percurso' | 'busca';
export function Challenges({ onShowCode, som }: { onShowCode: (nums: number[]) => void; som: boolean }) {
  const [kind, setKind] = useState<Kind>('montar');
  return (
    <div className="challenges">
      <nav className="ch-tabs">
        <button className={kind === 'montar' ? 'on' : ''} onClick={() => setKind('montar')}>1 · Monte a árvore</button>
        <button className={kind === 'percurso' ? 'on' : ''} onClick={() => setKind('percurso')}>2 · Ordem de visita</button>
        <button className={kind === 'busca' ? 'on' : ''} onClick={() => setKind('busca')}>3 · Caminho da busca</button>
      </nav>
      {kind === 'montar' ? <Montar onShowCode={onShowCode} som={som} /> : kind === 'percurso' ? <Percurso som={som} /> : <Busca som={som} />}
    </div>
  );
}
