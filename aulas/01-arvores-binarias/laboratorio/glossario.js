/**
 * GLOSSÁRIO DA PÁGINA DE ORIENTAÇÃO (fonte única dos termos e siglas)
 * Cada termo vira uma marcação com o significado, em TODAS as ocorrências do texto,
 * menos dentro de código, teclas, links e reproduções de tela.
 * Lógica pura (sem DOM): testada em testes/glossario.test.js.
 */
(function (raiz, fabrica) {
    const api = fabrica();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else raiz.Glossario = api;
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const TERMOS = [
        { termo: 'ABB', def: 'Árvore binária de busca: cada nó tem até dois filhos; os menores ficam à esquerda e os maiores ou iguais à direita.' },
        { termo: 'árvore binária de busca', def: 'Estrutura em que cada nó tem até dois filhos; os menores ficam à esquerda e os maiores ou iguais à direita.' },
        { termo: 'nó', variantes: ['nós'], def: 'Cada elemento da árvore. No simulador, cada caixa com um código de produto.' },
        { termo: 'raiz', def: 'O primeiro nó, no topo da árvore. Toda inserção e toda busca começam por ela.' },
        { termo: 'folha', variantes: ['folhas'], def: 'Nó que não tem filhos: nenhuma caixa embaixo dele.' },
        { termo: 'nível', variantes: ['níveis'], def: 'Cada camada da árvore. A raiz está no nível 1, os filhos dela no nível 2, e assim por diante.' },
        { termo: 'altura', def: 'Quantos níveis a árvore tem, da raiz até a folha mais funda.' },
        { termo: 'percurso em ordem', def: 'Percurso que visita a esquerda, depois o próprio nó, depois a direita.' },
        { termo: 'None', def: 'Valor do Python que significa "nada". Na árvore, é um espaço vazio onde não há caixa.' },
        { termo: 'EAN-13', def: 'Padrão de código de barras de 13 dígitos usado nos produtos das lojas. Aparece nas etiquetas das caixas.' },
        { termo: 'SIGAA', def: 'Sistema Integrado de Gestão de Atividades Acadêmicas: onde você entrega a ficha.' },
        { termo: '.docx', def: 'Formato de arquivo do Word. Também abre no LibreOffice e no Google Docs.' },
    ];

    const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escaparHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

    /** Lista plana (forma escrita → definição), da mais longa para a mais curta. */
    function formas(termos = TERMOS) {
        const lista = [];
        for (const t of termos) for (const f of [t.termo, ...(t.variantes || [])]) lista.push({ forma: f, termo: t.termo, def: t.def });
        return lista.sort((a, b) => b.forma.length - a.forma.length);
    }

    /** Regex que só casa palavra inteira (respeitando acentos) e sem diferenciar maiúsculas. */
    function regex(termos = TERMOS) {
        const alternativas = formas(termos).map((f) => escapar(f.forma)).join('|');
        return new RegExp(`(?<![\\p{L}\\p{N}_])(${alternativas})(?![\\p{L}\\p{N}_])`, 'giu');
    }

    /**
     * Divide um texto em pedaços: { texto } ou { texto, termo, def } para cada ocorrência.
     * Siglas (tudo maiúsculo, como ABB e SIGAA) só casam com a mesma grafia.
     */
    function pedacos(texto, termos = TERMOS) {
        const mapa = new Map(formas(termos).map((f) => [f.forma.toLowerCase(), f]));
        const saida = [];
        let ultimo = 0;
        for (const m of texto.matchAll(regex(termos))) {
            const f = mapa.get(m[1].toLowerCase());
            if (!f) continue;
            const sigla = f.forma === f.forma.toUpperCase() && /[A-Z]/.test(f.forma);
            if (sigla && m[1] !== f.forma) continue;
            if (m.index > ultimo) saida.push({ texto: texto.slice(ultimo, m.index) });
            saida.push({ texto: m[1], termo: f.termo, def: f.def });
            ultimo = m.index + m[1].length;
        }
        if (ultimo < texto.length) saida.push({ texto: texto.slice(ultimo) });
        return saida;
    }

    /** Versão em HTML (usada nos testes e onde não há DOM). */
    function marcarHtml(texto, termos = TERMOS) {
        return pedacos(texto, termos).map((p) => (p.termo
            ? `<span class="termo" tabindex="0" data-def="${escaparHtml(p.def)}">${escaparHtml(p.texto)}</span>`
            : escaparHtml(p.texto))).join('');
    }

    return { TERMOS, formas, regex, pedacos, marcarHtml };
});
