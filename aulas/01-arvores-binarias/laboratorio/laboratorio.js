/**
 * PÁGINA DE ORIENTAÇÃO DO LABORATÓRIO
 * Tema, menu, progresso de leitura, revelação, divisores, glossário (a partir de glossario.js),
 * passos marcados como feitos (salvos no navegador) e o "teste a regra".
 */
(function () {
    'use strict';
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => [...el.querySelectorAll(s)];
    const raiz = document.documentElement;
    const reduzir = matchMedia('(prefers-reduced-motion: reduce)');
    const ler = (k, padrao) => { try { return JSON.parse(localStorage.getItem(k)) ?? padrao; } catch (e) { return padrao; } };
    const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* navegação privada */ } };

    /* ---------- tema (um clique: sem esmaecer cores durante a troca) ---------- */
    const botaoTema = $('#botao-tema');
    let trocando = false;
    const sincronizar = () => {
        const escuro = raiz.dataset.tema === 'escuro';
        botaoTema.setAttribute('aria-pressed', String(escuro));
        botaoTema.setAttribute('aria-label', escuro ? 'Ativar modo claro' : 'Ativar modo escuro');
    };
    sincronizar();
    botaoTema.addEventListener('click', () => {
        if (trocando) return;
        trocando = true;
        raiz.classList.add('sem-transicao');
        raiz.dataset.tema = raiz.dataset.tema === 'escuro' ? 'claro' : 'escuro';
        try { localStorage.setItem('ed:tema', raiz.dataset.tema); } catch (e) { /* ignora */ }
        sincronizar();
        requestAnimationFrame(() => requestAnimationFrame(() => { raiz.classList.remove('sem-transicao'); trocando = false; }));
    });

    /* ---------- menu móvel ---------- */
    const menu = $('#menu'), botaoMenu = $('#botao-menu');
    const abrirMenu = (sim) => { menu.classList.toggle('aberto', sim); botaoMenu.setAttribute('aria-expanded', String(sim)); raiz.style.overflow = sim ? 'hidden' : ''; };
    botaoMenu.addEventListener('click', () => abrirMenu(!menu.classList.contains('aberto')));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) abrirMenu(false); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('aberto')) { abrirMenu(false); botaoMenu.focus(); } });

    /* ---------- títulos palavra a palavra ---------- */
    $$('[data-palavras]').forEach((t) => {
        const palavras = t.textContent.trim().split(/\s+/);
        t.setAttribute('aria-label', palavras.join(' '));
        t.innerHTML = palavras.map((p, i) => `<span class="palavra" aria-hidden="true"><span style="--i:${i}">${p}</span></span>`).join(' ');
    });

    /* ---------- divisores: o "próx" de uma parte aponta para a seguinte ---------- */
    $$('.divisor').forEach((d) => {
        d.innerHTML = `<a class="div-ligacao" href="${d.dataset.para}" tabindex="-1">
            <span class="div-campo">próx</span><span class="div-fio"><i></i></span>
            <span class="div-no"><b>${d.dataset.n}</b>${d.dataset.nome}<span>→</span></span></a>`;
    });

    /* ---------- revelação ao rolar (uma vez) ---------- */
    const revelador = new IntersectionObserver((es) => es.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('visivel'); revelador.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    $$('.etiqueta, .titulo[data-palavras], .divisor').forEach((el) => revelador.observe(el));

    /* ---------- barra de progresso, cabeçalho e item do menu ---------- */
    const topo = $('#topo'), barra = $('#progresso-barra');
    const links = $$('a', menu), alvos = links.map((a) => $(a.getAttribute('href')));
    let ultimoY = scrollY, agendado = false;
    const aoRolar = () => {
        agendado = false;
        const y = scrollY, total = document.documentElement.scrollHeight - innerHeight;
        barra.style.transform = `scaleX(${total > 0 ? y / total : 0})`;
        topo.classList.toggle('rolou', y > 10);
        if (!menu.classList.contains('aberto')) topo.classList.toggle('escondido', y > ultimoY && y > 400);
        ultimoY = y;
        let atual = -1;
        alvos.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * 0.35) atual = i; });
        links.forEach((a, i) => (i === atual ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    };
    addEventListener('scroll', () => { if (!agendado) { agendado = true; requestAnimationFrame(aoRolar); } }, { passive: true });
    aoRolar();

    /* ---------- glossário: marca todas as ocorrências fora de código, teclas, links e telas ---------- */
    const G = window.Glossario;
    const FORA = 'code, kbd, a, figure, script, style, .destino, .termo, .div-ligacao, h1, h2, .etiqueta, #lista-termos, button, label, summary';
    const caminhar = document.createTreeWalker($('[data-glossario]'), NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => (!n.nodeValue.trim() || n.parentElement.closest(FORA) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    const textos = [];
    while (caminhar.nextNode()) textos.push(caminhar.currentNode);
    textos.forEach((n) => {
        const pedacos = G.pedacos(n.nodeValue);
        if (!pedacos.some((p) => p.termo)) return;
        const frag = document.createDocumentFragment();
        pedacos.forEach((p) => {
            if (!p.termo) { frag.append(p.texto); return; }
            const s = document.createElement('span');
            s.className = 'termo'; s.tabIndex = 0; s.textContent = p.texto;
            s.dataset.def = p.def; s.dataset.termo = p.termo;
            frag.append(s);
        });
        n.replaceWith(frag);
    });
    // balão único posicionado junto do termo (mouse, foco do teclado ou toque)
    const balao = $('#balao');
    const mostrar = (el) => {
        balao.innerHTML = `<b>${el.dataset.termo}</b>${el.dataset.def}`;
        balao.hidden = false;
        const r = el.getBoundingClientRect(), b = balao.getBoundingClientRect();
        const x = Math.min(Math.max(12, r.left + r.width / 2 - b.width / 2), innerWidth - b.width - 12);
        const y = r.top - b.height - 10 > 8 ? r.top - b.height - 10 : r.bottom + 10;
        balao.style.left = `${x}px`; balao.style.top = `${y}px`;
    };
    const esconder = () => { balao.hidden = true; };
    document.addEventListener('mouseover', (e) => { const t = e.target.closest('.termo'); if (t) mostrar(t); });
    document.addEventListener('mouseout', (e) => { if (e.target.closest('.termo')) esconder(); });
    document.addEventListener('focusin', (e) => { const t = e.target.closest('.termo'); if (t) mostrar(t); else esconder(); });
    document.addEventListener('click', (e) => { const t = e.target.closest('.termo'); if (t) mostrar(t); else esconder(); });
    addEventListener('scroll', esconder, { passive: true });
    // lista completa na seção "Termos"
    $('#lista-termos').innerHTML = G.TERMOS.map((t) => `<div><dt>${t.termo}</dt><dd>${t.def}</dd></div>`).join('');

    /* ---------- passos marcados como feitos ---------- */
    const CHAVE = 'abb-lab:feitos';
    const feitos = new Set(ler(CHAVE, []));
    const passos = $$('.passo[data-passo]');
    const atualizarFeitos = () => {
        passos.forEach((p) => p.classList.toggle('feito-sim', feitos.has(p.dataset.passo)));
        $('#feitos-n').textContent = passos.filter((p) => feitos.has(p.dataset.passo)).length;
        $('#feitos-total').textContent = passos.length;
        $$('.percurso a').forEach((a) => {
            const sec = $(a.getAttribute('href'));
            const meus = sec ? $$('.passo[data-passo]', sec) : [];
            a.classList.toggle('concluido', meus.length > 0 && meus.every((p) => feitos.has(p.dataset.passo)));
        });
    };
    passos.forEach((p) => {
        const caixa = $('.feito input', p);
        if (!caixa) return;
        caixa.checked = feitos.has(p.dataset.passo);
        caixa.addEventListener('change', () => {
            caixa.checked ? feitos.add(p.dataset.passo) : feitos.delete(p.dataset.passo);
            gravar(CHAVE, [...feitos]);
            atualizarFeitos();
        });
    });
    atualizarFeitos();

    /* ---------- teste a regra (comparar com a raiz 45) ---------- */
    const form = $('#testa-form'), campo = $('#testa-valor'), saida = $('#testa-saida');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const t = campo.value.trim();
        if (!/^\d{1,2}$/.test(t)) { saida.textContent = 'Digite um número inteiro de 0 a 99.'; campo.focus(); return; }
        const v = Number(t);
        saida.innerHTML = v < 45
            ? `${v} &lt; 45 → vai para a <b>esquerda</b> da raiz.`
            : v === 45
                ? `45 = 45 → igual vai para a <b>direita</b> (a regra é “maior ou igual à direita”).`
                : `${v} &gt; 45 → vai para a <b>direita</b> da raiz.`;
    });
})();

/* Capturas de tela: tocar/clicar abre a imagem em tamanho real (útil no celular) */
document.querySelectorAll('.tela img, .cupom-figura img').forEach((img) => {
    img.tabIndex = 0;
    img.setAttribute('role', 'link');
    img.title = 'Abrir a imagem em tamanho real';
    const abrir = () => window.open(img.currentSrc || img.src, '_blank', 'noopener');
    img.addEventListener('click', abrir);
    img.addEventListener('keydown', (e) => { if (e.key === 'Enter') abrir(); });
});
