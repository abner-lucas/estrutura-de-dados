/**
 * INTERFACE DO PORTAL
 * Tema, cabeçalho, animações ligadas à rolagem, visualizador de estruturas,
 * filtro de atividades, laboratório de ordenação e trilha.
 * A lógica (operações e passos dos algoritmos) vem de logica.js (window.Estruturas).
 */
(function () {
    'use strict';
    const E = window.Estruturas;
    const raiz = document.documentElement;
    const reduzir = matchMedia('(prefers-reduced-motion: reduce)');
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => [...el.querySelectorAll(s)];
    const esperar = (ms) => new Promise((r) => setTimeout(r, reduzir.matches ? 0 : ms));
    const limitar = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

    /* ================= TEMA ================= */
    const botaoTema = $('#botao-tema');
    function sincronizarTema() {
        const escuro = raiz.dataset.tema === 'escuro';
        botaoTema.setAttribute('aria-pressed', String(escuro));
        botaoTema.setAttribute('aria-label', escuro ? 'Ativar modo claro' : 'Ativar modo escuro');
    }
    sincronizarTema();
    botaoTema.addEventListener('click', (ev) => {
        const aplicar = () => {
            raiz.dataset.tema = raiz.dataset.tema === 'escuro' ? 'claro' : 'escuro';
            try { localStorage.setItem('ed:tema', raiz.dataset.tema); } catch (e) { /* navegação privada */ }
            sincronizarTema();
        };
        if (!document.startViewTransition || reduzir.matches) return aplicar();
        const r = botaoTema.getBoundingClientRect();
        const x = ev.clientX || r.left + r.width / 2, y = ev.clientY || r.top + r.height / 2;
        const raio = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
        document.startViewTransition(aplicar).ready.then(() => {
            raiz.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${raio}px at ${x}px ${y}px)`] },
                { duration: 650, easing: 'cubic-bezier(0.16,1,0.3,1)', pseudoElement: '::view-transition-new(root)' });
        });
    });

    /* ================= MENU MÓVEL ================= */
    const menu = $('#menu'), botaoMenu = $('#botao-menu');
    function abrirMenu(abrir) {
        menu.classList.toggle('aberto', abrir);
        botaoMenu.setAttribute('aria-expanded', String(abrir));
        botaoMenu.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu');
        raiz.style.overflow = abrir ? 'hidden' : '';
    }
    botaoMenu.addEventListener('click', () => abrirMenu(!menu.classList.contains('aberto')));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) abrirMenu(false); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('aberto')) { abrirMenu(false); botaoMenu.focus(); } });

    /* ================= TÍTULOS PALAVRA A PALAVRA ================= */
    $$('[data-palavras]').forEach((titulo) => {
        let i = 0;
        const frag = document.createDocumentFragment();
        const embrulhar = (texto, envolver) => {
            texto.split(/\s+/).filter(Boolean).forEach((p) => {
                const mascara = document.createElement('span');
                mascara.className = 'palavra';
                const dentro = document.createElement('span');
                dentro.style.setProperty('--i', i++);
                if (envolver) { const c = envolver.cloneNode(false); c.textContent = p; dentro.append(c); } else dentro.textContent = p;
                mascara.append(dentro);
                frag.append(mascara, ' ');
            });
        };
        titulo.childNodes.forEach((n) => {
            if (n.nodeType === 3) embrulhar(n.textContent);
            else if (n.nodeType === 1) embrulhar(n.textContent, n);
        });
        titulo.setAttribute('aria-label', titulo.textContent.replace(/\s+/g, ' ').trim());
        titulo.replaceChildren(frag);
        $$('.palavra', titulo).forEach((p) => p.setAttribute('aria-hidden', 'true'));
    });
    requestAnimationFrame(() => $('.abertura-titulo').classList.add('visivel'));

    /* ================= REVELAÇÃO (uma vez) ================= */
    $$('[data-cascata]').forEach((lista) => {
        const filhos = [...lista.children];
        // no mural (uma pilha) o aviso mais antigo entra primeiro, como uma sequência de push
        const pilha = lista.classList.contains('mural');
        filhos.forEach((f, i) => f.style.setProperty('--i', pilha ? filhos.length - 1 - i : i));
    });

    /* Divisores: o campo "próx" de uma seção aponta para a seguinte */
    $$('.divisor').forEach((d) => {
        d.innerHTML = `<a class="div-ligacao" href="${d.dataset.para}" tabindex="-1">
            <span class="div-campo">próx</span><span class="div-fio"><i></i></span>
            <span class="div-no"><b>${d.dataset.n}</b>${d.dataset.nome}<span>→</span></span></a>`;
    });
    const revelador = new IntersectionObserver((entradas) => {
        entradas.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visivel'); revelador.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    $$('.etiqueta, [data-cascata], .titulo[data-palavras], .divisor').forEach((el) => revelador.observe(el));

    /* ================= ROLAGEM: cabeçalho, progresso, cenas, trilha ================= */
    const topo = $('#topo'), barra = $('#progresso-barra');
    const cenas = $$('[data-cena]').map((secao) => ({
        secao, palco: secao.dataset.cena === 'palco',
        alvo: secao.dataset.cena === 'palco' ? $('.palco', secao) : secao.firstElementChild,
    }));
    const trilha = $('#trilha-lista'), ponteiroTrilha = $('#trilha-ponteiro'), etapas = $$('.etapa', trilha);
    const linksMenu = $$('a', menu), secoesMenu = linksMenu.map((a) => $(a.getAttribute('href')));
    let ultimoY = scrollY, agendado = false;

    function aoRolar() {
        agendado = false;
        const y = scrollY, vh = innerHeight;
        const total = document.documentElement.scrollHeight - vh;
        barra.style.transform = `scaleX(${total > 0 ? y / total : 0})`;

        topo.classList.toggle('rolou', y > 10);
        if (!menu.classList.contains('aberto')) topo.classList.toggle('escondido', y > ultimoY && y > 400);
        ultimoY = y;

        // Cada seção "se abre" enquanto sobe; termina quando o topo dela chega a 65% da tela.
        cenas.forEach(({ secao, alvo, palco }) => {
            if (reduzir.matches) { alvo.style.clipPath = alvo.style.transform = alvo.style.opacity = ''; return; }
            const t = secao.getBoundingClientRect().top;
            const p = limitar((vh - t) / (vh * 0.35));
            if (p >= 1) { alvo.style.clipPath = alvo.style.transform = alvo.style.opacity = ''; return; }
            const q = 1 - p;
            alvo.style.clipPath = palco
                ? `inset(${4 * q}% ${5 * q}% 0% ${5 * q}% round ${36 + 20 * q}px)`
                : `inset(${3 * q}% ${2 * q}% 0% ${2 * q}% round ${40 * q}px)`;
            alvo.style.transform = `translateY(${48 * q}px)`;
            alvo.style.opacity = String(0.7 + 0.3 * limitar(p / 0.4));
        });

        // Trilha: o ponteiro desce acompanhando a leitura e "visita" cada nó.
        const r = trilha.getBoundingClientRect();
        ponteiroTrilha.style.transform = `scaleY(${limitar((vh * 0.6 - r.top) / r.height)})`;
        etapas.forEach((et) => et.classList.toggle('ativa', et.getBoundingClientRect().top < vh * 0.6));

        // Link do menu da seção atual
        let atual = -1;
        secoesMenu.forEach((s, i) => { if (s && s.getBoundingClientRect().top < vh * 0.4) atual = i; });
        linksMenu.forEach((a, i) => (i === atual ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    }
    const agendar = () => { if (!agendado) { agendado = true; requestAnimationFrame(aoRolar); } };
    addEventListener('scroll', agendar, { passive: true });
    addEventListener('resize', agendar);
    aoRolar();

    /* ================= ABAS COM CURSOR DESLIZANTE ================= */
    function posicionarCursor(grupo, botao) {
        const cursor = $('.abas-cursor, .seletor-cursor', grupo);
        if (!cursor || !botao) return;
        cursor.style.width = botao.offsetWidth + 'px';
        cursor.style.height = botao.offsetHeight + 'px';
        cursor.style.transform = `translate(${botao.offsetLeft}px, ${botao.offsetTop - (cursor.classList.contains('abas-cursor') ? 4 : 0)}px)`;
    }
    /** Abas acessíveis: clique e setas do teclado. */
    function abas(grupo, aoEscolher) {
        const botoes = $$('[role="tab"]', grupo);
        const escolher = (b, focar) => {
            botoes.forEach((x) => { const ok = x === b; x.setAttribute('aria-selected', String(ok)); x.tabIndex = ok ? 0 : -1; });
            if (focar) b.focus();
            posicionarCursor(grupo, b);
            aoEscolher(b);
        };
        botoes.forEach((b) => b.addEventListener('click', () => escolher(b)));
        grupo.addEventListener('keydown', (e) => {
            const i = botoes.indexOf(document.activeElement);
            if (i < 0) return;
            const d = { ArrowRight: 1, ArrowLeft: -1, Home: -i, End: botoes.length - 1 - i }[e.key];
            if (d === undefined) return;
            e.preventDefault();
            escolher(botoes[(i + d + botoes.length) % botoes.length], true);
        });
        const reposicionar = () => posicionarCursor(grupo, botoes.find((b) => b.getAttribute('aria-selected') === 'true'));
        reposicionar();
        addEventListener('resize', reposicionar);
        document.fonts && document.fonts.ready.then(reposicionar);
    }

    /* ================= VISUALIZADOR DE ESTRUTURAS ================= */
    const CONFIG = {
        pilha: {
            arquivo: 'memória · pilha (LIFO)', a: 'topo', b: 'base',
            dica: 'Digite um número e empilhe. Depois desempilhe e veja quem sai primeiro.',
            botoes: [['inserir', 'Empilhar', 'push', true], ['remover', 'Desempilhar', 'pop']],
        },
        fila: {
            arquivo: 'memória · fila (FIFO)', a: 'início · sai daqui', b: 'fim · entra aqui',
            dica: 'Quem chega entra no fim; quem é atendido sai do início, como a fila do refeitório.',
            botoes: [['inserir', 'Enfileirar', 'enqueue', true], ['remover', 'Desenfileirar', 'dequeue']],
        },
        lista: {
            arquivo: 'memória · lista ligada', a: 'cabeça', b: '',
            dica: 'Cada nó guarda um valor e um ponteiro para o próximo. O último aponta para NULL.',
            botoes: [['inserir', 'Inserir no fim'], ['inserirInicio', 'Inserir no início'], ['remover', 'Remover cabeça'], ['buscar', 'Buscar']],
        },
    };
    const estados = { pilha: E.aPartirDe([12, 7, 31]), fila: E.aPartirDe([4, 15, 9]), lista: E.aPartirDe([8, 23, 42]) };
    let tipo = 'pilha', ocupado = false;
    const palcoVis = $('#vis-palco'), listaNos = $('#vis-nos'), campoValor = $('#vis-valor');
    const caixaBotoes = $('#vis-botoes'), consoleVis = $('#vis-estado');

    function noHTML(no) {
        const li = document.createElement('li');
        li.className = 'vis-no';
        li.dataset.id = no.id;
        li.innerHTML = `<b>${no.valor}</b><i></i><small>${no.endereco}</small>`;
        li.setAttribute('aria-label', `valor ${no.valor}`);
        return li;
    }

    function desenhar(entrou) {
        const estado = estados[tipo];
        const atuais = new Map($$('.vis-no', listaNos).map((li) => [li.dataset.id, li]));
        const frag = document.createDocumentFragment();
        estado.forEach((no) => frag.append(atuais.get(String(no.id)) || noHTML(no)));
        if (tipo === 'lista') {
            const nulo = document.createElement('li');
            nulo.className = 'vis-null'; nulo.textContent = 'NULL'; nulo.setAttribute('aria-label', 'fim da lista, NULL');
            frag.append(nulo);
        }
        if (!estado.length && tipo !== 'lista') {
            const v = document.createElement('li');
            v.className = 'vis-vazio'; v.textContent = tipo === 'pilha' ? 'pilha vazia' : 'fila vazia';
            frag.append(v);
        }
        listaNos.replaceChildren(frag);
        if (entrou) {
            const novo = $(`.vis-no[data-id="${entrou}"]`, listaNos);
            if (novo) { novo.classList.add('entrando'); novo.addEventListener('animationend', () => novo.classList.remove('entrando'), { once: true }); }
        }
    }

    function escrever(msg, custo, erro = false) {
        $('#vis-msg').textContent = msg;
        $('#vis-custo').textContent = custo;
        consoleVis.classList.toggle('erro', erro);
    }

    function montarBotoes() {
        caixaBotoes.replaceChildren(...CONFIG[tipo].botoes.map(([op, rotulo, codigo], i) => {
            const b = document.createElement('button');
            b.type = i === 0 ? 'submit' : 'button';
            b.className = 'botao ' + (i === 0 ? 'botao-cheio' : 'botao-fantasma');
            b.dataset.op = op;
            b.innerHTML = codigo ? `${rotulo} <code>${codigo}()</code>` : rotulo;
            return b;
        }));
    }

    function trocarTipo(novo) {
        tipo = novo;
        const c = CONFIG[tipo];
        palcoVis.dataset.tipo = tipo;
        palcoVis.setAttribute('aria-labelledby', 'aba-' + tipo);
        $('#vis-arquivo').textContent = c.arquivo;
        $('#vis-rotulo-a').textContent = c.a;
        $('#vis-rotulo-b').textContent = c.b;
        $('#vis-rotulo-b').hidden = !c.b;
        listaNos.replaceChildren();
        desenhar();
        montarBotoes();
        escrever(c.dica, tipo === 'lista' ? 'O(1) · O(n)' : 'O(1)');
    }

    async function percorrer(ids, achou) {
        for (const id of ids) {
            const li = $(`.vis-no[data-id="${id}"]`, listaNos);
            if (li) li.classList.add('visitado');
            await esperar(260);
        }
        if (achou) $(`.vis-no[data-id="${achou}"]`, listaNos)?.classList.add('achado');
        await esperar(achou ? 900 : 400);
        $$('.vis-no', listaNos).forEach((li) => li.classList.remove('visitado', 'achado'));
    }

    async function executar(op) {
        if (ocupado) return;
        const precisaValor = op !== 'remover';
        let valor = E.lerValor(campoValor.value);
        if (precisaValor && Number.isNaN(valor)) {
            campoValor.classList.remove('invalido'); void campoValor.offsetWidth; campoValor.classList.add('invalido');
            escrever('Use um número inteiro de 0 a 99.', '—', true);
            campoValor.focus();
            return;
        }
        if (precisaValor && valor === null) {
            if (op === 'buscar') { escrever('Digite o valor que você quer procurar.', 'O(n)', true); campoValor.focus(); return; }
            valor = Math.floor(Math.random() * 100);
        }

        ocupado = true;
        caixaBotoes.querySelectorAll('button').forEach((b) => (b.disabled = true));
        const r = E.operar(tipo, op, estados[tipo], valor);
        if (r.visitados && r.visitados.length) await percorrer(r.visitados, r.achou);
        if (r.saiu) {
            $(`.vis-no[data-id="${r.saiu}"]`, listaNos)?.classList.add('saindo');
            await esperar(380);
        }
        estados[tipo] = r.estado;
        desenhar(r.entrou);
        escrever(r.msg, r.complexidade, !r.ok);
        if (r.ok && op !== 'buscar') campoValor.value = '';
        caixaBotoes.querySelectorAll('button').forEach((b) => (b.disabled = false));
        ocupado = false;
    }

    $('#vis-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const op = (e.submitter && e.submitter.dataset.op) || CONFIG[tipo].botoes[0][0];
        executar(op);
    });
    caixaBotoes.addEventListener('click', (e) => {
        const b = e.target.closest('button[type="button"]');
        if (b) executar(b.dataset.op);
    });
    campoValor.addEventListener('input', () => campoValor.classList.remove('invalido'));
    abas($('.visualizador .abas'), (b) => trocarTipo(b.dataset.tipo));
    trocarTipo('pilha');

    /* ================= FILTRO DE ATIVIDADES ================= */
    const seletor = $('.seletor'), cartoes = $$('.no-card');
    function marcarUltimo() {
        const visiveis = cartoes.filter((c) => !c.classList.contains('oculto-filtro'));
        cartoes.forEach((c) => c.classList.toggle('ultimo-visivel', c === visiveis[visiveis.length - 1]));
        $('#atividades-vazio').hidden = visiveis.length > 0;
    }
    $$('.seletor-op', seletor).forEach((b) => b.addEventListener('click', () => {
        $$('.seletor-op', seletor).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        posicionarCursor(seletor, b);
        const f = b.dataset.filtro;
        cartoes.forEach((c) => c.classList.toggle('oculto-filtro', f !== 'todas' && c.dataset.categoria !== f));
        marcarUltimo();
    }));
    const reposSeletor = () => posicionarCursor(seletor, $('.seletor-op[aria-pressed="true"]', seletor));
    reposSeletor(); addEventListener('resize', reposSeletor); document.fonts && document.fonts.ready.then(reposSeletor);
    marcarUltimo();

    /* ================= BANCADAS DO LABORATÓRIO ================= */
    const bancadas = $$('.bancada');
    function abrirBancada(botao, focar) {
        bancadas.forEach((b) => {
            const ok = b === botao;
            b.setAttribute('aria-selected', String(ok));
            b.tabIndex = ok ? 0 : -1;
            document.getElementById(b.getAttribute('aria-controls')).hidden = !ok;
        });
        if (focar) botao.focus();
        // painéis escondidos não tinham tamanho: deixa abas e desenhos se medirem de novo
        dispatchEvent(new Event('resize'));
    }
    bancadas.forEach((b) => b.addEventListener('click', () => abrirBancada(b)));
    $('.bancadas')?.addEventListener('keydown', (e) => {
        const i = bancadas.indexOf(document.activeElement);
        const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (i < 0 || d === undefined) return;
        e.preventDefault();
        abrirBancada(bancadas[(i + d + bancadas.length) % bancadas.length], true);
    });
    // links para #lab-lineares, #lab-ordenacao e #arvore abrem a bancada certa
    function seguirEndereco(hash, rolar) {
        const botao = bancadas.find((b) => '#' + b.getAttribute('aria-controls') === hash);
        if (!botao) return false;
        abrirBancada(botao);
        if (rolar) requestAnimationFrame(() => $('#laboratorio').scrollIntoView({ behavior: reduzir.matches ? 'auto' : 'smooth' }));
        return true;
    }
    document.addEventListener('click', (e) => {
        const a = e.target.closest('a[href^="#"]');
        if (a && seguirEndereco(a.getAttribute('href'), true)) { e.preventDefault(); history.replaceState(null, '', a.getAttribute('href')); }
    });
    addEventListener('hashchange', () => seguirEndereco(location.hash, true));
    if (location.hash) seguirEndereco(location.hash, true);

    /* ================= CARTÕES QUE INCLINAM COM O PONTEIRO ================= */
    if (!reduzir.matches && matchMedia('(hover: hover)').matches) {
        $$('.no-card').forEach((c) => {
            c.addEventListener('pointermove', (e) => {
                const r = c.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
                c.style.transform = `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateY(-6px)`;
            });
            c.addEventListener('pointerleave', () => { c.style.transform = ''; });
        });
    }

    /* ================= BUSCA NOS CÓDIGOS DAS AULAS ================= */
    const buscaCodigos = $('#busca-codigos');
    if (buscaCodigos) {
        // ignora acentos e maiúsculas: "funcoes" encontra "Funções"
        const normal = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
        const itensCod = $$('#cadernos li').map((li) => ({ li, texto: normal(li.dataset.busca + ' ' + li.textContent) }));
        const totalCod = itensCod.length;
        buscaCodigos.addEventListener('input', () => {
            const termos = normal(buscaCodigos.value).split(/\s+/).filter(Boolean);
            let visiveis = 0;
            itensCod.forEach(({ li, texto }) => {
                const ok = termos.every((t) => texto.includes(t));
                li.hidden = !ok;
                if (ok) visiveis++;
            });
            $$('#cadernos .caderno').forEach((c) => { c.hidden = !$$('li', c).some((li) => !li.hidden); });
            $('#codigos-contagem').textContent = termos.length ? `${visiveis} de ${totalCod} notebooks` : `${totalCod} notebooks`;
            $('#codigos-vazio').hidden = visiveis > 0;
        });
    }

    /* ================= LABORATÓRIO DE ORDENAÇÃO ================= */
    const caixaBarras = $('#ord-barras'), estadoOrd = $('#ord-estado');
    const botaoPlay = $('#ord-play'), textoPlay = $('#ord-play-txt'), botaoPasso = $('#ord-passo');
    const VELOCIDADES = { 1: [950, 'lenta'], 2: [620, 'calma'], 3: [400, 'média'], 4: [210, 'rápida'], 5: [90, 'turbo'] };
    const ord = { alg: 'bolha', valores: [], passos: [], idx: 0, timer: 0, visivel: true };
    let barras = [];

    function novoVetor() {
        ord.valores = E.embaralhado(innerWidth < 640 ? 8 : 10);
        barras = ord.valores.map((v, id) => {
            const el = document.createElement('div');
            el.className = 'barra';
            el.style.width = `${100 / ord.valores.length}%`;
            el.style.height = `${12 + (v / 99) * 80}%`;
            el.innerHTML = `<i></i><b>${v}</b>`;
            el.dataset.id = id;
            return el;
        });
        caixaBarras.replaceChildren(...barras);
        caixaBarras.setAttribute('aria-label', 'Vetor: ' + ord.valores.join(', '));
        reiniciar();
    }

    function reiniciar() {
        parar();
        ord.passos = E.passosOrdenacao(ord.alg, ord.valores);
        ord.idx = 0;
        barras.forEach((b, k) => { b.className = 'barra'; b.style.transform = `translateX(${k * 100}%)`; });
        $('#ord-comp').textContent = '0';
        $('#ord-trocas').textContent = '0';
        $('#ord-pior').textContent = E.ALGORITMOS[ord.alg].pior;
        $('#ord-ideia').textContent = E.ALGORITMOS[ord.alg].ideia;
        $('#ord-msg').textContent = `Vetor com ${ord.valores.length} valores. Pronto para o ${E.ALGORITMOS[ord.alg].nome}.`;
        textoPlay.textContent = 'Reproduzir';
        botaoPasso.disabled = false;
    }

    function aplicar(p) {
        const valorEm = (pos) => ord.valores[p.ordem[pos]];
        p.ordem.forEach((id, k) => { barras[id].style.transform = `translateX(${k * 100}%)`; });
        const fixos = new Set(p.fixos);
        barras.forEach((b, id) => {
            b.classList.remove('comparando', 'trocando');
            b.classList.toggle('fixo', fixos.has(id));
        });
        if (p.tipo === 'comparar' || p.tipo === 'trocar') {
            const classe = p.tipo === 'comparar' ? 'comparando' : 'trocando';
            barras[p.ordem[p.i]].classList.add(classe);
            barras[p.ordem[p.j]].classList.add(classe);
        }
        $('#ord-comp').textContent = p.comparacoes;
        $('#ord-trocas').textContent = p.trocas;
        $('#ord-msg').textContent =
            p.tipo === 'comparar' ? `Compara ${valorEm(p.i)} com ${valorEm(p.j)}.` :
            p.tipo === 'trocar' ? `Troca: ${valorEm(p.i)} e ${valorEm(p.j)} mudam de lugar.` :
            `Ordenado com ${p.comparacoes} comparações e ${p.trocas} trocas.`;
    }

    function passo() {
        if (ord.idx >= ord.passos.length) return false;
        aplicar(ord.passos[ord.idx++]);
        if (ord.idx >= ord.passos.length) {
            parar();
            textoPlay.textContent = 'Reproduzir de novo';
            botaoPasso.disabled = true;
            return false;
        }
        return true;
    }

    function tocar() {
        if (ord.idx >= ord.passos.length) reiniciar();
        botaoPlay.setAttribute('aria-pressed', 'true');
        estadoOrd.setAttribute('aria-busy', 'true');
        textoPlay.textContent = 'Pausar';
        const ciclo = () => { if (passo()) ord.timer = setTimeout(ciclo, VELOCIDADES[$('#ord-vel').value][0]); };
        ciclo();
    }

    function parar() {
        clearTimeout(ord.timer); ord.timer = 0;
        botaoPlay.setAttribute('aria-pressed', 'false');
        estadoOrd.removeAttribute('aria-busy');
        if (ord.idx < ord.passos.length) textoPlay.textContent = ord.idx ? 'Continuar' : 'Reproduzir';
    }

    botaoPlay.addEventListener('click', () => (ord.timer ? parar() : tocar()));
    botaoPasso.addEventListener('click', () => { parar(); passo(); });
    $('#ord-novo').addEventListener('click', novoVetor);
    $('#ord-vel').addEventListener('input', (e) => { $('#ord-vel-saida').textContent = VELOCIDADES[e.target.value][1]; });
    abas($('.ordenacao .abas'), (b) => { ord.alg = b.dataset.alg; reiniciar(); });
    // Pausa quando o laboratório sai da tela: ninguém está olhando.
    new IntersectionObserver(([e]) => { if (!e.isIntersecting && ord.timer) parar(); }).observe(caixaBarras);
    novoVetor();

    /* ================= LABORATÓRIO: ÁRVORE BINÁRIA DE BUSCA ================= */
    const NS = 'http://www.w3.org/2000/svg';
    const MAX_NOS = 15; // acima disso os nós ficam pequenos demais na tela do celular
    const svgArv = $('#arv-svg'), gArestas = $('#arv-arestas'), gNos = $('#arv-nos');
    const campoArv = $('#arv-valor'), formArv = $('#arv-form'), estadoArv = $('#arv-estado');
    // Em telas estreitas o desenho usa uma largura lógica menor, para os nós não ficarem minúsculos.
    let L = 640, R = 20;
    const A = 340;
    function medirArvore() {
        const estreita = svgArv.clientWidth < 520;
        L = estreita ? 380 : 640; R = estreita ? 17 : 20;
        svgArv.setAttribute('viewBox', `0 0 ${L} ${A}`);
        svgArv.style.aspectRatio = `${L} / ${A}`;
        arv && arv.elementos.forEach((g) => g.querySelector('circle').setAttribute('r', R));
    }
    const arv = { raiz: E.bstDeValores([50, 30, 70, 20, 40, 60, 80]), pos: new Map(), elementos: new Map(), ocupado: false, quadro: 0 };
    medirArvore();
    let larguraAnterior = svgArv.clientWidth;
    addEventListener('resize', () => {
        if (Math.abs(svgArv.clientWidth - larguraAnterior) < 40) return;
        larguraAnterior = svgArv.clientWidth;
        medirArvore(); arv.pos = new Map(); desenharArvore();
    });

    function coordenadas(layout) {
        const passo = (L - 2 * R - 16) / Math.max(layout.total, 1);
        return new Map(layout.nos.map((n) => [n.id, { x: R + 8 + (n.x + 0.5) * passo, y: 40 + n.nivel * 66 }]));
    }

    function elementoNo(id, valor) {
        const g = document.createElementNS(NS, 'g');
        g.setAttribute('class', 'arv-no');
        const c = document.createElementNS(NS, 'circle');
        c.setAttribute('r', R);
        const t = document.createElementNS(NS, 'text');
        t.textContent = valor;
        g.append(c, t);
        g.dataset.id = id;
        return g;
    }

    function desenharArvore(novoId) {
        const layout = E.bstLayout(arv.raiz);
        const alvo = coordenadas(layout);
        const de = arv.pos;
        const raizId = arv.raiz ? arv.raiz.id : null;

        // entra quem é novo, sai quem não está mais na árvore
        arv.elementos.forEach((g, id) => { if (!alvo.has(id)) { g.remove(); arv.elementos.delete(id); } });
        layout.nos.forEach((n) => {
            if (!arv.elementos.has(n.id)) { const g = elementoNo(n.id, n.valor); gNos.append(g); arv.elementos.set(n.id, g); }
            const g = arv.elementos.get(n.id);
            g.classList.toggle('raiz', n.id === raizId);
            g.classList.toggle('novo', n.id === novoId);
            g.setAttribute('aria-label', `nó ${n.valor}`);
        });
        gArestas.replaceChildren(...layout.arestas.map((a) => {
            const l = document.createElementNS(NS, 'line');
            l.setAttribute('class', 'arv-aresta');
            l.dataset.para = a.para;
            l.dataset.de = a.de;
            return l;
        }));
        $('.arv-vazia', svgArv)?.remove();
        if (!layout.total) {
            const t = document.createElementNS(NS, 'text');
            t.setAttribute('class', 'arv-vazia'); t.setAttribute('x', L / 2); t.setAttribute('y', A / 2);
            t.textContent = 'árvore vazia · raiz = NULL';
            svgArv.append(t);
        }

        // interpola as posições antigas até as novas (nós e arestas juntos)
        cancelAnimationFrame(arv.quadro);
        const inicio = performance.now(), dur = reduzir.matches ? 0 : 520;
        const ease = (t) => 1 - Math.pow(1 - t, 4);
        const quadro = (agora) => {
            const k = dur ? ease(limitar((agora - inicio) / dur)) : 1;
            const atual = new Map();
            alvo.forEach((p, id) => {
                const o = de.get(id) || p;
                atual.set(id, { x: o.x + (p.x - o.x) * k, y: o.y + (p.y - o.y) * k });
            });
            atual.forEach((p, id) => arv.elementos.get(id).setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`));
            $$('line', gArestas).forEach((l) => {
                const a = atual.get(Number(l.dataset.de)), b = atual.get(Number(l.dataset.para));
                l.setAttribute('x1', a.x); l.setAttribute('y1', a.y); l.setAttribute('x2', b.x); l.setAttribute('y2', b.y);
            });
            if (k < 1) arv.quadro = requestAnimationFrame(quadro);
        };
        quadro(inicio);
        arv.pos = alvo;
        $('#arv-total').textContent = layout.total;
        $('#arv-altura').textContent = layout.altura;
        svgArv.querySelector('desc').textContent = layout.total
            ? `Árvore com ${layout.total} nós e altura ${layout.altura}. Em ordem: ${E.bstPercurso(arv.raiz, 'em').map((n) => n.valor).join(', ')}.`
            : 'Árvore vazia.';
    }

    const limparMarcas = () => {
        arv.elementos.forEach((g) => g.classList.remove('visitado', 'achado'));
        $$('line', gArestas).forEach((l) => l.classList.remove('caminho'));
    };
    const marcar = (id, classe = 'visitado') => {
        arv.elementos.get(id)?.classList.add(classe);
        $(`line[data-para="${id}"]`, gArestas)?.classList.add('caminho');
    };

    function travarArv(sim) {
        arv.ocupado = sim;
        $$('button', formArv).forEach((b) => (b.disabled = sim));
        sim ? estadoArv.setAttribute('aria-busy', 'true') : estadoArv.removeAttribute('aria-busy');
    }

    const NOMES_PERCURSO = { pre: 'Pré-ordem (raiz, esquerda, direita)', em: 'Em ordem (esquerda, raiz, direita)', pos: 'Pós-ordem (esquerda, direita, raiz)' };

    async function operarArvore(op) {
        if (arv.ocupado) return;
        const seq = $('#arv-seq'), msg = $('#arv-msg');
        limparMarcas();
        seq.replaceChildren();

        if (op === 'nova' || op === 'limpar') {
            if (op === 'limpar') arv.raiz = null;
            else {
                const vals = E.embaralhado(9).slice(0, 8);
                arv.raiz = E.bstDeValores(vals);
            }
            desenharArvore();
            msg.textContent = op === 'limpar' ? 'Árvore vazia. O primeiro valor inserido vira a raiz.' : 'Árvore nova com valores aleatórios. A raiz está em coral.';
            return;
        }

        if (op in NOMES_PERCURSO) {
            if (!arv.raiz) { msg.textContent = 'Árvore vazia: não há o que percorrer.'; return; }
            travarArv(true);
            msg.textContent = NOMES_PERCURSO[op] + '…';
            for (const n of E.bstPercurso(arv.raiz, op)) {
                marcar(n.id);
                const s = document.createElement('span'); s.textContent = n.valor; seq.append(s);
                await esperar(380);
            }
            msg.textContent = `${NOMES_PERCURSO[op]}: ${[...seq.children].map((s) => s.textContent).join(' → ')}`;
            await esperar(900);
            limparMarcas();
            travarArv(false);
            return;
        }

        const valor = E.lerValor(campoArv.value);
        if (valor === null || Number.isNaN(valor)) {
            campoArv.classList.remove('invalido'); void campoArv.offsetWidth; campoArv.classList.add('invalido');
            msg.textContent = 'Digite um número inteiro de 0 a 99.';
            campoArv.focus();
            return;
        }
        if (op === 'inserir' && E.bstLayout(arv.raiz).total >= MAX_NOS) {
            msg.textContent = `O laboratório comporta até ${MAX_NOS} nós. Use “Árvore nova” ou “Esvaziar”.`;
            return;
        }

        travarArv(true);
        const r = op === 'inserir' ? E.bstInserir(arv.raiz, valor) : E.bstBuscar(arv.raiz, valor);
        for (const id of r.caminho) {
            marcar(id);
            const no = E.bstLayout(arv.raiz).nos.find((n) => n.id === id);
            const s = document.createElement('span');
            s.textContent = no.valor === valor ? `${no.valor} ✓` : `${valor} ${valor < no.valor ? '<' : '>'} ${no.valor}`;
            seq.append(s);
            await esperar(420);
        }
        if (r.achou) marcar(r.achou, 'achado');
        if (op === 'inserir' && r.ok) {
            arv.raiz = r.estado;
            desenharArvore(r.entrou);
            campoArv.value = '';
        }
        msg.textContent = r.msg;
        await esperar(r.achou ? 1200 : 700);
        limparMarcas();
        travarArv(false);
    }

    formArv.addEventListener('submit', (e) => { e.preventDefault(); operarArvore('inserir'); });
    formArv.addEventListener('click', (e) => {
        const b = e.target.closest('button[type="button"]');
        if (b) operarArvore(b.dataset.op);
    });
    campoArv.addEventListener('input', () => campoArv.classList.remove('invalido'));
    desenharArvore();
})();
