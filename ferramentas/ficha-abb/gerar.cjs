// Gera a ficha do aluno do laboratório "Estoque com árvore binária de busca" em .docx.
// O aluno baixa, preenche no Word / LibreOffice / Google Docs e devolve pelo SIGAA.
// Uso (nesta pasta): npm install && npm run gerar
// Saída: aulas/01-arvores-binarias/laboratorio/ficha-aluno-abb.docx
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType,
  AlignmentType, BorderStyle, ImageRun, HeadingLevel, LevelFormat, Footer, PageNumber, TableLayoutType, VerticalAlign,
} = require('docx');

const SAIDA = path.resolve(__dirname, '../../aulas/01-arvores-binarias/laboratorio/ficha-aluno-abb.docx');
const FONTE = 'Arial';
const COR = { tinta: '0F1B2D', apoio: '46566C', petroleo: '0A7A72', coral: 'B23A1C', fundoCab: 'DCE6F2', fundoPrev: 'FFF4E5', fundoSim: 'E3F4F2', fundoAviso: 'FFEDE7', linha: 'B8C4D2' };
const LARG = 9638; // A4 com margens de 2 cm (11906 - 2 x 1134)

// ---------- peças ----------
const t = (texto, o = {}) => new TextRun({ text: texto, font: FONTE, size: o.size ?? 21, bold: o.bold, italics: o.italics, color: o.color ?? COR.tinta });
// tecla Windows: o logotipo (quatro quadrados) no lugar da palavra, como na página de orientação
const LOGO_WIN = fs.readFileSync(path.join(__dirname, 'tecla-windows.png'));
const teclaWin = () => new ImageRun({ type: 'png', data: LOGO_WIN, transformation: { width: 11, height: 11 }, altText: { title: 'tecla Windows', description: 'Logotipo do Windows: tecla Windows', name: 'tecla-windows' } });
const cod = (texto) => new TextRun({ text: texto, font: 'Consolas', size: 20, bold: true, color: COR.tinta });
const p = (partes, o = {}) => new Paragraph({ children: Array.isArray(partes) ? partes : [t(partes)], spacing: { before: o.antes ?? 0, after: o.depois ?? 80 }, alignment: o.alinhar, keepNext: o.keepNext });
const titulo = (texto) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: texto, font: FONTE })], keepNext: true });
const sub = (texto) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: texto, font: FONTE })], keepNext: true });
const item = (partes) => new Paragraph({ numbering: { reference: 'passos', level: 0 }, children: Array.isArray(partes) ? partes : [t(partes)], spacing: { after: 60 } });

const borda = { style: BorderStyle.SINGLE, size: 6, color: COR.linha };
const bordas = { top: borda, bottom: borda, left: borda, right: borda };
function cel(conteudo, largura, o = {}) {
  const filhos = (Array.isArray(conteudo) ? conteudo : [conteudo]).map((c) => (c instanceof Paragraph ? c : p(typeof c === 'string' ? [t(c, { bold: o.bold, size: o.size, color: o.cor })] : c, { depois: 0 })));
  return new TableCell({
    children: filhos, width: { size: largura, type: WidthType.DXA }, borders: bordas, verticalAlign: o.vAlign ?? VerticalAlign.CENTER,
    shading: o.fundo ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fundo } : undefined,
    margins: { top: 90, bottom: 90, left: 110, right: 110 }, columnSpan: o.span,
  });
}
// linha de preenchimento: altura mínima para o aluno escrever
const vazia = (largura, altura = 520, fundo) => new TableCell({ children: [p('', { depois: 0 })], width: { size: largura, type: WidthType.DXA }, borders: bordas, shading: fundo ? { type: ShadingType.CLEAR, color: 'auto', fill: fundo } : undefined, margins: { top: 90, bottom: 90, left: 110, right: 110 } });
function tabela(larguras, linhas, alturas = []) {
  return new Table({
    width: { size: larguras.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: larguras, layout: TableLayoutType.FIXED,
    rows: linhas.map((cels, i) => new TableRow({ children: cels, cantSplit: true, height: alturas[i] ? { value: alturas[i], rule: 'atLeast' } : undefined, tableHeader: i === 0 && alturas.headerRepeat })),
  });
}
// caixa grande para colar o print do simulador
const caixaPrint = (rotulo, altura = 2600) => tabela([LARG], [[cel([p([t(rotulo, { color: COR.apoio, italics: true, size: 19 })], { depois: 0 })], LARG, { vAlign: VerticalAlign.TOP })]], [altura]);
const espaco = (n = 120) => new Paragraph({ children: [], spacing: { after: n } });

// tabela padrão das Partes A e B: pergunta | minha previsão | no simulador | se errou, por quê
const LPREV = [700, 2850, 2080, 2080, 1928];
function tabelaPrevisao(perguntas) {
  const cab = [cel('#', LPREV[0], { bold: true, fundo: COR.fundoCab }), cel('Pergunta', LPREV[1], { bold: true, fundo: COR.fundoCab }), cel('Minha previsão (antes)', LPREV[2], { bold: true, fundo: COR.fundoPrev }), cel('No simulador (depois)', LPREV[3], { bold: true, fundo: COR.fundoSim }), cel('Se errou, por quê?', LPREV[4], { bold: true, fundo: COR.fundoCab })];
  const linhas = perguntas.map(([n, partes]) => [cel([[t(n, { bold: true })]], LPREV[0]), cel([partes], LPREV[1]), vazia(LPREV[2], 0, COR.fundoPrev), vazia(LPREV[3], 0, COR.fundoSim), vazia(LPREV[4])]);
  return tabela(LPREV, [cab, ...linhas], [0, ...perguntas.map(() => 1150)]);
}

// ---------- conteúdo ----------
const filhos = [];
const add = (...xs) => filhos.push(...xs);

add(
  new Paragraph({ children: [t('LABORATÓRIO · ESTRUTURA DE DADOS', { bold: true, size: 18, color: COR.petroleo })], spacing: { after: 40 } }),
  new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: 'Estoque com árvore binária de busca', font: FONTE })] }),
  p([t('Ficha do aluno · Técnico em Informática · IFPA Campus Breves · Prof. Ábner Lucas', { color: COR.apoio, size: 19 })], { depois: 160 }),
  tabela([1500, 4900, 1100, 2138], [[cel('Nome(s):', 1500, { bold: true, fundo: COR.fundoCab }), vazia(4900), cel('Turma:', 1100, { bold: true, fundo: COR.fundoCab }), vazia(2138)]], [560]),
  espaco(160),
  tabela([LARG], [[cel([
    p([t('O cenário', { bold: true, color: COR.petroleo })], { depois: 40 }),
    p([t('O sistema de uma loja guarda os códigos dos produtos numa árvore binária de busca (ABB). A regra é uma só: '), t('código menor vai para a esquerda; maior ou igual vai para a direita', { bold: true }), t('. No simulador, cada nó é uma caixa do depósito: '), cod('inserir'), t(' cadastra um produto, '), cod('buscar'), t(' é o leitor do caixa procurando um código e '), cod('em_ordem'), t(' gera o relatório dos produtos.')], { depois: 0 }),
  ], LARG, { fundo: 'F1F5F9' })]]),
  espaco(140),
  sub('Como preencher'),
  item([t('Nas Partes A e B, escreva primeiro a coluna '), t('Minha previsão', { bold: true }), t(' sem usar o simulador. Só depois confira e preencha '), t('No simulador', { bold: true }), t('.')]),
  item([t('Errou a previsão? '), t('Não apague.', { bold: true }), t(' Deixe como estava, escreva o certo em "No simulador" e explique o erro em uma frase em "Se errou, por quê?". O erro explicado mostra o seu raciocínio.')]),
  item([t('Onde a ficha pede um print: no Windows, aperte '), teclaWin(), t(' + Shift + S', { bold: true }), t(', selecione a área, clique no espaço indicado aqui na ficha e aperte '), t('Ctrl + V', { bold: true }), t('.')]),
  item([t('No fim, salve em .docx com o nome '), cod('ABB_SeuNome.docx'), t(' e envie pelo SIGAA.')]),
);

// Parte A — primeiro as previsões (sem simulador); depois a conferência no simulador
// faixa colorida que separa as duas etapas: laranja = previsão, verde = simulador
const etapa = (rotulo, partes, fundo) => tabela([LARG], [[cel([p([t(rotulo + '  ', { bold: true }), ...partes], { depois: 0 })], LARG, { fundo })]]);
add(
  titulo('Parte A · O catálogo da loja'),
  p([t('Códigos cadastrados, nesta ordem: '), cod('[45, 20, 60, 10, 30, 50, 70]')], { depois: 120 }),
  etapa('1º · Sem o simulador.', [t('Preencha A1, A2 e A3 na coluna '), t('Minha previsão', { bold: true }), t('. O simulador fica fechado até você terminar.')], COR.fundoPrev),
  espaco(120),
  sub('A1 · Monte a árvore (previsão)'),
  p([t('Comece pelo 45 na raiz e cadastre os outros na ordem da lista. Para cada caixa, escreva quem fica à esquerda e quem fica à direita. Escreva '), cod('vazio'), t(' quando não houver caixa.')]),
  (() => {
    const L = [2400, 3619, 3619];
    const nos = [45, 20, 60, 10, 30, 50, 70];
    return tabela(L, [
      [cel('Caixa', L[0], { bold: true, fundo: COR.fundoCab }), cel('À esquerda (menor)', L[1], { bold: true, fundo: COR.fundoPrev }), cel('À direita (maior ou igual)', L[2], { bold: true, fundo: COR.fundoPrev })],
      ...nos.map((n) => [cel([[cod(String(n))]], L[0]), vazia(L[1], 0, COR.fundoPrev), vazia(L[2], 0, COR.fundoPrev)]),
    ], [0, ...nos.map(() => 440)]);
  })(),
  espaco(160),
  sub('A2 e A3 · Previsão'),
  tabelaPrevisao([
    ['A2', [t('Quantos níveis (altura) a árvore tem? Quais códigos são folhas (caixas sem nada embaixo)?')]],
    ['A3', [t('Se o código '), cod('45'), t(' for cadastrado de novo, onde ele vai parar?')]],
  ]),
  espaco(160),
  etapa('2º · Agora, no simulador.', [
    t('Clique em '), t('Catálogo da loja', { bold: true }), t(' e compare a árvore com a sua tabela A1. Confira A2 pelos contadores de nós e níveis. Para A3, digite '), cod('45'), t(' no campo código e clique em '), cod('inserir'),
    t('. Preencha as colunas '), t('No simulador', { bold: true }), t(' e, se errou, '), t('Se errou, por quê?', { bold: true }), t(' (sem apagar a previsão).'),
  ], COR.fundoSim),
  espaco(),
  caixaPrint('Cole aqui o print da árvore do Catálogo da loja no simulador.', 2800),
);

// Parte B — de novo: previsão antes, simulador depois
add(
  titulo('Parte B · O leitor do caixa e o relatório'),
  etapa('1º · Sem o simulador.', [t('Responda B1 a B5 na coluna '), t('Minha previsão', { bold: true }), t(', pensando na árvore da Parte A.')], COR.fundoPrev),
  espaco(120),
  tabelaPrevisao([
    ['B1', [t('O caixa busca o produto '), cod('30'), t('. Quais caixas o leitor visita, em ordem? Quantas foram?')]],
    ['B2', [t('Nessa busca pelo '), cod('30'), t(', quantas caixas nunca foram olhadas? Quais?')]],
    ['B3', [t('O caixa busca o produto '), cod('55'), t(', que não existe. Quais caixas são visitadas até a busca parar?')]],
    ['B4', [t('O gerente pede o relatório com '), cod('em_ordem'), t('. Qual lista sai no final?')]],
    ['B5', [t('Olhe a lista do '), cod('em_ordem'), t('. O que ela tem de especial? Em uma frase, com as suas palavras, por que isso acontece?')]],
  ]),
  espaco(160),
  etapa('2º · Agora, no simulador.', [
    t('Use a árvore da Parte A (se ela mudou, clique de novo em '), t('Catálogo da loja', { bold: true }), t('). Para B1 a B3, digite o código e clique em '), cod('buscar'),
    t('. Para B4, clique em '), cod('em_ordem'), t('. Preencha as colunas '), t('No simulador', { bold: true }), t(' e, se errou, '), t('Se errou, por quê?', { bold: true }), t('.'),
  ], COR.fundoSim),
);

// Parte C
add(
  titulo('Parte C · Seus dois produtos'),
  p([t('Clique em '), t('Catálogo da loja', { bold: true }), t(' para voltar à árvore original. Escolha dois números entre 1 e 99 que não estejam nela (por exemplo, o dia do seu aniversário e a sua idade). Cadastre um de cada vez: digite no campo código e clique em '), cod('inserir'), t('.')], { depois: 140 }),
  (() => {
    const L = [2200, 1600, 5838];
    return tabela(L, [
      [cel('', L[0], { fundo: COR.fundoCab }), cel('Código', L[1], { bold: true, fundo: COR.fundoCab }), cel('Entrou à esquerda ou à direita de qual caixa?', L[2], { bold: true, fundo: COR.fundoCab })],
      [cel('Produto 1 (X)', L[0], { bold: true }), vazia(L[1]), vazia(L[2])],
      [cel('Produto 2 (Y)', L[0], { bold: true }), vazia(L[1]), vazia(L[2])],
    ], [0, 560, 560]);
  })(),
  espaco(),
  caixaPrint('C1 · Cole aqui o print da árvore já com os seus dois produtos.', 2800),
  espaco(),
  (() => {
    const L = [3000, 4638, 2000];
    return tabela(L, [
      [cel('C2 · Busca pelo produto X', L[0], { bold: true, fundo: COR.fundoCab }), cel('Caminho que o leitor percorreu', L[1], { bold: true, fundo: COR.fundoCab }), cel('Caixas visitadas', L[2], { bold: true, fundo: COR.fundoCab })],
      [cel('Digite X e clique em buscar.', L[0], { cor: COR.apoio, size: 19 }), vazia(L[1]), vazia(L[2])],
    ], [0, 700]);
  })(),
);

// Parte D
add(
  titulo('Parte D · Cadastro em ordem crescente'),
  p([t('Clique em '), t('Cadastro em ordem', { bold: true }), t('. O simulador cadastra os mesmos sete códigos da Parte A, um por um, do menor para o maior, e já deixa o '), cod('70'), t(' no campo código. Observe a forma da árvore, depois clique em '), cod('buscar'), t(' e em '), cod('em_ordem'), t('.')], { depois: 140 }),
  sub('D1 · A forma da árvore'),
  p('Descreva em uma frase a forma que a árvore tomou e cole o print.'),
  tabela([LARG], [[vazia(LARG)]], [620]),
  espaco(),
  caixaPrint('Cole aqui o print da árvore do Cadastro em ordem.', 2600),
  espaco(160),
  (() => {
    const L = [700, 4338, 2300, 2300];
    return tabela(L, [
      [cel('#', L[0], { bold: true, fundo: COR.fundoCab }), cel('Comparação', L[1], { bold: true, fundo: COR.fundoCab }), cel('Catálogo da loja (Parte A)', L[2], { bold: true, fundo: COR.fundoCab }), cel('Cadastro em ordem (Parte D)', L[3], { bold: true, fundo: COR.fundoCab })],
      [cel([[t('D2', { bold: true })]], L[0]), cel('Quantos níveis (altura) a árvore tem?', L[1]), vazia(L[2]), vazia(L[3])],
      [cel([[t('D3', { bold: true })]], L[0]), cel([[t('Quantas caixas o leitor visita para achar o '), cod('70'), t('?')]], L[1]), vazia(L[2]), vazia(L[3])],
    ], [0, 700, 700]);
  })(),
  espaco(),
  tabela([700, 8938], [[cel([[t('D4', { bold: true })]], 700), cel([
    p([t('A lista do '), cod('em_ordem'), t(' mudou em relação à Parte A?   (   ) Sim    (   ) Não')], { depois: 60 }),
    p('O que piorou na prática para a loja?', { depois: 600 }),
  ], 8938, { vAlign: VerticalAlign.TOP })]]),
);

// Parte E
add(
  titulo('Parte E · Missões'),
  p([t('Clique em '), t('Missões', { bold: true }), t(' no topo do simulador e complete uma rodada de cada missão. Ao terminar, o simulador mostra um '), t('cupom', { bold: true }), t(' com os dados da sua rodada: copie para a tabela e cole o print de cada cupom. Errar durante a missão faz parte; o importante é chegar ao fim.')], { depois: 140 }),
  (() => {
    const L = [2200, 2700, 3338, 1400];
    const lin = (nome, sorteio, resultado) => [cel([[t(nome, { bold: true })]], L[0]), cel([p([t(sorteio, { color: COR.apoio, size: 19 })], { depois: 300 })], L[1], { vAlign: VerticalAlign.TOP }), cel([p([t(resultado, { color: COR.apoio, size: 19 })], { depois: 300 })], L[2], { vAlign: VerticalAlign.TOP }), vazia(L[3])];
    return tabela(L, [
      [cel('Missão', L[0], { bold: true, fundo: COR.fundoCab }), cel('O que foi sorteado', L[1], { bold: true, fundo: COR.fundoCab }), cel('Resultado final', L[2], { bold: true, fundo: COR.fundoCab }), cel('Nº de erros', L[3], { bold: true, fundo: COR.fundoCab })],
      lin('1 · Monte a árvore', 'Os 7 números:', 'Raiz:'),
      lin('2 · Ordem de visita (em_ordem)', 'Menor e maior nó:', 'Lista final gerada:'),
      lin('3 · Caminho da busca', 'Valor buscado:', 'Encontrou? (  ) Sim  (  ) Não   Caminho:'),
    ], [0, 1100, 1100, 1100]);
  })(),
  espaco(),
  caixaPrint('Cole aqui o print dos três cupons (pode ser um embaixo do outro).', 3400),
);

// Parte F
const pergunta = (n, texto) => [p([t(`${n}. `, { bold: true }), t(texto)], { antes: 80, keepNext: true }), tabela([LARG], [[vazia(LARG)]], [1100])];
add(
  titulo('Parte F · Para fechar, com as suas palavras'),
  ...pergunta(1, 'Num estoque com 100.000 produtos, por que procurar numa ABB bem distribuída é muito mais rápido do que procurar numa lista comum?'),
  ...pergunta(2, 'Pelo que você viu na Parte D, por que cadastrar códigos já em ordem crescente (1, 2, 3, 4...) atrapalha a árvore?'),
  ...pergunta(3, 'Cite uma previsão que você errou (ou uma dificuldade nas missões) e o que mudou no seu jeito de entender a ABB.'),
  espaco(200),
  tabela([LARG], [[cel([
    p([t('Entrega', { bold: true, color: COR.coral })], { depois: 40 }),
    p([t('Salve como '), cod('ABB_SeuNome.docx'), t(' (no Word: Arquivo › Salvar como; no Google Docs: Arquivo › Fazer download › Microsoft Word .docx) e envie pelo SIGAA, na tarefa do laboratório.')], { depois: 0 }),
  ], LARG, { fundo: COR.fundoAviso })]]),
);

const doc = new Document({
  creator: 'Prof. Ábner Lucas',
  title: 'Ficha do aluno · Estoque com árvore binária de busca',
  description: 'Laboratório de árvore binária de busca no simulador · Estrutura de Dados · IFPA Campus Breves',
  styles: {
    default: { document: { run: { font: FONTE, size: 21, color: COR.tinta } } },
    paragraphStyles: [
      { id: 'Title', name: 'Title', basedOn: 'Normal', next: 'Normal', run: { font: FONTE, size: 40, bold: true, color: COR.tinta }, paragraph: { spacing: { before: 0, after: 60 }, keepNext: true } },
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONTE, size: 28, bold: true, color: COR.petroleo }, paragraph: { spacing: { before: 320, after: 100 }, keepNext: true, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONTE, size: 23, bold: true, color: COR.tinta }, paragraph: { spacing: { before: 160, after: 80 }, keepNext: true, outlineLevel: 1 } },
    ],
  },
  numbering: { config: [{ reference: 'passos', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 400, hanging: 300 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [t('Estoque com ABB · ficha do aluno · página ', { size: 16, color: COR.apoio }), new TextRun({ children: [PageNumber.CURRENT], font: FONTE, size: 16, color: COR.apoio })] })] }) },
    children: filhos,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
  fs.writeFileSync(SAIDA, buf);
  console.log('ficha gerada:', SAIDA, (buf.length / 1024).toFixed(1) + ' kB');
});
