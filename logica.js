/**
 * LÓGICA PURA DO PORTAL (sem DOM)
 * Estruturas lineares (pilha, fila, lista ligada) e passos dos algoritmos de ordenação.
 * Fica separada da interface para poder ser testada com `node --test testes/`.
 * Todas as operações são imutáveis: recebem um estado e devolvem um estado novo,
 * o que deixa a interface livre para animar a diferença entre os dois.
 */
(function (raiz, fabrica) {
    const api = fabrica();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else raiz.Estruturas = api;
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /** Capacidade das estruturas do visualizador (cabe numa tela de celular). */
    const CAPACIDADE = 6;

    let proximoId = 1;
    /** Cada nó ganha um id estável para a interface saber quem entrou e quem saiu. */
    function novoNo(valor) {
        return { id: proximoId++, valor, endereco: enderecoDe(proximoId) };
    }

    /** Endereço de memória ilustrativo, só para a visualização (ex.: 0x1A40). */
    function enderecoDe(n) {
        return '0x' + (0x1a00 + n * 0x20).toString(16).toUpperCase();
    }

    /**
     * Lê o valor digitado pelo aluno: inteiro de 0 a 99.
     * Retorna null para campo vazio e NaN para texto inválido.
     */
    function lerValor(texto) {
        const t = String(texto ?? '').trim();
        if (t === '') return null;
        if (!/^-?\d+$/.test(t)) return NaN;
        const n = Number(t);
        return n >= 0 && n <= 99 ? n : NaN;
    }

    function resultado(estado, ok, msg, complexidade, extra = {}) {
        return { estado, ok, msg, complexidade, ...extra };
    }

    /* ---------- PILHA (LIFO): o topo é o último elemento do array ---------- */
    function empilhar(pilha, valor) {
        if (pilha.length >= CAPACIDADE) {
            return resultado(pilha, false, `Estouro de pilha: a capacidade é ${CAPACIDADE}. Desempilhe antes de empilhar ${valor}.`, 'O(1)');
        }
        const no = novoNo(valor);
        return resultado([...pilha, no], true, `push(${valor}): ${valor} entrou no topo.`, 'O(1)', { entrou: no.id });
    }

    function desempilhar(pilha) {
        if (pilha.length === 0) return resultado(pilha, false, 'Pilha vazia: não há o que desempilhar (underflow).', 'O(1)');
        const topo = pilha[pilha.length - 1];
        return resultado(pilha.slice(0, -1), true, `pop() devolveu ${topo.valor}: sempre sai quem entrou por último.`, 'O(1)', { saiu: topo.id });
    }

    /* ---------- FILA (FIFO): início no índice 0, fim no último ---------- */
    function enfileirar(fila, valor) {
        if (fila.length >= CAPACIDADE) {
            return resultado(fila, false, `Fila cheia: a capacidade é ${CAPACIDADE}. Atenda alguém antes de enfileirar ${valor}.`, 'O(1)');
        }
        const no = novoNo(valor);
        return resultado([...fila, no], true, `enqueue(${valor}): ${valor} entrou no fim da fila.`, 'O(1)', { entrou: no.id });
    }

    function desenfileirar(fila) {
        if (fila.length === 0) return resultado(fila, false, 'Fila vazia: ninguém para atender.', 'O(1)');
        const primeiro = fila[0];
        return resultado(fila.slice(1), true, `dequeue() devolveu ${primeiro.valor}: sai sempre quem chegou primeiro.`, 'O(1)', { saiu: primeiro.id });
    }

    /* ---------- LISTA SIMPLESMENTE LIGADA: cabeça no índice 0 ---------- */
    function inserirInicio(lista, valor) {
        if (lista.length >= CAPACIDADE) return resultado(lista, false, `Lista cheia no visualizador (máx. ${CAPACIDADE} nós).`, 'O(1)');
        const no = novoNo(valor);
        return resultado([no, ...lista], true, `Novo nó ${valor} aponta para a antiga cabeça e vira a nova cabeça.`, 'O(1)', { entrou: no.id });
    }

    function inserirFim(lista, valor) {
        if (lista.length >= CAPACIDADE) return resultado(lista, false, `Lista cheia no visualizador (máx. ${CAPACIDADE} nós).`, 'O(n)');
        const no = novoNo(valor);
        const visitados = lista.map((n) => n.id);
        return resultado([...lista, no], true,
            `Percorremos ${lista.length} nó(s) até o último e ligamos ${valor} no fim.`, 'O(n)', { entrou: no.id, visitados });
    }

    function removerInicio(lista) {
        if (lista.length === 0) return resultado(lista, false, 'Lista vazia: a cabeça aponta para NULL.', 'O(1)');
        const cabeca = lista[0];
        return resultado(lista.slice(1), true, `Removemos ${cabeca.valor}: a cabeça passa a apontar para o próximo nó.`, 'O(1)', { saiu: cabeca.id });
    }

    function buscar(lista, valor) {
        const visitados = [];
        for (const no of lista) {
            visitados.push(no.id);
            if (no.valor === valor) {
                return resultado(lista, true, `Encontrado ${valor} depois de visitar ${visitados.length} nó(s).`, 'O(n)', { visitados, achou: no.id });
            }
        }
        return resultado(lista, false, `${valor} não está na lista: visitamos ${visitados.length} nó(s) até chegar em NULL.`, 'O(n)', { visitados });
    }

    /** Ponto único de entrada usado pela interface. */
    const OPERACOES = {
        pilha: { inserir: empilhar, remover: desempilhar },
        fila: { inserir: enfileirar, remover: desenfileirar },
        lista: { inserir: inserirFim, inserirInicio, remover: removerInicio, buscar },
    };

    function operar(tipo, op, estado, valor) {
        const f = OPERACOES[tipo] && OPERACOES[tipo][op];
        if (!f) throw new Error(`Operação desconhecida: ${tipo}.${op}`);
        return f(estado, valor);
    }

    function aPartirDe(valores) {
        return valores.map(novoNo);
    }

    /* ---------- ORDENAÇÃO PASSO A PASSO ----------
     * Cada passo traz a ordem atual como uma lista de índices originais (ids),
     * assim a interface move as barras certas em vez de redesenhar tudo.
     */
    function passosOrdenacao(algoritmo, valores) {
        const v = valores.map((valor, id) => ({ id, valor }));
        const passos = [];
        let comparacoes = 0, trocas = 0;
        const fixos = new Set();
        const registrar = (tipo, i, j) => passos.push({
            tipo, i, j, comparacoes, trocas,
            ordem: v.map((x) => x.id), fixos: [...fixos],
        });
        const comparar = (i, j) => { comparacoes++; registrar('comparar', i, j); return v[i].valor > v[j].valor; };
        const trocar = (i, j) => { [v[i], v[j]] = [v[j], v[i]]; trocas++; registrar('trocar', i, j); };
        const n = v.length;

        if (algoritmo === 'bolha') {
            for (let fim = n - 1; fim > 0; fim--) {
                let trocou = false;
                for (let i = 0; i < fim; i++) {
                    if (comparar(i, i + 1)) { trocar(i, i + 1); trocou = true; }
                }
                fixos.add(v[fim].id);
                if (!trocou) break; // já ordenado: a bolha para cedo
            }
        } else if (algoritmo === 'selecao') {
            for (let i = 0; i < n - 1; i++) {
                let menor = i;
                for (let j = i + 1; j < n; j++) {
                    if (comparar(menor, j)) menor = j;
                }
                if (menor !== i) trocar(i, menor);
                fixos.add(v[i].id);
            }
        } else if (algoritmo === 'insercao') {
            for (let i = 1; i < n; i++) {
                let j = i;
                while (j > 0 && comparar(j - 1, j)) { trocar(j - 1, j); j--; }
            }
        } else {
            throw new Error(`Algoritmo desconhecido: ${algoritmo}`);
        }

        v.forEach((x) => fixos.add(x.id));
        registrar('fim', -1, -1);
        return passos;
    }

    const ALGORITMOS = {
        bolha: { nome: 'Bolha', melhor: 'O(n)', medio: 'O(n²)', pior: 'O(n²)', ideia: 'Compara vizinhos e troca os que estão fora de ordem; o maior “sobe” para o fim a cada volta.' },
        selecao: { nome: 'Seleção', melhor: 'O(n²)', medio: 'O(n²)', pior: 'O(n²)', ideia: 'Procura o menor elemento da parte não ordenada e o coloca na próxima posição.' },
        insercao: { nome: 'Inserção', melhor: 'O(n)', medio: 'O(n²)', pior: 'O(n²)', ideia: 'Pega o próximo elemento e o desliza para a esquerda até encontrar seu lugar, como cartas na mão.' },
    };

    /** Gerador pseudoaleatório com semente (mulberry32): testes reproduzíveis. */
    function aleatorio(semente) {
        let a = semente >>> 0;
        return function () {
            a = (a + 0x6d2b79f5) >>> 0;
            let t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    /** Vetor de n valores distintos entre 5 e 99, embaralhado (Fisher–Yates). */
    function embaralhado(n, rng = Math.random) {
        const passo = Math.floor(94 / n);
        const v = Array.from({ length: n }, (_, i) => 5 + i * passo + Math.floor(rng() * passo));
        for (let i = v.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [v[i], v[j]] = [v[j], v[i]];
        }
        return v;
    }

    /* ---------- ÁRVORE BINÁRIA DE BUSCA ----------
     * Nó: { id, valor, esq, dir }. Menores à esquerda, maiores à direita.
     * A altura é limitada para a árvore caber na tela do visualizador.
     */
    const ALTURA_MAX = 5;

    function bstInserir(raizArv, valor) {
        const caminho = [];
        function inserir(no) {
            if (!no) return { id: proximoId++, valor, esq: null, dir: null };
            caminho.push(no.id);
            if (valor === no.valor) throw Object.assign(new Error('duplicado'), { duplicado: true });
            return valor < no.valor ? { ...no, esq: inserir(no.esq) } : { ...no, dir: inserir(no.dir) };
        }
        try {
            const nova = inserir(raizArv);
            if (caminho.length + 1 > ALTURA_MAX) {
                return resultado(raizArv, false, `${valor} ficaria no nível ${caminho.length + 1}: o visualizador vai até ${ALTURA_MAX} níveis. Tente um valor que caia num galho mais curto.`, 'O(h)', { caminho });
            }
            const entrou = bstLayout(nova).nos.find((n) => n.valor === valor).id;
            const lado = caminho.length === 0 ? 'Árvore vazia: ' + valor + ' vira a raiz.' : `Descemos ${caminho.length} nível(is) comparando e ${valor} virou folha.`;
            return resultado(nova, true, `inserir(${valor}): ${lado}`, 'O(h)', { caminho, entrou });
        } catch (e) {
            if (!e.duplicado) throw e;
            return resultado(raizArv, false, `${valor} já está na árvore: numa árvore de busca cada chave aparece uma vez.`, 'O(h)', { caminho });
        }
    }

    function bstBuscar(raizArv, valor) {
        const caminho = [];
        let no = raizArv;
        while (no) {
            caminho.push(no.id);
            if (valor === no.valor) return resultado(raizArv, true, `Encontrado ${valor} com ${caminho.length} comparação(ões).`, 'O(h)', { caminho, achou: no.id });
            no = valor < no.valor ? no.esq : no.dir;
        }
        return resultado(raizArv, false, `${valor} não está na árvore: chegamos a um ponteiro NULL depois de ${caminho.length} comparação(ões).`, 'O(h)', { caminho });
    }

    /** Percursos clássicos: devolvem os nós na ordem em que são visitados. */
    function bstPercurso(raizArv, tipo) {
        const saida = [];
        (function visitar(no) {
            if (!no) return;
            if (tipo === 'pre') saida.push(no);
            visitar(no.esq);
            if (tipo === 'em') saida.push(no);
            visitar(no.dir);
            if (tipo === 'pos') saida.push(no);
        })(raizArv);
        if (!['pre', 'em', 'pos'].includes(tipo)) throw new Error(`Percurso desconhecido: ${tipo}`);
        return saida.map((n) => ({ id: n.id, valor: n.valor }));
    }

    /** Posições para desenhar: x pela ordem simétrica (sem sobreposição), y pela profundidade. */
    function bstLayout(raizArv) {
        const nos = [], arestas = [];
        let x = 0;
        (function visitar(no, nivel, pai) {
            if (!no) return;
            visitar(no.esq, nivel + 1, no.id);
            nos.push({ id: no.id, valor: no.valor, x: x++, nivel });
            if (pai !== null) arestas.push({ de: pai, para: no.id });
            visitar(no.dir, nivel + 1, no.id);
        })(raizArv, 0, null);
        const altura = nos.reduce((m, n) => Math.max(m, n.nivel + 1), 0);
        return { nos, arestas, altura, total: nos.length };
    }

    function bstDeValores(valores) {
        return valores.reduce((arv, v) => { const r = bstInserir(arv, v); return r.estado; }, null);
    }

    return {
        ALTURA_MAX, bstInserir, bstBuscar, bstPercurso, bstLayout, bstDeValores,
        CAPACIDADE, lerValor, operar, aPartirDe, enderecoDe,
        empilhar, desempilhar, enfileirar, desenfileirar,
        inserirInicio, inserirFim, removerInicio, buscar,
        passosOrdenacao, ALGORITMOS, aleatorio, embaralhado,
    };
});
