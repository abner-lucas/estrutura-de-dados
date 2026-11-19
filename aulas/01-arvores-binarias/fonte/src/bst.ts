// Motor da ABB: operações reais que geram, passo a passo, o roteiro das animações.
// Uma árvore é sempre guardada como lista em pré-ordem: reinserir nessa ordem
// reconstrói exatamente a mesma forma.

export type Hl = 'cur' | 'visit' | 'found' | 'new' | 'del' | 'succ' | 'dim' | 'done';

export interface Slot { parent: number; side: 'L' | 'R' }

export interface Step {
  tree: number[];
  caption: string;
  hl?: Record<number, Hl>;
  edges?: string[];
  labels?: Record<number, string>;
  nums?: Record<number, number>;
  out?: number[];
  code?: number;
  ghost?: { v: number; near?: number; slot?: Slot; above?: boolean };
  none?: Slot;
}

interface N { v: number; l?: N; r?: N }

function ins(n: N | undefined, v: number): N {
  if (!n) return { v };
  if (v < n.v) n.l = ins(n.l, v);
  else if (v > n.v) n.r = ins(n.r, v);
  return n;
}

export function build(pre: number[]): N | undefined {
  let root: N | undefined;
  for (const v of pre) root = ins(root, v);
  return root;
}

export function preorder(n: N | undefined, out: number[] = []): number[] {
  if (!n) return out;
  out.push(n.v);
  preorder(n.l, out);
  preorder(n.r, out);
  return out;
}

function find(n: N | undefined, v: number): N | undefined {
  while (n && n.v !== v) n = v < n.v ? n.l : n.r;
  return n;
}

function subtree(n: N | undefined, out: number[] = []): number[] {
  return preorder(n, out);
}

export interface Layout {
  pos: Record<number, { x: number; y: number }>;
  edges: [number, number][];
  depth: number;
  count: number;
}

// x = posição em-ordem (0..1), y = profundidade
export function layout(pre: number[]): Layout {
  const root = build(pre);
  const pos: Layout['pos'] = {};
  const edges: [number, number][] = [];
  const order: { v: number; d: number }[] = [];
  let depth = 0;
  const walk = (n: N | undefined, d: number) => {
    if (!n) return;
    depth = Math.max(depth, d);
    walk(n.l, d + 1);
    order.push({ v: n.v, d });
    walk(n.r, d + 1);
    if (n.l) edges.push([n.v, n.l.v]);
    if (n.r) edges.push([n.v, n.r.v]);
  };
  walk(root, 0);
  order.forEach((o, i) => { pos[o.v] = { x: (i + 0.5) / order.length, y: o.d }; });
  return { pos, edges, depth, count: order.length };
}

const ek = (a: number, b: number) => `${a}-${b}`;

// ---------------------------------------------------------------- BUSCA
export const CODE_BUSCA = [
  'def busca(raiz, valor):',
  '    atual = raiz',
  '    while atual is not None:',
  '        if valor == atual.dado:',
  '            return atual',
  '        elif valor < atual.dado:',
  '            atual = atual.esq',
  '        else:',
  '            atual = atual.dir',
  '    return None',
];

export function searchSteps(pre: number[], t: number): Step[] {
  const root = build(pre);
  const steps: Step[] = [];
  const hl: Record<number, Hl> = {};
  const edges: string[] = [];
  if (!root) return [{ tree: pre, caption: 'Árvore vazia: nada para buscar.', code: 9 }];
  steps.push({ tree: pre, caption: `Buscar ${t}: começamos sempre pela raiz (${root.v}).`, hl: { [root.v]: 'cur' }, code: 1 });
  let n: N | undefined = root;
  let comps = 0;
  while (n) {
    comps++;
    if (t === n.v) {
      hl[n.v] = 'found';
      steps.push({ tree: pre, caption: `${t} == ${n.v} → Encontrado em ${comps} comparação(ões)!`, hl: { ...hl }, edges: [...edges], code: 4 });
      return steps;
    }
    const left = t < n.v;
    const next: N | undefined = left ? n.l : n.r;
    hl[n.v] = 'visit';
    for (const v of subtree(left ? n.r : n.l)) hl[v] = 'dim';
    if (next) {
      edges.push(ek(n.v, next.v));
      hl[next.v] = 'cur';
      steps.push({
        tree: pre,
        caption: left ? `${t} < ${n.v} → vai para a ESQUERDA (descartamos a direita)` : `${t} > ${n.v} → vai para a DIREITA (descartamos a esquerda)`,
        hl: { ...hl }, edges: [...edges], code: left ? 6 : 8,
      });
    } else {
      steps.push({
        tree: pre,
        caption: `${t} ${left ? '<' : '>'} ${n.v}, mas não há filho: chegamos a None → ${t} não existe.`,
        hl: { ...hl }, edges: [...edges], code: 9, none: { parent: n.v, side: left ? 'L' : 'R' },
      });
      return steps;
    }
    n = next;
  }
  return steps;
}

// ---------------------------------------------------------------- INSERÇÃO
export const CODE_INSERIR = [
  'def inserir(raiz, valor):',
  '    novo = Node(valor)',
  '    if raiz is None: return novo',
  '    atual = raiz',
  '    pai = None',
  '    while atual is not None:',
  '        pai = atual',
  '        if valor < atual.dado: atual = atual.esq',
  '        else: atual = atual.dir',
  '    if valor < pai.dado: pai.esq = novo',
  '    else: pai.dir = novo',
  '    return raiz',
];

export function insertSteps(pre: number[], v: number): Step[] {
  const root = build(pre);
  const steps: Step[] = [];
  if (!root) {
    steps.push({ tree: [], caption: `Árvore vazia: ${v} vira a raiz.`, ghost: { v, above: true }, code: 2 });
    steps.push({ tree: [v], caption: `Raiz criada: ${v}.`, hl: { [v]: 'new' }, code: 2 });
    return steps;
  }
  if (find(root, v)) {
    return [{ tree: pre, caption: `${v} já existe na árvore: ABB não guarda duplicados.`, hl: { [v]: 'found' } }];
  }
  steps.push({ tree: pre, caption: `Criamos o nó ${v}. Agora procuramos a vaga dele, como numa busca.`, ghost: { v, above: true }, code: 1 });
  const hl: Record<number, Hl> = {};
  const edges: string[] = [];
  let n: N | undefined = root;
  let prev: N | undefined;
  while (n) {
    const left = v < n.v;
    hl[n.v] = 'cur';
    steps.push({
      tree: pre,
      caption: `pai = ${n.v}. ${v} ${left ? '<' : '>'} ${n.v} → ${left ? 'esquerda' : 'direita'}`,
      hl: { ...hl }, edges: [...edges], ghost: { v, near: n.v }, code: left ? 7 : 8,
    });
    hl[n.v] = 'visit';
    prev = n;
    const next: N | undefined = left ? n.l : n.r;
    if (next) edges.push(ek(n.v, next.v));
    n = next;
  }
  const side: 'L' | 'R' = v < prev!.v ? 'L' : 'R';
  steps.push({
    tree: pre,
    caption: `atual virou None: a vaga é o filho ${side === 'L' ? 'esquerdo' : 'direito'} de ${prev!.v}.`,
    hl: { ...hl }, edges: [...edges], ghost: { v, slot: { parent: prev!.v, side } }, none: { parent: prev!.v, side }, code: side === 'L' ? 9 : 10,
  });
  const after = preorder(ins(build(pre), v));
  steps.push({
    tree: after,
    caption: `pai.${side === 'L' ? 'esq' : 'dir'} = novo → ${v} plantado como nova folha!`,
    hl: { ...hl, [v]: 'new' }, edges: [...edges, ek(prev!.v, v)], code: 11,
  });
  return steps;
}

// ---------------------------------------------------------------- REMOÇÃO
export const CODE_REMOVER = [
  'def remover(raiz, v):',
  '    if raiz is None: return None',
  '    if v < raiz.dado:',
  '        raiz.esq = remover(raiz.esq, v)',
  '    elif v > raiz.dado:',
  '        raiz.dir = remover(raiz.dir, v)',
  '    else:',
  '        if raiz.esq is None: return raiz.dir',
  '        if raiz.dir is None: return raiz.esq',
  '        suc = menor(raiz.dir)   # caso 3',
  '        raiz.dado = suc.dado',
  '        raiz.dir = remover(raiz.dir, suc.dado)',
  '    return raiz',
];
// linhas destacadas em cada fase da remoção
const RL = { esq: 3, dir: 5, vazio: 1, semEsq: 7, semDir: 8, suc: 9, copia: 10, final: 11 };

function rem(n: N | undefined, v: number): N | undefined {
  if (!n) return n;
  if (v < n.v) n.l = rem(n.l, v);
  else if (v > n.v) n.r = rem(n.r, v);
  else {
    if (!n.l) return n.r;
    if (!n.r) return n.l;
    let s = n.r;
    while (s.l) s = s.l;
    n.v = s.v;
    n.r = rem(n.r, s.v);
  }
  return n;
}

export function removeAfter(pre: number[], v: number): number[] {
  return preorder(rem(build(pre), v));
}

export function removeSteps(pre: number[], v: number): Step[] {
  const root = build(pre);
  const steps: Step[] = [];
  const hl: Record<number, Hl> = {};
  const edges: string[] = [];
  let n: N | undefined = root;
  let parent: N | undefined;
  while (n && n.v !== v) {
    const left = v < n.v;
    hl[n.v] = 'cur';
    steps.push({ tree: pre, caption: `Procurando ${v}: ${v} ${left ? '<' : '>'} ${n.v} → ${left ? 'esquerda' : 'direita'}`, hl: { ...hl }, edges: [...edges], code: left ? RL.esq : RL.dir });
    hl[n.v] = 'visit';
    parent = n;
    const next: N | undefined = left ? n.l : n.r;
    if (next) edges.push(ek(n.v, next.v));
    n = next;
  }
  if (!n) {
    steps.push({ tree: pre, caption: `${v} não está na árvore: nada a remover.`, hl: { ...hl }, edges, code: RL.vazio });
    return steps;
  }
  hl[n.v] = 'del';
  const after = removeAfter(pre, v);
  const kids = (n.l ? 1 : 0) + (n.r ? 1 : 0);
  if (kids === 0) {
    steps.push({ tree: pre, caption: `Caso 1 – ${v} é FOLHA (0 filhos): basta cortar o ponteiro do pai.`, hl: { ...hl }, edges, code: RL.semEsq });
    steps.push({ tree: after, caption: parent ? `${parent.v}.${v < parent.v ? 'esq' : 'dir'} = None. A memória do nó isolado é liberada.` : 'A árvore ficou vazia.', hl: { ...hl }, code: RL.semEsq });
    return steps;
  }
  if (kids === 1) {
    const child = (n.l ?? n.r)!;
    steps.push({ tree: pre, caption: `Caso 2 – ${v} tem 1 filho (${child.v}): fazemos um BYPASS.`, hl: { ...hl, [child.v]: 'succ' }, edges, code: n.l ? RL.semDir : RL.semEsq });
    steps.push({ tree: after, caption: parent ? `${parent.v} passa a apontar direto para ${child.v} (o neto sobe).` : `${child.v} vira a nova raiz.`, hl: { ...hl, [child.v]: 'new' }, code: n.l ? RL.semDir : RL.semEsq });
    return steps;
  }
  steps.push({ tree: pre, caption: `Caso 3 – ${v} tem 2 filhos: precisamos do SUCESSOR (menor da subárvore direita).`, hl: { ...hl }, edges, code: RL.suc });
  let s = n.r!;
  const sh: Record<number, Hl> = { ...hl, [s.v]: 'cur' };
  const se = [...edges, ek(n.v, s.v)];
  steps.push({ tree: pre, caption: `Um passo para a direita (${s.v})…`, hl: { ...sh }, edges: [...se], code: RL.suc });
  while (s.l) {
    sh[s.v] = 'visit';
    se.push(ek(s.v, s.l.v));
    s = s.l;
    sh[s.v] = 'cur';
    steps.push({ tree: pre, caption: `…e sempre à esquerda (${s.v}).`, hl: { ...sh }, edges: [...se], code: RL.suc });
  }
  sh[s.v] = 'succ';
  steps.push({ tree: pre, caption: `Sucessor encontrado: ${s.v}. Copiamos seu valor para o lugar de ${v}.`, hl: { ...sh }, edges: [...se], labels: { [v]: String(s.v) }, code: RL.copia });
  steps.push({ tree: after, caption: `O sucessor original sai (cai no caso 1 ou 2). Problema complexo → problema simples!`, hl: { [s.v]: 'new' }, code: RL.final });
  return steps;
}

// ---------------------------------------------------------------- PERCURSOS
export type Kind = 'pre' | 'em' | 'pos';

export const CODE_PERCURSO: Record<Kind, string[]> = {
  pre: ['def pre_ordem(no):', '    if no:', '        print(no.dado)', '        pre_ordem(no.esq)', '        pre_ordem(no.dir)'],
  em: ['def em_ordem(no):', '    if no:', '        em_ordem(no.esq)', '        print(no.dado)', '        em_ordem(no.dir)'],
  pos: ['def pos_ordem(no):', '    if no:', '        pos_ordem(no.esq)', '        pos_ordem(no.dir)', '        print(no.dado)'],
};

export const REGRA: Record<Kind, string> = {
  pre: 'Raiz → Esquerda → Direita',
  em: 'Esquerda → Raiz → Direita',
  pos: 'Esquerda → Direita → Raiz',
};

export function traversalSteps(pre: number[], kind: Kind): Step[] {
  const root = build(pre);
  const order: number[] = [];
  const walk = (n: N | undefined) => {
    if (!n) return;
    if (kind === 'pre') order.push(n.v);
    walk(n.l);
    if (kind === 'em') order.push(n.v);
    walk(n.r);
    if (kind === 'pos') order.push(n.v);
  };
  walk(root);
  const printLine = kind === 'pre' ? 2 : kind === 'em' ? 3 : 4;
  const steps: Step[] = [{ tree: pre, caption: `Regra: ${REGRA[kind]}`, out: [], code: 0 }];
  const hl: Record<number, Hl> = {};
  const nums: Record<number, number> = {};
  order.forEach((v, i) => {
    Object.keys(hl).forEach((k) => (hl[+k] = 'done'));
    hl[v] = 'cur';
    nums[v] = i + 1;
    steps.push({ tree: pre, caption: `${i + 1}º visitado: ${v}`, hl: { ...hl }, nums: { ...nums }, out: order.slice(0, i + 1), code: printLine });
  });
  const tail = kind === 'em' ? 'Em uma ABB, o em-ordem sai em ordem CRESCENTE!' : kind === 'pos' ? 'Filhos antes do pai: ideal para apagar a árvore com segurança.' : 'Pai antes dos filhos: ideal para copiar/clonar a árvore.';
  steps.push({ tree: pre, caption: tail, hl: Object.fromEntries(order.map((v) => [v, 'done' as Hl])), nums: { ...nums }, out: order, code: printLine });
  return steps;
}

// ---------------------------------------------------------------- CRESCIMENTO
export function growSteps(values: number[], label: string): Step[] {
  const steps: Step[] = [{ tree: [], caption: `${label}: inserindo ${values.join(', ')}` }];
  let pre: number[] = [];
  values.forEach((v) => {
    pre = preorder(ins(build(pre), v));
    const h = layout(pre).depth + 1;
    steps.push({ tree: pre, caption: `${label}: inseriu ${v} · altura = ${h}`, hl: { [v]: 'new' } });
  });
  return steps;
}
