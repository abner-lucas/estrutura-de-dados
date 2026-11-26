/**
 * CÓDIGO DE CONFERÊNCIA DOS CUPONS DAS MISSÕES (Estoque ABB)
 *
 * O código depende SÓ do que está impresso no cupom: missão, dados, resultado,
 * nº de erros e data/hora até o minuto. Assim o professor refaz a conta na
 * página de conferência e descobre se um print foi editado.
 *
 * Regra:
 *   1. Monta um texto: prefixo + nº da missão (+ percurso, na missão 2) + cada campo
 *      normalizado + data/hora só com dígitos (ddmmaaaahhmm).
 *   2. Normalizar um campo = maiúsculas, sem acentos, e qualquer sequência que não seja
 *      letra/número vira um único "-" (assim "69 → 48 → None", "69->48->None" e
 *      "69 -> 48 -> none" dão o mesmo resultado).
 *   3. Hash FNV-1a de 32 bits do texto, escrito em base 36, 7 caracteres.
 *
 * Usado pelo simulador (Challenges.tsx) e pela página de conferência: uma regra só.
 * Testado em testes/codigo-cupom.test.js.
 */

const PREFIXO = 'ED-ABB-CUPOM-1';

export const MISSOES = {
    1: { titulo: '1 · Monte a árvore', campos: ['Os 7 números', 'Raiz', 'Nº de erros'] },
    2: { titulo: '2 · Ordem de visita', campos: ['Menor e maior nó', 'Lista final gerada', 'Nº de erros'], percurso: true },
    3: { titulo: '3 · Caminho da busca', campos: ['Valor buscado', 'Encontrou?', 'Caminho', 'Nº de erros'] },
};
export const PERCURSOS = ['em_ordem', 'pre_ordem', 'pos_ordem'];

export function normalizar(valor) {
    return String(valor ?? '')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toUpperCase()
        .replace(/[^0-9A-Z]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

const dois = (n) => String(n).padStart(2, '0');

/** Data/hora como 12 dígitos ddmmaaaahhmm. Aceita Date ou o texto do cupom ("25/11/2026, 22:34"). */
export function digitosDataHora(dataHora) {
    if (dataHora instanceof Date) {
        const d = dataHora;
        return `${dois(d.getDate())}${dois(d.getMonth() + 1)}${d.getFullYear()}${dois(d.getHours())}${dois(d.getMinutes())}`;
    }
    const m = String(dataHora ?? '').match(/(\d{1,2})\D+(\d{1,2})\D+(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
    if (!m) return '';
    return `${dois(m[1])}${dois(m[2])}${m[3]}${dois(m[4])}${dois(m[5])}`;
}

function fnv1a(texto) {
    let h = 2166136261;
    for (let i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
}

/** Código de 7 caracteres impresso no cupom. */
export function codigoCupom({ missao, percurso, campos, dataHora }) {
    const partes = [PREFIXO, String(missao)];
    if (MISSOES[missao]?.percurso) partes.push(normalizar(percurso || 'em_ordem'));
    for (const c of campos) partes.push(normalizar(c));
    partes.push(digitosDataHora(dataHora));
    return fnv1a(partes.join('|')).toString(36).toUpperCase().padStart(7, '0');
}

/** Compara o código digitado (ignora espaços, maiúsculas e confusões O/0, I/1). */
export function confere(dados, codigoDigitado) {
    const limpa = (s) => String(s ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
    return limpa(codigoCupom(dados)) === limpa(codigoDigitado);
}

/* ------------------------------------------------------------------
 * Coerência: mesmo com o código certo, os dados precisam seguir as regras
 * da árvore. Pega cupons inventados à mão e erros de digitação.
 * ------------------------------------------------------------------ */
const numeros = (s) => (String(s ?? '').match(/\d+/g) || []).map(Number);

export function coerencia({ missao, percurso, campos }) {
    const p = [];
    if (missao === 1) {
        const [lista, raiz] = [numeros(campos[0]), numeros(campos[1])[0]];
        if (lista.length !== 7) p.push(`A missão 1 sorteia 7 números; o cupom tem ${lista.length}.`);
        if (new Set(lista).size !== lista.length) p.push('Há números repetidos na lista (o sorteio não repete).');
        if (lista.length && raiz !== lista[0]) p.push(`A raiz deveria ser o primeiro número da fila (${lista[0]}), não ${raiz}.`);
    } else if (missao === 2) {
        const [mm, lista] = [numeros(campos[0]), numeros(campos[1])];
        if (lista.length !== 8) p.push(`A missão 2 usa 8 números; a lista tem ${lista.length}.`);
        if (lista.length && (mm[0] !== Math.min(...lista) || mm[1] !== Math.max(...lista))) p.push(`Menor e maior deveriam ser ${Math.min(...lista)} e ${Math.max(...lista)}.`);
        if ((percurso || 'em_ordem') === 'em_ordem' && lista.some((v, i) => i && v < lista[i - 1])) p.push('No em_ordem a lista sai sempre em ordem crescente, e esta não está.');
    } else if (missao === 3) {
        const alvo = numeros(campos[0])[0];
        const achou = normalizar(campos[1]).startsWith('S');
        const texto = normalizar(campos[2]);
        const caminho = numeros(campos[2]);
        const terminaNone = texto.endsWith('NONE');
        if (achou && caminho[caminho.length - 1] !== alvo) p.push(`Se encontrou, o caminho termina no ${alvo}.`);
        if (achou && terminaNone) p.push('Encontrou e terminou em None ao mesmo tempo: impossível.');
        if (!achou && !terminaNone) p.push('Se não encontrou, o caminho termina em None.');
        if (!achou && caminho.includes(alvo)) p.push(`O caminho passa pelo ${alvo}, então ele foi encontrado.`);
        // cada passo precisa respeitar os limites deixados pelas comparações anteriores
        let min = -Infinity, max = Infinity;
        for (let i = 0; i < caminho.length; i++) {
            const v = caminho[i];
            if (v < min || v >= max) { p.push(`O ${v} não pode aparecer nesse ponto do caminho: ele não está do lado certo das caixas anteriores.`); break; }
            if (v === alvo) break;
            if (alvo < v) max = v; else min = v;
        }
    }
    return p;
}
