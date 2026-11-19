// O código da aula, exatamente como foi usado com os alunos.
// Só a lista "numeros" e o "valor_teste" podem ser trocados pelo professor.
const TEMPLATE = `class No:
  def __init__(self, valor):
    self.valor = valor
    self.esquerda = None
    self.direita = None

class ABBCompleta:
  def inserir(self, raiz, valor):
    if raiz is None:
      return No(valor)
    if raiz.valor > valor:
      raiz.esquerda = self.inserir(raiz.esquerda, valor)
    else:
      raiz.direita = self.inserir(raiz.direita, valor)
    return raiz

  def buscar(self, raiz, valor):
    if raiz is None or raiz.valor == valor:
      return raiz
    if raiz.valor > valor:
      return self.buscar(raiz.esquerda, valor)
    return self.buscar(raiz.direita, valor)

  # Travessia Em-Ordem (Esquerda, Raiz, Direita) - Retorna os elementos ordenados
  def em_ordem(self, raiz):
    elementos = []
    if raiz:
      elementos.extend(self.em_ordem(raiz.esquerda))
      elementos.append(raiz.valor)
      elementos.extend(self.em_ordem(raiz.direita))
    return elementos

  # Travessia Pré-Ordem (Raiz, Esquerda, Direita)
  def pre_ordem(self, raiz):
    elementos = []
    if raiz:
      elementos.append(raiz.valor)
      elementos.extend(self.pre_ordem(raiz.esquerda))
      elementos.extend(self.pre_ordem(raiz.direita))
    return elementos

  # Travessia Pós-Ordem (Esquerda, Direita, Raiz)
  def pos_ordem(self, raiz):
    elementos = []
    if raiz:
      elementos.extend(self.pos_ordem(raiz.esquerda))
      elementos.extend(self.pos_ordem(raiz.direita))
      elementos.append(raiz.valor)
    return elementos

# Criando e populando a nova árvore
raiz_completa = None
abb = ABBCompleta()
numeros = [__NUMEROS__]

for num in numeros:
  raiz_completa = abb.inserir(raiz_completa, num)

# Exibindo os resultados dos métodos clássicos
print("Travessia Em-Ordem (Ordenado):", abb.em_ordem(raiz_completa))
print("Travessia Pré-Ordem:", abb.pre_ordem(raiz_completa))
print("Travessia Pós-Ordem:", abb.pos_ordem(raiz_completa))

# Teste de busca
valor_teste = __VT__
resultado_busca = abb.buscar(raiz_completa, valor_teste)
print(f"\\nBusca pelo valor {valor_teste}:", "Encontrado!" if resultado_busca else "Não encontrado.")`;

export type TravKind = 'em_ordem' | 'pre_ordem' | 'pos_ordem';

export function buildCode(numeros: number[], valorTeste: number) {
  const text = TEMPLATE.replace('__NUMEROS__', numeros.join(', ')).replace('__VT__', String(valorTeste));
  const lines = text.split('\n');
  // número (1-based) da primeira linha, a partir de "from", que contém o trecho
  const find = (s: string, from = 1) => {
    for (let i = from - 1; i < lines.length; i++) if (lines[i].includes(s)) return i + 1;
    throw new Error('linha não encontrada: ' + s);
  };
  const trav = (name: TravKind) => {
    const def = find(`def ${name}`);
    return {
      def,
      init: find('elementos = []', def),
      ifRaiz: find('if raiz:', def),
      callEsq: find(`self.${name}(raiz.esquerda)`, def),
      append: find('elementos.append(raiz.valor)', def),
      callDir: find(`self.${name}(raiz.direita)`, def),
      ret: find('return elementos', def),
    };
  };
  const ins = find('def inserir');
  const bus = find('def buscar');
  const init = find('def __init__');
  const L = {
    init: { def: init, valor: find('self.valor = valor', init), esq: find('self.esquerda = None', init), dir: find('self.direita = None', init) },
    ins: {
      def: ins, ifNone: find('if raiz is None:', ins), retNo: find('return No(valor)', ins), cmp: find('if raiz.valor > valor:', ins),
      callEsq: find('raiz.esquerda = self.inserir', ins), els: find('else:', ins), callDir: find('raiz.direita = self.inserir', ins), ret: find('return raiz', ins),
    },
    bus: {
      def: bus, base: find('if raiz is None or raiz.valor == valor:', bus), retBase: find('return raiz', bus), cmp: find('if raiz.valor > valor:', bus),
      callEsq: find('return self.buscar(raiz.esquerda', bus), callDir: find('return self.buscar(raiz.direita', bus),
    },
    em_ordem: trav('em_ordem'), pre_ordem: trav('pre_ordem'), pos_ordem: trav('pos_ordem'),
    main: {
      raiz: find('raiz_completa = None'), abb: find('abb = ABBCompleta()'), numeros: find('numeros = ['), for: find('for num in numeros:'),
      insere: find('raiz_completa = abb.inserir(raiz_completa, num)'), pEm: find('print("Travessia Em-Ordem'), pPre: find('print("Travessia Pré-Ordem'),
      pPos: find('print("Travessia Pós-Ordem'), vt: find('valor_teste = '), rb: find('resultado_busca = abb.buscar'), pB: find('print(f"'),
    },
  };
  return { lines, L };
}

export type LineMap = ReturnType<typeof buildCode>['L'];

// Realce de sintaxe simples para Python
const KW = new Set(['class', 'def', 'if', 'else', 'elif', 'return', 'for', 'in', 'is', 'None', 'or', 'and', 'not', 'True', 'False']);
export function tokenize(line: string): { t: string; c: string }[] {
  const out: { t: string; c: string }[] = [];
  const re = /(#.*$)|(f?"(?:[^"\\]|\\.)*")|(\b\d+\b)|([A-Za-z_À-ú][A-Za-z0-9_À-ú]*)|(\s+)|(.)/g;
  let m: RegExpExecArray | null;
  let prev = '';
  while ((m = re.exec(line)) && m[0] !== '') {
    const [s, com, str, num, word, space] = m;
    let c = '';
    if (com) c = 'c-com';
    else if (str) c = 'c-str';
    else if (num) c = 'c-num';
    else if (word) {
      if (KW.has(word)) c = 'c-kw';
      else if (word === 'self') c = 'c-self';
      else if (prev === 'def' || prev === 'class') c = 'c-fn';
      else if (word === 'print') c = 'c-bi';
      prev = word;
    } else if (!space) prev = '';
    out.push({ t: s, c });
  }
  return out;
}
