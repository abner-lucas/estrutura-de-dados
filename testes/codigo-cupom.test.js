// Rode com: node --test testes/
const test = require('node:test');
const assert = require('node:assert/strict');

const carregar = () => import('../aulas/01-arvores-binarias/conferir/codigo-cupom.mjs');

const cupom3 = { missao: 3, campos: ['26', 'Não', '69 → 48 → 34 → None', '0'], dataHora: '25/11/2026, 22:34' };

test('o código depende só do que está impresso e ignora formatação', async () => {
    const C = await carregar();
    const cod = C.codigoCupom(cupom3);
    assert.match(cod, /^[0-9A-Z]{7}$/);
    // mesma coisa digitada de outro jeito
    assert.equal(C.codigoCupom({ missao: 3, campos: [' 26 ', 'nao', '69->48->34->none', '0'], dataHora: '25/11/2026 22:34' }), cod);
    // Date do simulador no mesmo minuto dá o mesmo código
    assert.equal(C.codigoCupom({ ...cupom3, dataHora: new Date(2026, 10, 25, 22, 34, 59, 999) }), cod);
});

test('qualquer dado trocado muda o código', async () => {
    const C = await carregar();
    const cod = C.codigoCupom(cupom3);
    assert.notEqual(C.codigoCupom({ ...cupom3, campos: ['26', 'Não', '69 → 48 → 34 → None', '2'] }), cod);
    assert.notEqual(C.codigoCupom({ ...cupom3, campos: ['27', 'Não', '69 → 48 → 34 → None', '0'] }), cod);
    assert.notEqual(C.codigoCupom({ ...cupom3, dataHora: '25/11/2026, 22:35' }), cod);
    assert.notEqual(C.codigoCupom({ ...cupom3, missao: 1 }), cod);
});

test('confere aceita O no lugar de 0 e espaços', async () => {
    const C = await carregar();
    const cod = C.codigoCupom(cupom3);
    assert.ok(C.confere(cupom3, ` ${cod.toLowerCase().replace(/0/g, 'o')} `));
    assert.ok(!C.confere(cupom3, 'ZZZZZZZ'));
});

test('missão 2: o percurso entra no código', async () => {
    const C = await carregar();
    const base = { missao: 2, campos: ['10 e 90', '[10, 20, 30, 40, 50, 60, 70, 90]', '1'], dataHora: '25/11/2026, 22:34' };
    assert.notEqual(C.codigoCupom({ ...base, percurso: 'em_ordem' }), C.codigoCupom({ ...base, percurso: 'pre_ordem' }));
    assert.equal(C.codigoCupom(base), C.codigoCupom({ ...base, percurso: 'em_ordem' }));
});

test('coerência: cupons válidos passam', async () => {
    const C = await carregar();
    assert.deepEqual(C.coerencia(cupom3), []);
    assert.deepEqual(C.coerencia({ missao: 3, campos: ['34', 'Sim', '69 → 48 → 34', '0'] }), []);
    assert.deepEqual(C.coerencia({ missao: 1, campos: ['47, 51, 45, 39, 50, 13, 90', '47', '12'] }), []);
    assert.deepEqual(C.coerencia({ missao: 2, percurso: 'em_ordem', campos: ['10 e 90', '[10, 20, 30, 40, 50, 60, 70, 90]', '0'] }), []);
});

test('coerência: pega cupons impossíveis', async () => {
    const C = await carregar();
    // 50 não pode vir depois de 48 quando o alvo 26 mandou para a esquerda do 48
    assert.ok(C.coerencia({ missao: 3, campos: ['26', 'Não', '69 → 48 → 50 → None', '0'] }).length);
    assert.ok(C.coerencia({ missao: 3, campos: ['26', 'Sim', '69 → 48 → None', '0'] }).length);
    assert.ok(C.coerencia({ missao: 1, campos: ['47, 51, 45, 39, 50, 13, 90', '51', '0'] }).length);
    assert.ok(C.coerencia({ missao: 2, percurso: 'em_ordem', campos: ['10 e 90', '[20, 10, 30, 40, 50, 60, 70, 90]', '0'] }).length);
});
