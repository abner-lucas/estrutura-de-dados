// Rode com: node --test testes/
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../logica.js');

const valores = (estado) => estado.map((n) => n.valor);

test('lerValor aceita inteiros de 0 a 99 e rejeita o resto', () => {
    assert.equal(E.lerValor(''), null);
    assert.equal(E.lerValor(' 42 '), 42);
    assert.equal(E.lerValor('0'), 0);
    assert.ok(Number.isNaN(E.lerValor('100')));
    assert.ok(Number.isNaN(E.lerValor('-1')));
    assert.ok(Number.isNaN(E.lerValor('3,5')));
    assert.ok(Number.isNaN(E.lerValor('abc')));
});

test('pilha: o último a entrar é o primeiro a sair (LIFO)', () => {
    let p = [];
    for (const v of [1, 2, 3]) p = E.operar('pilha', 'inserir', p, v).estado;
    const r = E.operar('pilha', 'remover', p);
    assert.equal(r.ok, true);
    assert.equal(r.saiu, p[2].id);
    assert.deepEqual(valores(r.estado), [1, 2]);
    assert.equal(p.length, 3, 'a operação não altera o estado original');
});

test('pilha: estouro e underflow são avisados sem mudar o estado', () => {
    let p = [];
    for (let i = 0; i < E.CAPACIDADE; i++) p = E.empilhar(p, i).estado;
    const cheio = E.empilhar(p, 99);
    assert.equal(cheio.ok, false);
    assert.equal(cheio.estado, p);
    const vazio = E.desempilhar([]);
    assert.equal(vazio.ok, false);
    assert.match(vazio.msg, /vazia/);
});

test('fila: o primeiro a entrar é o primeiro a sair (FIFO)', () => {
    let f = [];
    for (const v of [7, 8, 9]) f = E.enfileirar(f, v).estado;
    const r = E.desenfileirar(f);
    assert.match(r.msg, /7/);
    assert.deepEqual(valores(r.estado), [8, 9]);
});

test('lista ligada: inserção no início, no fim, remoção e busca', () => {
    let l = E.aPartirDe([5, 6]);
    l = E.inserirInicio(l, 4).estado;
    const fim = E.inserirFim(l, 7);
    assert.equal(fim.complexidade, 'O(n)');
    assert.equal(fim.visitados.length, 3, 'percorre todos os nós até o último');
    l = fim.estado;
    assert.deepEqual(valores(l), [4, 5, 6, 7]);
    assert.deepEqual(valores(E.removerInicio(l).estado), [5, 6, 7]);

    const achou = E.buscar(l, 6);
    assert.equal(achou.ok, true);
    assert.equal(achou.visitados.length, 3);
    const naoAchou = E.buscar(l, 42);
    assert.equal(naoAchou.ok, false);
    assert.equal(naoAchou.visitados.length, 4);
});

test('cada nó recebe id único e endereço ilustrativo', () => {
    const l = E.aPartirDe([1, 1, 1]);
    assert.equal(new Set(l.map((n) => n.id)).size, 3);
    assert.match(l[0].endereco, /^0x[0-9A-F]+$/);
});

for (const alg of Object.keys(E.ALGORITMOS)) {
    test(`ordenação ${alg}: termina ordenado e conta passos coerentes`, () => {
        const rng = E.aleatorio(2026);
        const v = E.embaralhado(10, rng);
        const passos = E.passosOrdenacao(alg, v);
        const final = passos[passos.length - 1];
        assert.equal(final.tipo, 'fim');
        const ordenado = final.ordem.map((id) => v[id]);
        assert.deepEqual(ordenado, [...v].sort((a, b) => a - b));
        assert.equal(final.fixos.length, v.length);
        assert.equal(passos.filter((p) => p.tipo === 'comparar').length, final.comparacoes);
        assert.equal(passos.filter((p) => p.tipo === 'trocar').length, final.trocas);
    });
}

test('bolha e inserção não trocam nada em vetor já ordenado (melhor caso O(n))', () => {
    const v = [1, 2, 3, 4, 5, 6];
    for (const alg of ['bolha', 'insercao']) {
        const final = E.passosOrdenacao(alg, v).at(-1);
        assert.equal(final.trocas, 0);
        assert.equal(final.comparacoes, v.length - 1);
    }
    // a seleção sempre compara n(n-1)/2 vezes
    assert.equal(E.passosOrdenacao('selecao', v).at(-1).comparacoes, 15);
});

test('embaralhado gera valores distintos dentro da faixa', () => {
    const v = E.embaralhado(12, E.aleatorio(7));
    assert.equal(v.length, 12);
    assert.equal(new Set(v).size, 12);
    assert.ok(v.every((x) => x >= 5 && x <= 99));
});

test('árvore de busca: menores à esquerda, percurso em ordem sai ordenado', () => {
    const arv = E.bstDeValores([50, 30, 70, 20, 40, 60, 80]);
    assert.equal(arv.valor, 50);
    assert.equal(arv.esq.valor, 30);
    assert.equal(arv.dir.esq.valor, 60);
    assert.deepEqual(E.bstPercurso(arv, 'em').map((n) => n.valor), [20, 30, 40, 50, 60, 70, 80]);
    assert.deepEqual(E.bstPercurso(arv, 'pre').map((n) => n.valor), [50, 30, 20, 40, 70, 60, 80]);
    assert.deepEqual(E.bstPercurso(arv, 'pos').map((n) => n.valor), [20, 40, 30, 60, 80, 70, 50]);
    const lay = E.bstLayout(arv);
    assert.equal(lay.altura, 3);
    assert.equal(lay.arestas.length, 6);
});

test('árvore de busca: busca segue um único caminho; duplicado e altura máxima são recusados', () => {
    const arv = E.bstDeValores([50, 30, 70, 20, 40]);
    const r = E.bstBuscar(arv, 40);
    assert.equal(r.ok, true);
    assert.equal(r.caminho.length, 3);
    assert.equal(E.bstBuscar(arv, 99).ok, false);
    const dup = E.bstInserir(arv, 30);
    assert.equal(dup.ok, false);
    assert.equal(dup.estado, arv, 'não altera a árvore');
    // sequência crescente vira um "galho" (lista): pior caso O(n)
    const galho = E.bstDeValores([1, 2, 3, 4, 5]);
    const alto = E.bstInserir(galho, 6);
    assert.equal(alto.ok, false);
    assert.match(alto.msg, /níveis/);
});

test('algoritmo desconhecido gera erro claro', () => {
    assert.throws(() => E.passosOrdenacao('quick', [1]), /desconhecido/);
    assert.throws(() => E.operar('arvore', 'inserir', []), /desconhecida/);
});
