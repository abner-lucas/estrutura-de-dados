// Executa o código da aula passo a passo, imitando o Python linha por linha,
// e grava um "retrato" (Snap) do programa a cada linha executada.
import type { LineMap, TravKind } from './code';

export type Id = number;
export type Side = 'esq' | 'dir';
export interface TNode { id: Id; valor: number; esq: Id | null; dir: Id | null }
export interface Tree { nodes: Record<Id, TNode>; root: Id | null; nextId: number }
export interface Slot { parent: Id | null; side: Side | null }
export interface Pending { id: Id; parent: Id | null; side: Side | null }

export type Fn = 'modulo' | 'init' | 'inserir' | 'buscar' | TravKind;
export interface Frame {
  uid: number;
  fn: Fn;
  line: number;
  raiz?: Id | null;
  valor?: number;
  parent?: Id | null; // onde esta chamada está "pendurada" na árvore (útil quando raiz é None)
  side?: Side | null;
  elementos?: number[];
  ret?: string; // valor que está sendo devolvido (só no passo do return)
}
export interface Globals { numeros?: number[]; num?: number; numIdx?: number; valor_teste?: number; resultado_busca?: Id | null; temBusca?: boolean; script?: boolean }

export type Question =
  | { kind: 'choice'; level: 1 | 2; text: string; options: string[]; answer: number; explain: string; hint?: string }
  | { kind: 'node'; level: 1 | 2; text: string; answer: Id; explain: string; hint?: string }
  | { kind: 'slot'; level: 1 | 2; text: string; answer: Slot; explain: string; hint?: string; valor: number };

export interface Snap {
  line: number;
  note: string;
  tree: Tree;
  stack: Frame[];
  console: string[];
  globals: Globals;
  pending?: Pending;
  flash?: { parent: Id | null; side: Side | null; child: Id | null; same: boolean };
  done: Id[];
  appended?: Id;
  found?: Id | null;
  q?: Question;
}

export interface Run { title: string; snaps: Snap[]; final: Tree }

export const emptyTree = (): Tree => ({ nodes: {}, root: null, nextId: 1 });
const clone = <T,>(x: T): T => structuredClone(x);

// ------------------------------------------------------------------ utilidades sem animação
export function insertPlain(t: Tree, v: number) {
  const id = t.nextId++;
  t.nodes[id] = { id, valor: v, esq: null, dir: null };
  if (t.root === null) { t.root = id; return; }
  let cur = t.root;
  for (;;) {
    const n = t.nodes[cur];
    const s: Side = n.valor > v ? 'esq' : 'dir';
    if (n[s] === null) { n[s] = id; return; }
    cur = n[s]!;
  }
}
export function treeFrom(values: number[]): Tree {
  const t = emptyTree();
  values.forEach((v) => insertPlain(t, v));
  return t;
}
export function finalSlot(t: Tree, v: number): Slot {
  if (t.root === null) return { parent: null, side: null };
  let cur = t.root;
  for (;;) {
    const n = t.nodes[cur];
    const s: Side = n.valor > v ? 'esq' : 'dir';
    if (n[s] === null) return { parent: cur, side: s };
    cur = n[s]!;
  }
}
// "45 > 30? sim → esquerda · 20 > 30? não → direita"
export function pathText(t: Tree, v: number, max = 99): string {
  const parts: string[] = [];
  let cur = t.root;
  while (cur !== null && parts.length < max) {
    const n = t.nodes[cur];
    const maior = n.valor > v;
    parts.push(`${n.valor} > ${v}? ${maior ? 'sim → esquerda' : 'não → direita'}`);
    cur = maior ? n.esq : n.dir;
  }
  return parts.join(' · ');
}
export function traverseIds(t: Tree, kind: TravKind): Id[] {
  const out: Id[] = [];
  const walk = (id: Id | null) => {
    if (id === null) return;
    const n = t.nodes[id];
    if (kind === 'pre_ordem') out.push(id);
    walk(n.esq);
    if (kind === 'em_ordem') out.push(id);
    walk(n.dir);
    if (kind === 'pos_ordem') out.push(id);
  };
  walk(t.root);
  return out;
}
export const sameSlot = (a: Slot, b: Slot) => a.parent === b.parent && a.side === b.side;

export const REGRA: Record<TravKind, string> = {
  em_ordem: 'Em-ordem = Esquerda → Raiz → Direita',
  pre_ordem: 'Pré-ordem = Raiz → Esquerda → Direita',
  pos_ordem: 'Pós-ordem = Esquerda → Direita → Raiz',
};
export const HINT: Record<TravKind, string> = {
  em_ordem: 'No em-ordem, um nó só entra na lista depois que TODA a subárvore esquerda dele já entrou.',
  pre_ordem: 'No pré-ordem, o append vem ANTES das chamadas: o nó entra assim que a chamada começa, e depois desce pela esquerda.',
  pos_ordem: 'No pós-ordem, o append vem DEPOIS das duas chamadas: um nó só entra quando os dois filhos já entraram.',
};
const ladoNome = (s: Side) => (s === 'esq' ? 'esquerda' : 'direita');
const filhoNome = (s: Side) => (s === 'esq' ? 'esquerdo' : 'direito');

// ------------------------------------------------------------------ o executor
class Tracer {
  t: Tree;
  stack: Frame[] = [];
  out: string[] = [];
  g: Globals = {};
  snaps: Snap[] = [];
  pending?: Pending;
  done: Id[] = [];
  uid = 0;
  initShown = false;

  constructor(tree: Tree, readonly L: LineMap) { this.t = clone(tree); }

  v(id: Id | null | undefined) { return id === null || id === undefined ? 'None' : String(this.t.nodes[id].valor); }
  count() { let c = 0; const w = (id: Id | null) => { if (id === null) return; c++; w(this.t.nodes[id].esq); w(this.t.nodes[id].dir); }; w(this.t.root); return c; }

  push(f: Omit<Frame, 'uid'>) { const fr: Frame = { ...f, uid: ++this.uid }; this.stack.push(fr); return fr; }
  pop() { this.stack.pop(); }

  emit(line: number, note: string, extra: Partial<Snap> = {}) {
    const top = this.stack[this.stack.length - 1];
    if (top) top.line = line;
    this.snaps.push({
      line, note, tree: clone(this.t), stack: clone(this.stack), console: [...this.out], globals: clone(this.g),
      pending: this.pending ? { ...this.pending } : undefined, done: [...this.done], ...extra,
    });
    if (top) delete top.ret;
  }

  // ------------------------------------------------ No(valor) e __init__
  criarNo(valor: number, parent: Id | null, side: Side | null): Id {
    const id = this.t.nextId++;
    if (!this.initShown) {
      this.initShown = true;
      const L = this.L.init;
      this.push({ fn: 'init', line: L.def, valor });
      this.emit(L.def, `No(${valor}) chama o construtor __init__. Vamos ver por dentro como um nó é montado (só nesta primeira vez).`);
      this.t.nodes[id] = { id, valor, esq: null, dir: null };
      this.pending = { id, parent, side };
      this.emit(L.valor, `self.valor = ${valor}: o nó guarda o dado.`);
      this.emit(L.esq, 'self.esquerda = None: ainda não existe filho à esquerda.');
      this.emit(L.dir, 'self.direita = None: nem à direita. O nó está pronto.');
      this.pop();
    } else {
      this.t.nodes[id] = { id, valor, esq: null, dir: null };
      this.pending = { id, parent, side };
    }
    return id;
  }

  // ------------------------------------------------ inserir
  inserir(raiz: Id | null, valor: number, parent: Id | null, side: Side | null): Id {
    const L = this.L.ins;
    const fr = this.push({ fn: 'inserir', line: L.def, raiz, valor, parent, side });
    this.emit(L.def, `Nova chamada: inserir(raiz=${this.v(raiz)}, valor=${valor}). Ela entra no TOPO da pilha.`);
    if (raiz === null) {
      this.emit(L.ifNone, `raiz is None → Verdadeiro. Chegamos a uma vaga vazia: é aqui que o ${valor} vai ficar.`);
      const id = this.criarNo(valor, parent, side);
      fr.ret = `No(${valor})`;
      this.emit(L.retNo, `return No(${valor}): o nó novo é DEVOLVIDO para a chamada de baixo na pilha. Repare: ele ainda NÃO está ligado à árvore (linha tracejada).`);
      this.pop();
      return id;
    }
    const n = this.t.nodes[raiz];
    this.emit(L.ifNone, `raiz is None → Falso (raiz é o nó ${n.valor}). O código segue para a comparação.`);
    const maior = n.valor > valor;
    this.emit(L.cmp, `Linha ${L.cmp}: compara raiz.valor > valor, ou seja, ${n.valor} > ${valor}.`, {
      q: {
        kind: 'choice', level: 2, text: `${n.valor} > ${valor} é verdadeiro ou falso?`,
        options: ['Verdadeiro → desce para a ESQUERDA', 'Falso → vai para o else (DIREITA)'], answer: maior ? 0 : 1,
        explain: maior ? `${n.valor} é maior que ${valor}, então o ${valor} fica à esquerda de ${n.valor}.`
          : `${n.valor} não é maior que ${valor}${n.valor === valor ? ' (são iguais, e este código manda iguais para a direita)' : ''}, então vai para a direita.`,
        hint: `Compare os dois números da linha destacada: ${n.valor} é maior que ${valor}?`,
      },
    });
    const s: Side = maior ? 'esq' : 'dir';
    const callLine = maior ? L.callEsq : L.callDir;
    if (maior) {
      this.emit(L.callEsq, `${n.valor} > ${valor} é Verdadeiro → chama inserir na subárvore ESQUERDA de ${n.valor} (que é ${this.v(n.esq)}). Esta chamada fica parada, esperando a resposta.`);
    } else {
      this.emit(L.els, `${n.valor} > ${valor} é Falso → entra no else.`);
      this.emit(L.callDir, `Chama inserir na subárvore DIREITA de ${n.valor} (que é ${this.v(n.dir)}). Esta chamada fica parada, esperando a resposta.`);
    }
    const antes = n[s];
    const r = this.inserir(antes, valor, raiz, s);
    const same = antes === r;
    this.emit(callLine, `A chamada de cima terminou e devolveu o nó ${this.v(r)}. Agora a linha ${callLine} faz a atribuição raiz.${ladoNome(s)} = (o que voltou).`, {
      q: {
        kind: 'choice', level: 2, text: 'O que essa atribuição muda na árvore?',
        options: [`Liga o ${this.v(r)} como filho ${filhoNome(s)} de ${n.valor}`, 'Nada visível: o ponteiro recebe o mesmo filho que já tinha'],
        answer: same ? 1 : 0,
        explain: same ? `Voltou o próprio filho (${this.v(r)}), que já estava ali. A linha executa, mas a árvore não muda.` : `O ${this.v(r)} acabou de ser criado e só agora ganha um pai: o ${n.valor}.`,
        hint: 'Olhe o cartão da pilha que acabou de sair: ele devolveu um nó novo ou um nó que já existia?',
      },
    });
    n[s] = r;
    if (this.pending && this.pending.id === r) this.pending = undefined;
    this.emit(callLine, same
      ? `raiz.${ladoNome(s)} = ${this.v(r)}: o ponteiro foi reatribuído ao MESMO filho. Nada muda, mas a linha executa!`
      : `raiz.${ladoNome(s)} = No(${valor}): agora o ${valor} está LIGADO como filho ${filhoNome(s)} de ${n.valor}.`,
    { flash: { parent: raiz, side: s, child: r, same } });
    fr.ret = String(n.valor);
    this.emit(L.ret, `return raiz: devolve o próprio nó ${n.valor} para a chamada de baixo.`);
    this.pop();
    return raiz;
  }

  // ------------------------------------------------ buscar
  buscar(raiz: Id | null, valor: number, parent: Id | null, side: Side | null): Id | null {
    const L = this.L.bus;
    const fr = this.push({ fn: 'buscar', line: L.def, raiz, valor, parent, side });
    this.emit(L.def, `Nova chamada: buscar(raiz=${this.v(raiz)}, valor=${valor}).`);
    const n = raiz === null ? null : this.t.nodes[raiz];
    const cond = n === null || n.valor === valor;
    this.emit(L.base, `Linha ${L.base}: testa "raiz is None or raiz.valor == valor".`, {
      q: {
        kind: 'choice', level: 2, text: `Com raiz = ${this.v(raiz)}, essa condição é verdadeira?`,
        options: ['Sim → a busca termina aqui', 'Não → continua procurando'], answer: cond ? 0 : 1,
        explain: n === null ? 'raiz é None: não há mais onde procurar.' : n.valor === valor ? `${n.valor} == ${valor}: achamos!` : `raiz não é None e ${n.valor} ≠ ${valor}.`,
        hint: 'A condição tem duas partes ligadas por "or": basta uma ser verdadeira.',
      },
    });
    if (cond) {
      fr.ret = this.v(raiz);
      this.emit(L.retBase, n === null ? `raiz é None → return None: o ${valor} não está na árvore.` : `${n.valor} == ${valor} → return raiz: ENCONTRADO! O nó volta para quem chamou.`, { found: raiz });
      this.pop();
      return raiz;
    }
    const maior = n!.valor > valor;
    this.emit(L.cmp, `Condição falsa (${n!.valor} ≠ ${valor}). Linha ${L.cmp}: compara ${n!.valor} > ${valor}.`, {
      q: {
        kind: 'choice', level: 1, text: `${n!.valor} > ${valor}? Para onde a busca segue?`,
        options: ['Verdadeiro → ESQUERDA', 'Falso → DIREITA'], answer: maior ? 0 : 1,
        explain: maior ? `${n!.valor} > ${valor}: tudo que é menor que ${n!.valor} está à esquerda.` : `${n!.valor} < ${valor}: tudo que é maior que ${n!.valor} está à direita.`,
        hint: `Na ABB, valores menores que ${n!.valor} ficam à esquerda; maiores, à direita.`,
      },
    });
    const s: Side = maior ? 'esq' : 'dir';
    const line = maior ? L.callEsq : L.callDir;
    this.emit(line, `${maior ? 'Verdadeiro' : 'Falso'} → return self.buscar(raiz.${ladoNome(s)}, ${valor}). A outra metade da árvore nem será visitada.`);
    const r = this.buscar(n![s], valor, raiz, s);
    fr.ret = this.v(r);
    this.emit(line, `A chamada de cima devolveu ${this.v(r)}. Este return só REPASSA o resultado para baixo.`, { found: r });
    this.pop();
    return r;
  }

  // ------------------------------------------------ percursos
  trav(kind: TravKind, raiz: Id | null, parent: Id | null, side: Side | null): number[] {
    const L = this.L[kind];
    const fr = this.push({ fn: kind, line: L.def, raiz, parent, side, elementos: [] });
    if (raiz === null) {
      this.emit(L.def, `Nova chamada: ${kind}(raiz=None).`);
      fr.ret = '[]';
      this.emit(L.ret, 'raiz é None: o "if raiz" é falso, elementos continua [] e a chamada devolve [] na hora.');
      this.pop();
      return [];
    }
    const n = this.t.nodes[raiz];
    this.emit(L.def, `Nova chamada: ${kind}(raiz=${n.valor}).`);
    this.emit(L.init, 'elementos = []: cada chamada tem a SUA própria lista, vazia no começo.');
    this.emit(L.ifRaiz, `if raiz: Verdadeiro (raiz = ${n.valor}).`);
    const ordem = kind === 'em_ordem' ? 'ead' : kind === 'pre_ordem' ? 'aed' : 'eda';
    for (const st of ordem) {
      if (st === 'a') {
        fr.elementos!.push(n.valor);
        this.done.push(raiz);
        this.emit(L.append, `elementos.append(${n.valor}) → elementos = [${fr.elementos!.join(', ')}]`, { appended: raiz });
      } else {
        const s: Side = st === 'e' ? 'esq' : 'dir';
        const line = s === 'esq' ? L.callEsq : L.callDir;
        this.emit(line, `Chama ${kind}(raiz.${ladoNome(s)}): o filho ${filhoNome(s)} de ${n.valor} é ${this.v(n[s])}.`);
        const sub = this.trav(kind, n[s], raiz, s);
        fr.elementos!.push(...sub);
        this.emit(line, sub.length
          ? `De volta ao ${n.valor}: extend junta [${sub.join(', ')}] → elementos = [${fr.elementos!.join(', ')}]`
          : `De volta ao ${n.valor}: veio [] (lista vazia); elementos continua [${fr.elementos!.join(', ')}].`);
      }
    }
    fr.ret = `[${fr.elementos!.join(', ')}]`;
    this.emit(L.ret, `return elementos: devolve [${fr.elementos!.join(', ')}] para a chamada de baixo.`);
    this.pop();
    return fr.elementos!.slice();
  }

  // percurso completo + perguntas "qual o próximo append?"
  runTrav(kind: TravKind): number[] {
    this.done = [];
    const s0 = this.snaps.length;
    const list = this.trav(kind, this.t.root, null, null);
    let prev = s0 - 1;
    for (let i = s0; i < this.snaps.length; i++) {
      const sn = this.snaps[i];
      if (sn.appended === undefined) continue;
      const qi = prev + 1;
      if (qi < i && !this.snaps[qi].q) {
        this.snaps[qi].q = {
          kind: 'node', level: 1, text: 'Antes de continuar: qual será o PRÓXIMO valor a entrar na lista com append? Clique no nó.',
          answer: sn.appended, explain: `${REGRA[kind]}. O próximo é o ${this.t.nodes[sn.appended].valor}.`, hint: HINT[kind],
        };
      }
      prev = i;
    }
    return list;
  }

  // a linha "raiz_completa = abb.inserir(raiz_completa, x)"
  insertFromTop(num: number, line: number, script: boolean) {
    const vazia = this.t.root === null;
    const slot = finalSlot(this.t, num);
    this.emit(line, script ? `Chama abb.inserir(raiz_completa, ${num}).` : `>>> raiz_completa = abb.inserir(raiz_completa, ${num})`, {
      q: vazia ? undefined : {
        kind: 'slot', level: 1, valor: num, text: `Antes de executar: onde o ${num} vai ficar? Clique na vaga ⊕ certa.`,
        answer: slot, explain: `Caminho: ${pathText(this.t, num)} → vaga vazia.`, hint: `Comece pela raiz: ${pathText(this.t, num, 1)} …`,
      },
    });
    const r = this.inserir(this.t.root, num, null, null);
    this.t.root = r;
    if (this.pending && this.pending.id === r) this.pending = undefined;
    this.emit(line, vazia
      ? `raiz_completa = No(${num}): a árvore ganhou sua RAIZ.`
      : `raiz_completa recebe de volta a mesma raiz (${this.v(r)}). A árvore agora tem ${this.count()} nós.`,
    { flash: { parent: null, side: null, child: r, same: !vazia } });
  }
}

// ------------------------------------------------------------------ execuções disponíveis
export function runScript(numeros: number[], valorTeste: number, L: LineMap): Run {
  const tr = new Tracer(emptyTree(), L);
  const M = L.main;
  tr.g = { numeros, script: true };
  tr.push({ fn: 'modulo', line: M.raiz });
  tr.emit(M.raiz, 'raiz_completa = None: a árvore começa vazia.');
  tr.emit(M.abb, 'abb = ABBCompleta(): cria o objeto que tem os métodos inserir, buscar e os percursos.');
  tr.emit(M.numeros, `numeros = [${numeros.join(', ')}]: estes valores serão inseridos NESTA ordem.`);
  numeros.forEach((num, i) => {
    tr.g.num = num;
    tr.g.numIdx = i;
    tr.emit(M.for, `for: agora num = ${num} (${i + 1}º de ${numeros.length}).`);
    tr.insertFromTop(num, M.insere, true);
  });
  tr.g.num = undefined;
  tr.g.numIdx = undefined;
  tr.emit(M.for, 'O for terminou: todos os números foram inseridos.');
  const prints: [TravKind, number, string][] = [
    ['em_ordem', M.pEm, 'Travessia Em-Ordem (Ordenado):'],
    ['pre_ordem', M.pPre, 'Travessia Pré-Ordem:'],
    ['pos_ordem', M.pPos, 'Travessia Pós-Ordem:'],
  ];
  for (const [kind, line, label] of prints) {
    tr.emit(line, `Antes de imprimir, o print precisa do resultado de abb.${kind}(raiz_completa).`);
    const list = tr.runTrav(kind);
    tr.out.push(`${label} [${list.join(', ')}]`);
    tr.emit(line, `O print mostra: ${label} [${list.join(', ')}]`);
  }
  tr.done = [];
  tr.g.valor_teste = valorTeste;
  tr.emit(M.vt, `valor_teste = ${valorTeste}`);
  tr.emit(M.rb, `Chama abb.buscar(raiz_completa, ${valorTeste}).`);
  const r = tr.buscar(tr.t.root, valorTeste, null, null);
  tr.g.resultado_busca = r;
  tr.g.temBusca = true;
  tr.emit(M.rb, `resultado_busca = ${r === null ? 'None' : `o nó ${tr.v(r)}`}`, { found: r });
  const msg = `Busca pelo valor ${valorTeste}: ${r !== null ? 'Encontrado!' : 'Não encontrado.'}`;
  tr.out.push('');
  tr.out.push(msg);
  tr.emit(M.pB, `O print mostra: "${msg}" (o \\n do início pula uma linha).`, { found: r });
  tr.pop();
  tr.emit(0, 'Fim do programa: a pilha está vazia. Escolha outra operação acima para continuar.');
  return { title: 'Script completo', snaps: tr.snaps, final: tr.t };
}

export type Op = { kind: 'inserir' | 'buscar'; valor: number } | { kind: TravKind };

export function runOp(tree: Tree, op: Op, L: LineMap): Run {
  const tr = new Tracer(tree, L);
  tr.initShown = true; // o __init__ só aparece no script completo
  tr.push({ fn: 'modulo', line: 0 });
  let title = '';
  if (op.kind === 'inserir') {
    title = `inserir(${op.valor})`;
    tr.out.push(`>>> raiz_completa = abb.inserir(raiz_completa, ${op.valor})`);
    tr.insertFromTop(op.valor, 0, false);
  } else if (op.kind === 'buscar') {
    title = `buscar(${op.valor})`;
    tr.out.push(`>>> abb.buscar(raiz_completa, ${op.valor})`);
    tr.emit(0, `>>> abb.buscar(raiz_completa, ${op.valor})`);
    const r = tr.buscar(tr.t.root, op.valor, null, null);
    tr.out.push(r === null ? 'None' : `<No valor=${tr.v(r)}>`);
    tr.emit(0, r === null ? `Resultado: None (o ${op.valor} não está na árvore).` : `Resultado: o nó ${tr.v(r)} foi encontrado.`, { found: r });
  } else {
    title = `${op.kind}()`;
    tr.out.push(`>>> abb.${op.kind}(raiz_completa)`);
    tr.emit(0, `>>> abb.${op.kind}(raiz_completa)  ·  ${REGRA[op.kind]}`);
    const list = tr.runTrav(op.kind);
    tr.out.push(`[${list.join(', ')}]`);
    tr.emit(0, `Resultado: [${list.join(', ')}]`);
  }
  tr.pop();
  tr.emit(0, 'Operação terminada. Escolha outra operação acima.');
  return { title, snaps: tr.snaps, final: tr.t };
}
