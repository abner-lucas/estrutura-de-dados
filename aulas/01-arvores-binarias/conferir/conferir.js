// Página de conferência dos cupons: monta o formulário igual ao cupom e confere ao digitar.
import { MISSOES, PERCURSOS, codigoCupom, confere, coerencia } from './codigo-cupom.mjs?v=2026.11.26';

const form = document.getElementById('form');
const caixa = document.getElementById('campos');
const saida = document.getElementById('resultado');
const DICAS = {
    'Os 7 números': 'na ordem do cupom, ex.: 47, 51, 45, 39, 50, 13, 90',
    'Lista final gerada': 'ex.: [10, 20, 30, 45]',
    'Menor e maior nó': 'ex.: 10 e 98',
    'Encontrou?': 'Sim ou Não',
    'Caminho': 'ex.: 69 → 48 → 34 → None (no teclado, pode usar - > no lugar da seta)',
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function missao() { return Number(form.querySelector('input[name="missao"]:checked').value); }

function montar() {
    const m = MISSOES[missao()];
    let html = '';
    if (m.percurso) {
        html += `<label>Percurso<select id="percurso">${PERCURSOS.map((p) => `<option>${p}</option>`).join('')}</select></label>
                 <p class="dica">aparece no título do cupom, entre parênteses</p>`;
    }
    m.campos.forEach((c, i) => {
        html += `<label>${esc(c)}<input id="c${i}" autocomplete="off"></label>`;
        if (DICAS[c]) html += `<p class="dica">${esc(DICAS[c])}</p>`;
    });
    html += `<div class="sep"></div>
             <label>Data e hora<input id="data" placeholder="25/11/2026, 22:34" autocomplete="off"></label>
             <label class="codigo">nº<input id="codigo" placeholder="1N9CQ80" maxlength="9" autocomplete="off"></label>`;
    caixa.innerHTML = html;
    saida.hidden = true;
}

function conferir() {
    const m = missao();
    const els = MISSOES[m].campos.map((_, i) => document.getElementById('c' + i));
    if (els.some((e) => !e)) return; // formulário ainda sendo montado
    const campos = els.map((e) => e.value);
    const dataHora = document.getElementById('data').value;
    const codigo = document.getElementById('codigo').value;
    const percurso = document.getElementById('percurso')?.value;
    const vazio = [...campos, dataHora, codigo].some((v) => !v.trim());
    if (vazio) { saida.hidden = true; return; }

    const dados = { missao: m, percurso, campos, dataHora };
    const ok = confere(dados, codigo);
    const problemas = coerencia(dados);
    saida.hidden = false;
    saida.className = 'resultado ' + (ok && !problemas.length ? 'ok' : 'ruim');
    let html = ok
        ? '<h2>O código confere</h2><p>Os dados digitados são os mesmos que geraram este código.</p>'
        : `<h2>O código não confere</h2><p>Com esses dados, o código seria <code>${codigoCupom(dados)}</code>. Antes de concluir que o print foi editado, confira se você digitou cada campo e a data e hora exatamente como estão no cupom.</p>`;
    if (problemas.length) html += `<p><b>Os dados também não seguem as regras da missão:</b></p><ul>${problemas.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>`;
    else if (ok) html += '<p>Os dados seguem as regras da árvore.</p>';
    saida.innerHTML = html;
}

form.addEventListener('change', (e) => { if (e.target.name === 'missao') montar(); else conferir(); });
form.addEventListener('input', (e) => { if (e.target.name !== 'missao') conferir(); });
form.addEventListener('submit', (e) => e.preventDefault());
montar();
