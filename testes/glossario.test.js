// Rode com: node --test testes/
const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../aulas/01-arvores-binarias/laboratorio/glossario.js');

const termosDe = (texto) => G.pedacos(texto).filter((p) => p.termo).map((p) => p.texto);

test('marca todas as ocorrências, não só a primeira', () => {
    assert.deepEqual(termosDe('A raiz fica no topo. Toda busca começa pela raiz.'), ['raiz', 'raiz']);
});

test('só palavra inteira, respeitando acentos', () => {
    assert.deepEqual(termosDe('O nó 45 e os nós 20 e 60'), ['nó', 'nós']);
    assert.deepEqual(termosDe('nódulo, enó, raizes'), []);
    assert.deepEqual(termosDe('três níveis; o nível 1'), ['níveis', 'nível']);
});

test('termo composto ganha do termo curto', () => {
    const p = G.pedacos('Isto é uma árvore binária de busca.');
    assert.equal(p.filter((x) => x.termo).length, 1);
    assert.equal(p.find((x) => x.termo).texto, 'árvore binária de busca');
});

test('siglas só com a grafia certa; palavras comuns ignoram maiúsculas', () => {
    assert.deepEqual(termosDe('Envie no SIGAA, não no sigaa.'), ['SIGAA']);
    assert.deepEqual(termosDe('Raiz e RAIZ'), ['Raiz', 'RAIZ']);
});

test('termos com ponto e hífen', () => {
    assert.deepEqual(termosDe('Baixe o .docx e veja o EAN-13 na etiqueta.'), ['.docx', 'EAN-13']);
});

test('o texto é preservado e o HTML escapado', () => {
    const t = 'Folha < raiz & "None"';
    assert.equal(G.pedacos(t).map((p) => p.texto).join(''), t);
    const html = G.marcarHtml('a <b> raiz');
    assert.match(html, /&lt;b&gt;/);
    assert.match(html, /class="termo"/);
});

test('cada termo da lista tem definição', () => {
    for (const t of G.TERMOS) assert.ok(t.def && t.def.length > 20, t.termo);
});
