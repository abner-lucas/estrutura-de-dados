import React, { useEffect, useMemo, useState } from 'react';
import { TreeView, slotKey, type Mark } from './TreeView';
import type { TravKind } from './code';
import {
  emptyTree, finalSlot, insertPlain, pathText, REGRA, HINT, sameSlot, traverseIds, treeFrom,
  type Id, type Slot, type Tree,
} from './tracer';
import { cupomPng } from './imagem';
import { BotoesImagem } from './BotoesImagem';
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
  const dados = useMemo(() => ({ missao, linhas, dataHora, codigo }), [codigo]); // eslint-disable-line react-hooks/exhaustive-deps
  const [url, setUrl] = useState<string | null>(null);
  // o cupom é desenhado como imagem PNG: dá para arrastar para a ficha ou copiar
  useEffect(() => {
    let vivo = true, atual = '';
    cupomPng(dados).then((b) => { if (vivo) { atual = URL.createObjectURL(b); setUrl(atual); } });
    return () => { vivo = false; if (atual) URL.revokeObjectURL(atual); };
  }, [dados]);
  const descricao = `Comprovante da missão ${missao}: ${linhas.map(([k, v]) => `${k}: ${v}`).join('; ')}; ${dataHora}; número ${codigo}.`;
  return (
    <div className="cupom-area">
      {url ? <img className="cupom-img" src={url} alt={descricao} draggable title="Arraste esta imagem para a ficha" />
        : <div className="cupom-carregando">imprimindo comprovante…</div>}
      <BotoesImagem gerar={() => cupomPng(dados)} nome={`cupom-missao-${num}-${codigo}.png`} />
      <p className="cupom-dica">Arraste a imagem para a ficha (Parte E) ou clique em <b>Copiar imagem</b> e cole com Ctrl + V.</p>
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
      // só a regra: o aluno refaz as comparações sozinho
      setMsg({ ok: false, text: n >= 2
        ? `Ainda não. Refaça devagar: compare o ${v} com a raiz e, em cada caixa, menor vai para a esquerda, maior ou igual para a direita, até achar um espaço vazio.`
        : `Não é aí. Comece pela raiz e compare o ${v} com cada caixa: menor ← | → maior ou igual.` });
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
      setMsg({ ok: false, text: `Ainda não. ${HINT[kind]}` });
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
    void certo; void n; // nada é revelado: só a regra
    setMsg({ ok: false, text: dica });
  };
  const certoAgora = (): Mark => (k < caminho.ids.length
    ? { type: 'node', id: String(caminho.ids[k]), nonce: Date.now() }
    : { type: 'slot', id: slotKey(caminho.fimSlot!), nonce: Date.now() });
  // a dica lembra a regra sem fazer a comparação pelo aluno
  const dica = () => (ultimo === null ? 'Ainda não. Toda busca começa pela raiz.' : `Ainda não. Compare o ${alvo} com o ${t.nodes[ultimo].valor}: menor vai para a esquerda, maior ou igual para a direita. Se o lado estiver vazio, é o None.`);

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
      {/* as três ficam montadas: trocar de aba não apaga a rodada nem o cupom
          (só recomeçam ao recarregar a página, voltar ao Simulador ou clicar em Nova rodada) */}
      <div className="ch-painel" hidden={kind !== 'montar'}><Montar onShowCode={onShowCode} som={som} /></div>
      <div className="ch-painel" hidden={kind !== 'percurso'}><Percurso som={som} /></div>
      <div className="ch-painel" hidden={kind !== 'busca'}><Busca som={som} /></div>
    </div>
  );
}
