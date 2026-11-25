/**
 * ABERTURA 3D: uma árvore binária de busca crescendo no "heap".
 * Cada valor inserido desce da raiz comparando com os nós (um cursor luminoso
 * percorre o caminho) até virar folha. O aluno gira a cena e insere valores.
 * A estrutura vem de logica.js (Estruturas.bstInserir / bstLayout), já testada.
 * Sem WebGL ou se o Three.js não carregar, desenha a mesma árvore em SVG.
 */
const E = window.Estruturas;
const raiz = document.documentElement;
const cena3d = document.getElementById('cena3d');
const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;
const logEl = document.getElementById('heap-log');
const anuncio = document.getElementById('heap-anuncio');
const form = document.getElementById('heap-form');
const campo = document.getElementById('heap-valor');
const MAX_NOS = 15;
const DEMO = [50, 30, 70, 20, 40, 60, 80, 35, 65, 90];

const estado = { arv: null, fila: [], ocupado: false };
const esperar = (ms) => new Promise((r) => setTimeout(r, reduzir ? 0 : ms));

function registrar(html, classe = '') {
    const li = document.createElement('li');
    li.innerHTML = html;
    if (classe) li.className = classe;
    logEl.append(li);
    while (logEl.children.length > 4) logEl.firstElementChild.remove();
}
function atualizarContagem() {
    const lay = E.bstLayout(estado.arv);
    document.getElementById('heap-n').textContent = lay.total;
    document.getElementById('heap-h').textContent = lay.altura;
}

/* Desenho (3D ou SVG) fica atrás desta interface mínima */
let desenho = null;

async function inserir(valor) {
    if (E.bstLayout(estado.arv).total >= MAX_NOS) {
        registrar(`heap cheio: ${MAX_NOS} nós. Use <b>nova árvore</b>.`, 'erro');
        return;
    }
    const r = E.bstInserir(estado.arv, valor);
    const comparacoes = r.caminho.map((id) => E.bstLayout(estado.arv).nos.find((n) => n.id === id).valor);
    registrar(`<b>inserir(${valor})</b>`);
    // o cursor desce pelo caminho, um nó por vez
    for (let i = 0; i < r.caminho.length; i++) {
        desenho.visitar(r.caminho[i]);
        const v = comparacoes[i];
        if (v !== valor) {
            registrar(`${valor} ${valor < v ? '&lt;' : '&gt;'} ${v} → ${valor < v ? 'esquerda' : 'direita'}`, 'passo');
        }
        await esperar(420);
    }
    if (!r.ok) {
        registrar(r.msg.replace(/^.*?: /, ''), 'erro');
        anuncio.textContent = r.msg;
        desenho.visitar(null);
        return;
    }
    estado.arv = r.estado;
    desenho.atualizar(estado.arv, r.entrou);
    registrar(r.caminho.length ? `vira folha no nível ${r.caminho.length}` : 'árvore vazia: vira a raiz', 'ok');
    anuncio.textContent = r.msg;
    atualizarContagem();
    await esperar(260);
}

async function processarFila() {
    if (estado.ocupado) return;
    estado.ocupado = true;
    while (estado.fila.length) await inserir(estado.fila.shift());
    estado.ocupado = false;
}
function enfileirar(...valores) { estado.fila.push(...valores); processarFila(); }

function novaArvore() {
    estado.fila = [];
    estado.arv = null;
    logEl.replaceChildren();
    desenho.atualizar(null);
    atualizarContagem();
    const vals = E.embaralhado(12).slice(0, 8);
    // começa pelo valor do meio para a árvore nascer equilibrada
    vals.sort((x, y) => Math.abs(x - 50) - Math.abs(y - 50));
    enfileirar(...vals);
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = E.lerValor(campo.value);
    if (v === null || Number.isNaN(v)) {
        campo.classList.remove('invalido'); void campo.offsetWidth; campo.classList.add('invalido');
        registrar('digite um inteiro de 0 a 99', 'erro');
        return;
    }
    campo.value = '';
    enfileirar(v);
});
campo.addEventListener('input', () => campo.classList.remove('invalido'));
document.getElementById('heap-nova').addEventListener('click', novaArvore);

/* ===================================================================== */
/* 3D com Three.js                                                        */
/* ===================================================================== */
async function criar3D() {
    const teste = document.createElement('canvas');
    if (!(teste.getContext('webgl2') || teste.getContext('webgl'))) throw new Error('sem WebGL');
    const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');

    const COR = {
        no: 0x13243b, borda: 0x35d0c0, raiz: 0xff6a45, visita: 0xc9f06b,
        aresta: 0x3a5478, texto: '#e6edf7', grade: 0x1f2d45,
    };

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    cena3d.append(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a1220, 16, 34);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

    scene.add(new THREE.HemisphereLight(0xbfe8ff, 0x0a1220, 1.1));
    const sol = new THREE.DirectionalLight(0xffffff, 1.4);
    sol.position.set(4, 8, 6);
    scene.add(sol);

    // chão de "memória": grade de células com endereços implícitos
    const grade = new THREE.GridHelper(40, 40, COR.grade, COR.grade);
    grade.position.y = -5.2;
    grade.material.transparent = true;
    grade.material.opacity = 0.55;
    scene.add(grade);

    const mundo = new THREE.Group();
    scene.add(mundo);

    // cursor que percorre o caminho da inserção
    const cursor = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 20, 20),
        new THREE.MeshBasicMaterial({ color: COR.visita }),
    );
    const luzCursor = new THREE.PointLight(COR.visita, 6, 4);
    cursor.add(luzCursor);
    cursor.visible = false;
    mundo.add(cursor);

    const geoNo = new THREE.SphereGeometry(0.4, 32, 24);
    const geoAnel = new THREE.TorusGeometry(0.5, 0.032, 10, 48);
    const geoHaste = new THREE.CylinderGeometry(0.03, 0.03, 1, 8, 1, true);
    const geoPonta = new THREE.ConeGeometry(0.09, 0.24, 14);
    const nos = new Map();      // id → { grupo, alvo, mat, anel, valor, endereco }
    const arestas = [];         // { haste, ponta, de, para }

    function etiqueta(texto) {
        const c = document.createElement('canvas');
        c.width = c.height = 128;
        const g = c.getContext('2d');
        g.font = '600 56px "JetBrains Mono", ui-monospace, monospace';
        g.fillStyle = COR.texto;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(texto, 64, 68);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
        sp.scale.set(0.82, 0.82, 1);
        sp.renderOrder = 2;
        return sp;
    }

    function criarNo(n) {
        const grupo = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: COR.no, emissive: COR.borda, emissiveIntensity: 0.08, roughness: 0.35, metalness: 0.2 });
        const esfera = new THREE.Mesh(geoNo, mat);
        esfera.userData.id = n.id;
        const anel = new THREE.Mesh(geoAnel, new THREE.MeshBasicMaterial({ color: COR.borda }));
        grupo.add(esfera, anel, etiqueta(String(n.valor)));
        grupo.scale.setScalar(0.001);
        mundo.add(grupo);
        return { grupo, esfera, anel, mat, alvo: new THREE.Vector3(), escala: 1, valor: n.valor, brilho: 0 };
    }

    // posições: x pela ordem simétrica, y pela profundidade e z abrindo os ramos em leque
    function posicoes(arv) {
        const lay = E.bstLayout(arv);
        const pais = new Map(lay.arestas.map((a) => [a.para, a.de]));
        const porId = new Map(lay.nos.map((n) => [n.id, n]));
        // a largura total da árvore fica em ~7,6 unidades, cresça quanto crescer
        const passoX = Math.min(1.25, 7.6 / Math.max(lay.total - 1, 1));
        const z = new Map();
        const ordem = [...lay.nos].sort((p, q) => p.nivel - q.nivel);
        for (const n of ordem) {
            const pai = pais.get(n.id);
            if (pai === undefined) { z.set(n.id, 0); continue; }
            const ladoEsq = n.x < porId.get(pai).x;
            z.set(n.id, z.get(pai) + (ladoEsq ? -1 : 1) * 0.75 / n.nivel);
        }
        return {
            lay, pais,
            pos: new Map(lay.nos.map((n) => [n.id, new THREE.Vector3(
                (n.x - (lay.total - 1) / 2) * passoX,
                3.3 - n.nivel * 1.55,
                z.get(n.id),
            )])),
        };
    }

    let escalaAlvo = 1;
    function atualizar(arv, novoId) {
        const { lay, pais, pos } = posicoes(arv);
        // árvore funda encolhe para continuar inteira na tela (até 4 níveis cabem sem reduzir)
        escalaAlvo = Math.min(1, 4.65 / Math.max((lay.altura - 1) * 1.55, 0.01));
        const vivos = new Set(lay.nos.map((n) => n.id));
        nos.forEach((no, id) => { if (!vivos.has(id)) { mundo.remove(no.grupo); nos.delete(id); } });
        const raizId = arv ? arv.id : null;
        lay.nos.forEach((n) => {
            if (!nos.has(n.id)) {
                const no = criarNo(n);
                // nasce na posição do pai (ou no alto) e desce até o lugar
                const p = pais.get(n.id);
                no.grupo.position.copy(p !== undefined && nos.has(p) ? nos.get(p).grupo.position : new THREE.Vector3(0, 6, 0));
                if (reduzir) { no.grupo.position.copy(pos.get(n.id)); no.grupo.scale.setScalar(1); }
                nos.set(n.id, no);
            }
            const no = nos.get(n.id);
            no.alvo.copy(pos.get(n.id));
            const ehRaiz = n.id === raizId;
            no.anel.material.color.setHex(ehRaiz ? COR.raiz : COR.borda);
            no.mat.emissive.setHex(ehRaiz ? COR.raiz : COR.borda);
            if (n.id === novoId) no.brilho = 1;
        });
        arestas.forEach((a) => { mundo.remove(a.haste); mundo.remove(a.ponta); });
        arestas.length = 0;
        lay.arestas.forEach(({ de, para }) => {
            const mat = new THREE.MeshBasicMaterial({ color: COR.aresta });
            const haste = new THREE.Mesh(geoHaste, mat);
            const ponta = new THREE.Mesh(geoPonta, new THREE.MeshBasicMaterial({ color: COR.raiz }));
            mundo.add(haste, ponta);
            arestas.push({ haste, ponta, de, para });
        });
        cena3d.setAttribute('aria-label', lay.total
            ? `Árvore binária de busca em 3D com ${lay.total} nós e altura ${lay.altura}. Em ordem: ${E.bstPercurso(arv, 'em').map((n) => n.valor).join(', ')}.`
            : 'Árvore binária de busca vazia.');
    }

    let visitado = null;
    function visitar(id) {
        visitado = id;
        if (id === null) { cursor.visible = false; return; }
        const no = nos.get(id);
        if (!no) return;
        if (!cursor.visible) cursor.position.copy(no.grupo.position).add(new THREE.Vector3(0, 1.2, 0));
        cursor.visible = true;
        no.brilho = Math.max(no.brilho, 0.7);
    }

    // ----- interação: arrastar gira, ponteiro inclina, passar o ponteiro mostra o nó -----
    const giro = { yaw: -0.35, pitch: 0.12, alvoYaw: -0.35, alvoPitch: 0.12, arrastando: false, x: 0, y: 0, ultimo: performance.now() };
    const dica = document.createElement('div');
    dica.className = 'heap-dica';
    dica.hidden = true;
    cena3d.append(dica);
    const ray = new THREE.Raycaster();
    const ponteiro = new THREE.Vector2();

    renderer.domElement.addEventListener('pointerdown', (e) => {
        giro.arrastando = true; giro.x = e.clientX; giro.y = e.clientY; giro.ultimo = performance.now();
        renderer.domElement.setPointerCapture(e.pointerId);
    });
    renderer.domElement.addEventListener('pointerup', () => { giro.arrastando = false; giro.ultimo = performance.now(); });
    renderer.domElement.addEventListener('pointermove', (e) => {
        const r = renderer.domElement.getBoundingClientRect();
        ponteiro.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        if (giro.arrastando) {
            giro.alvoYaw += (e.clientX - giro.x) * 0.008;
            giro.alvoPitch = Math.max(-0.3, Math.min(0.6, giro.alvoPitch + (e.clientY - giro.y) * 0.005));
            giro.x = e.clientX; giro.y = e.clientY; giro.ultimo = performance.now();
        }
        ray.setFromCamera(ponteiro, camera);
        const hit = ray.intersectObjects([...nos.values()].map((n) => n.esfera))[0];
        if (hit && !giro.arrastando) {
            const id = hit.object.userData.id;
            const lay = E.bstLayout(estado.arv);
            const filhos = lay.arestas.filter((a) => a.de === id).map((a) => nos.get(a.para));
            const no = nos.get(id);
            const esq = filhos.find((f) => f && f.valor < no.valor);
            const dir = filhos.find((f) => f && f.valor > no.valor);
            dica.innerHTML = `<b>nó ${no.valor}</b><span>${E.enderecoDe(id)}</span><span>esq → ${esq ? esq.valor : 'NULL'}</span><span>dir → ${dir ? dir.valor : 'NULL'}</span>`;
            dica.style.left = `${e.clientX - r.left + 14}px`;
            dica.style.top = `${e.clientY - r.top + 14}px`;
            dica.hidden = false;
            renderer.domElement.style.cursor = 'pointer';
        } else {
            dica.hidden = true;
            renderer.domElement.style.cursor = giro.arrastando ? 'grabbing' : 'grab';
        }
    });
    renderer.domElement.addEventListener('pointerleave', () => { dica.hidden = true; });

    // ----- tamanho -----
    function medir() {
        const w = cena3d.clientWidth, h = cena3d.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        // em tela estreita afasta a câmera para a árvore caber
        // telas largas: árvore à direita do texto; estreitas: a distância é a que faz caber ~9 x 8,5 unidades
        const meiaAltura = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        const dist = camera.aspect > 1.35 ? 14.5 : Math.max(9 / (2 * meiaAltura * camera.aspect), 8.5 / (2 * meiaAltura));
        camera.position.set(0, 2.2, dist);
        camera.lookAt(0, 0.5, 0);
        // no desktop a árvore fica à direita do texto
        mundo.position.x = camera.aspect > 1.35 ? 3.3 : 0;
        camera.updateProjectionMatrix();
    }
    new ResizeObserver(medir).observe(cena3d);
    medir();

    // ----- laço único, pausado fora da tela -----
    let visivel = true, quadro = 0, t0 = performance.now();
    new IntersectionObserver(([e]) => {
        visivel = e.isIntersecting;
        if (visivel && !quadro) quadro = requestAnimationFrame(laco);
    }).observe(cena3d);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && visivel && !quadro) quadro = requestAnimationFrame(laco); });

    const tmp = new THREE.Vector3(), eixo = new THREE.Vector3(0, 1, 0), dirV = new THREE.Vector3();
    function laco(agora) {
        quadro = 0;
        if (!visivel || document.hidden) return;
        const t = (agora - t0) / 1000;
        // parada, a árvore oscila perto da vista de frente (de costas, esquerda e direita se inverteriam)
        if (!giro.arrastando && agora - giro.ultimo > 3000) {
            const base = reduzir ? -0.3 : -0.3 + Math.sin(t * 0.22) * 0.42;
            giro.alvoYaw += (base - giro.alvoYaw) * 0.02;
            giro.alvoPitch += (0.12 - giro.alvoPitch) * 0.02;
        }
        giro.yaw += (giro.alvoYaw - giro.yaw) * 0.08;
        giro.pitch += (giro.alvoPitch - giro.pitch) * 0.08;
        mundo.rotation.set(giro.pitch, giro.yaw, 0);
        mundo.scale.setScalar(mundo.scale.x + (escalaAlvo - mundo.scale.x) * (reduzir ? 1 : 0.06));
        // ao encolher, a raiz sobe para o topo continuar no mesmo lugar
        mundo.position.y = 3.3 * (1 - mundo.scale.x);

        nos.forEach((no) => {
            no.grupo.position.lerp(no.alvo, reduzir ? 1 : 0.09);
            const s = no.grupo.scale.x + (1 - no.grupo.scale.x) * (reduzir ? 1 : 0.12);
            no.grupo.scale.setScalar(s);
            no.brilho *= 0.95;
            no.mat.emissiveIntensity = 0.08 + no.brilho * 0.9;
            no.anel.lookAt(camera.position);
            if (!reduzir) no.grupo.position.y += Math.sin(t * 1.3 + no.valor) * 0.0025;
        });
        arestas.forEach(({ haste, ponta, de, para }) => {
            const a = nos.get(de), b = nos.get(para);
            if (!a || !b) return;
            const pa = a.grupo.position, pb = b.grupo.position;
            dirV.subVectors(pb, pa);
            const comp = dirV.length();
            haste.position.copy(pa).addScaledVector(dirV, 0.5);
            haste.scale.set(1, Math.max(comp - 1, 0.01), 1);
            haste.quaternion.setFromUnitVectors(eixo, tmp.copy(dirV).normalize());
            // a ponta (o ponteiro) fica perto do filho: o pai "aponta" para ele
            ponta.position.copy(pb).addScaledVector(tmp, -0.68);
            ponta.quaternion.copy(haste.quaternion);
        });
        if (cursor.visible && visitado !== null && nos.has(visitado)) {
            cursor.position.lerp(tmp.copy(nos.get(visitado).grupo.position).add(eixo.clone().multiplyScalar(0.78)), reduzir ? 1 : 0.2);
            luzCursor.intensity = 5 + Math.sin(t * 12) * 2;
        }
        renderer.render(scene, camera);
        quadro = requestAnimationFrame(laco);
    }
    quadro = requestAnimationFrame(laco);
    return { atualizar, visitar };
}

/* ===================================================================== */
/* Plano B: a mesma árvore em SVG                                         */
/* ===================================================================== */
function criarSVG() {
    cena3d.classList.add('sem-3d');
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 600 380');
    cena3d.append(svg);
    let ultimo = null;
    function atualizar(arv, novoId) {
        const lay = E.bstLayout(arv);
        const passo = 560 / Math.max(lay.total, 1);
        const p = new Map(lay.nos.map((n) => [n.id, { x: 20 + (n.x + 0.5) * passo, y: 50 + n.nivel * 70 }]));
        svg.innerHTML = lay.arestas.map(({ de, para }) => `<line x1="${p.get(de).x}" y1="${p.get(de).y}" x2="${p.get(para).x}" y2="${p.get(para).y}" />`).join('')
            + lay.nos.map((n) => `<g class="${n.id === (arv && arv.id) ? 'raiz' : ''}${n.id === novoId ? ' novo' : ''}" data-id="${n.id}"><circle cx="${p.get(n.id).x}" cy="${p.get(n.id).y}" r="20" /><text x="${p.get(n.id).x}" y="${p.get(n.id).y}">${n.valor}</text></g>`).join('');
    }
    function visitar(id) {
        if (ultimo) ultimo.classList.remove('visitado');
        ultimo = id === null ? null : svg.querySelector(`g[data-id="${id}"]`);
        if (ultimo) ultimo.classList.add('visitado');
    }
    return { atualizar, visitar };
}

/* ===================================================================== */
async function iniciar() {
    try {
        desenho = await criar3D();
        cena3d.classList.add('com-3d');
    } catch (erro) {
        desenho = criarSVG();
    }
    atualizarContagem();
    // espera a cortina de abertura antes de começar a construir
    await esperar(raiz.hasAttribute('data-visitado') ? 500 : 1700);
    enfileirar(...DEMO);
}
iniciar();
