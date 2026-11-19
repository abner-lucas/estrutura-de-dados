import React from 'react';
import { Anim, IfLogo, Lab, MiniTree, Reveal } from './components';

export interface Slide {
  id: string;
  part: string;
  kind: 'cover' | 'divider' | 'content' | 'final';
  title?: string;
  body?: (go: (id: string) => void) => React.ReactNode;
  art?: string;
  num?: string;
  subtitle?: string;
}

const rv = (d: number) => ({ className: 'rv', style: { ['--d' as string]: `${d}s` } as React.CSSProperties });
const Link: React.FC<{ to: string; go: (id: string) => void; children: React.ReactNode }> = ({ to, go, children }) => (
  <button className="xlink" onClick={() => go(to)}>{children} →</button>
);
const Ext: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a className="xref" href={href} target="_blank" rel="noreferrer">↗ {children}</a>
);
const Two: React.FC<{ left: React.ReactNode; right: React.ReactNode; ratio?: string }> = ({ left, right, ratio = '0.9fr 1.6fr' }) => (
  <div className="two" style={{ gridTemplateColumns: ratio }}><div className="two-l">{left}</div><div className="two-r">{right}</div></div>
);

const P1 = 'Parte 1 · A Cartografia dos Dados';
const P2 = 'Parte 2 · Árvores';
const P3 = 'Parte 3 · Operações na ABB';
const P4 = 'Parte 4 · Desempenho';
const P5 = 'Parte 5 · Além das árvores';

export const SLIDES: Slide[] = [
  { id: 'capa', part: 'Abertura', kind: 'cover' },

  {
    id: 'roteiro', part: 'Abertura', kind: 'content', title: 'O roteiro da nossa jornada',
    body: (go) => (
      <div className="journey">
        {[
          ['01', 'A Cartografia dos Dados', 'Tempo, força bruta e o poder da ordem', 'p1'],
          ['02', 'Árvores', 'Nós, arestas, raiz, folhas e a regra de ouro', 'p2'],
          ['03', 'Operações na ABB', 'Busca, inserção, percursos e remoção', 'p3'],
          ['04', 'Desempenho', 'Big-O, degeneração e balanceamento', 'p4'],
          ['05', 'Além das árvores', 'Hash, colisões, BFS e DFS', 'p5'],
        ].map(([n, t, d, to], i) => (
          <button key={n} {...rv(0.1 + i * 0.12)} className="rv stop" onClick={() => go(to)}>
            <span className="stop-n">{n}</span>
            <span className="stop-t">{t}</span>
            <span className="stop-d">{d}</span>
          </button>
        ))}
        <svg className="journey-path" viewBox="0 0 1000 40" preserveAspectRatio="none"><path d="M0 20 Q250 -10 500 20 T1000 20" /></svg>
      </div>
    ),
  },

  // ---------------------------------------------------------------- PARTE 1
  { id: 'p1', part: P1, kind: 'divider', num: '01', title: 'A Cartografia dos Dados', subtitle: 'A evolução dos algoritmos de busca e a ciência da eficiência', art: 'arte-3' },
  {
    id: 'tempo', part: P1, kind: 'content', title: 'A moeda da computação é o tempo',
    body: () => <Two left={<>
      <p {...rv(0.1)}>Procurar um item entre 10 é trivial. Procurar entre <b>1 bilhão</b> exige uma arquitetura de decisão inteligente.</p>
      <p {...rv(0.25)} className="rv callout">A eficiência de uma busca <b>não depende da velocidade do processador</b>, mas da taxa de crescimento do algoritmo.</p>
      <p {...rv(0.4)}>Observe o contador de <b>n</b> subir até 1 milhão: O(n) explode, O(log n) quase não se mexe.</p>
    </>} right={<Anim id="growth" />} />,
  },
  {
    id: 'sequencial', part: P1, kind: 'content', title: 'Força bruta: busca sequencial',
    body: () => <Two left={<>
      <p {...rv(0.1)}><b>Cenário ideal:</b> dados não estruturados ou listas minúsculas.</p>
      <p {...rv(0.25)}><b>Complexidade:</b> <span className="tag-or">O(n)</span>. No pior caso, varre todos os <i>n</i> elementos.</p>
      <p {...rv(0.4)}>Média de comparações: <b>(n + 1) / 2</b>.</p>
    </>} right={<Anim id="sequential" />} />,
  },
  {
    id: 'binaria', part: P1, kind: 'content', title: 'O poder da ordem: busca binária',
    body: () => <Two left={<>
      <p {...rv(0.1)}>Com os dados <b>ordenados</b>, cada comparação corta o campo de busca pela metade.</p>
      <p {...rv(0.25)} className="rv callout">1.000 itens → ≈ 10 passos<br />1.000.000 itens → ≈ 20 passos</p>
      <p {...rv(0.4)}>Máximo de comparações despenca de <i>n</i> para ≈ <b>log₂ n</b>.</p>
    </>} right={<Anim id="binary" />} />,
  },
  {
    id: 'paradoxo', part: P1, kind: 'content', title: 'O paradoxo dinâmico',
    body: (go) => <Two left={<>
      <p {...rv(0.1)}>Busca binária: consultas em <b>O(log n)</b>. Mas, se os dados mudam com frequência, inserir num vetor ordenado exige deslocar os vizinhos: <span className="tag-rd">O(n)</span>.</p>
      <p {...rv(0.3)} className="rv callout"><b>Como manter o corte pela metade, mas com inserções rápidas?</b></p>
      <div {...rv(0.45)}><Link to="p2" go={go}>A resposta: árvores</Link></div>
    </>} right={<Anim id="shift" />} />,
  },

  // ---------------------------------------------------------------- PARTE 2
  { id: 'p2', part: P2, kind: 'divider', num: '02', title: 'Árvores', subtitle: 'Estruturas de dados não-lineares: árvores binárias e ABB', art: 'arte-1' },
  {
    id: 'anatomia', part: P2, kind: 'content', title: 'Estruturas não-lineares: árvores',
    body: () => <Two left={<>
      <p {...rv(0.1)}>Estrutura <b>hierárquica</b> formada por <b>nós</b> e <b>arestas</b>.</p>
      <ul {...rv(0.25)} className="rv">
        <li><b>Raiz:</b> o nó do topo</li>
        <li><b>Pai / Filho:</b> ligação direta entre níveis</li>
        <li><b>Irmãos:</b> filhos do mesmo pai</li>
        <li><b>Folhas:</b> nós sem filhos</li>
        <li><b>Nível</b> e <b>Altura</b></li>
      </ul>
    </>} right={<Anim id="anatomy" />} />,
  },
  {
    id: 'binaria-def', part: P2, kind: 'content', title: 'O que é uma Árvore Binária?',
    body: () => <Two ratio="1fr 1fr" left={<>
      <p {...rv(0.1)} className="rv big">Uma estrutura hierárquica e não-linear em que <b>cada nó tem, no máximo, dois filhos</b>.</p>
      <p {...rv(0.3)}>Cada nó é a raiz de duas subárvores: a <b style={{ color: '#2F6FB2' }}>esquerda</b> e a <b style={{ color: '#0A7A72' }}>direita</b>, que também são árvores binárias (definição <b>recursiva</b>).</p>
    </>} right={<div {...rv(0.2)} className="rv card-fig"><MiniTree pre={[8, 4, 2, 6, 12, 10, 14]} hl={{ 8: 'cur', 2: 'done', 6: 'done', 10: 'done', 14: 'done' }} labels={{ 8: 'R' }} /><div className="fig-cap">Laranja: raiz · Azul-escuro: folhas</div></div>} />,
  },
  {
    id: 'no', part: P2, kind: 'content', title: 'Lógica × Física: o nó',
    body: () => <Anim id="node" />,
  },
  {
    id: 'regra', part: P2, kind: 'content', title: 'Regra de ouro: Esq < Raiz < Dir',
    body: (go) => <Two ratio="1fr 1.1fr" left={<>
      <p {...rv(0.1)} className="rv big">Para <b>qualquer</b> nó <i>v</i>: tudo à esquerda é <b>menor</b> que <i>v</i>; tudo à direita é <b>maior</b>.</p>
      <p {...rv(0.3)}>A propriedade é <b>recursiva</b>: vale em cada subárvore. É ela que viabiliza a busca ultrarrápida, pois os próprios dados guiam a navegação.</p>
      <div {...rv(0.45)}><Link to="busca" go={go}>Ver a regra em ação na busca</Link></div>
    </>} right={<div {...rv(0.2)} className="rv card-fig"><MiniTree pre={[50, 25, 10, 30, 75, 60, 90]} halves w={560} h={320} r={28} /></div>} />,
  },

  // ---------------------------------------------------------------- PARTE 3
  { id: 'p3', part: P3, kind: 'divider', num: '03', title: 'Operações na ABB', subtitle: 'Busca, inserção, percursos e remoção, passo a passo', art: 'arte-0' },
  { id: 'busca', part: P3, kind: 'content', title: 'Busca: a lógica visual', body: () => <Anim id="busca40" /> },
  {
    id: 'busca-falha', part: P3, kind: 'content', title: 'Quando a busca falha',
    body: (go) => <Two ratio="0.7fr 1.8fr" left={<>
      <p {...rv(0.1)}>Seguimos a regra até encontrar uma referência <code>None</code>: o valor não existe.</p>
      <p {...rv(0.25)} className="rv callout">A cada decisão descartamos metade da árvore. Ideal: <b>O(log n)</b>.</p>
      <div {...rv(0.4)}><Link to="insercao" go={go}>Inserir é exatamente isto: uma busca que "falhou"</Link></div>
    </>} right={<Anim id="busca35" />} />,
  },
  { id: 'insercao', part: P3, kind: 'content', title: 'Inserção: rastreando a posição', body: () => <Anim id="inserir45" /> },
  {
    id: 'percursos', part: P3, kind: 'content', title: 'Os três percursos',
    body: (go) => (
      <div className="cards3">
        {[
          ['pre', 'Pré-Ordem', 'Raiz → Esq → Dir', 'Copiar / clonar a árvore', { 50: 'cur' }],
          ['em', 'Em-Ordem', 'Esq → Raiz → Dir', 'Sai em ordem crescente!', { 10: 'cur' }],
          ['pos', 'Pós-Ordem', 'Esq → Dir → Raiz', 'Apagar a árvore com segurança', { 10: 'cur' }],
        ].map(([id, t, r, use, hl], i) => (
          <div key={id as string} {...rv(0.1 + i * 0.15)} className="rv card3">
            <h3>{t as string}</h3>
            <MiniTree pre={[50, 25, 10, 30, 75, 60, 90]} hl={hl as never} w={360} h={200} r={20} />
            <div className="card3-rule">{r as string}</div>
            <div className="card3-use">{use as string}</div>
            <Link to={id as string} go={go}>Ver animação</Link>
          </div>
        ))}
      </div>
    ),
  },
  { id: 'pre', part: P3, kind: 'content', title: 'Percurso Pré-Ordem', body: () => <Anim id="pre" /> },
  { id: 'em', part: P3, kind: 'content', title: 'Em-Ordem: o superpoder da ABB', body: () => <Anim id="em" /> },
  { id: 'pos', part: P3, kind: 'content', title: 'Percurso Pós-Ordem', body: () => <Anim id="pos" /> },
  {
    id: 'desafio1', part: P3, kind: 'content', title: 'Desafio: leia a árvore',
    body: () => <Two ratio="1fr 1fr" left={<div {...rv(0.1)} className="rv card-fig"><MiniTree pre={[8, 3, 1, 6, 4, 7, 10, 14, 13]} w={540} h={330} r={26} /></div>} right={<div className="reveals">
      <Reveal q="1. Qual é o percurso EM-ORDEM?" a={<b>1 3 4 6 7 8 10 13 14 (crescente!)</b>} />
      <Reveal q="2. Qual é o percurso PRÉ-ORDEM?" a={<b>8 3 1 6 4 7 10 14 13</b>} />
      <Reveal q="3. Quantas folhas e qual a altura?" a={<b>4 folhas (1, 4, 7, 13) · altura 4</b>} />
    </div>} />,
  },
  { id: 'rem1', part: P3, kind: 'content', title: 'Remoção · Caso 1: o nó folha', body: () => <Anim id="rem1" /> },
  { id: 'rem2', part: P3, kind: 'content', title: 'Remoção · Caso 2: um filho', body: () => <Anim id="rem2" /> },
  { id: 'rem3', part: P3, kind: 'content', title: 'Remoção · Caso 3: dois filhos', body: () => <Anim id="rem3" /> },
  {
    id: 'video-abb', part: P3, kind: 'content', title: 'Vídeo-resumo: a ABB em ação',
    body: () => <div className="video-wrap"><video src="./media/abb-em-acao.mp4" controls autoPlay muted playsInline /></div>,
  },
  {
    id: 'lab', part: P3, kind: 'content', title: 'Laboratório: experimente!',
    body: () => <Lab />,
  },

  // ---------------------------------------------------------------- PARTE 4
  { id: 'p4', part: P4, kind: 'divider', num: '04', title: 'Desempenho', subtitle: 'A arquitetura geométrica dita o desempenho', art: 'arte-1' },
  {
    id: 'bigo', part: P4, kind: 'content', title: 'A matriz de complexidade (Big-O)',
    body: () => <Two ratio="1.5fr 1fr" left={
      <table className="tbl">
        <thead><tr {...rv(0.05)}><th>Operação</th><th>Melhor / Médio<br /><small>árvore balanceada</small></th><th>Pior caso<br /><small>árvore degenerada</small></th></tr></thead>
        <tbody>
          {['Busca', 'Inserção', 'Remoção'].map((op, i) => (
            <tr key={op} {...rv(0.2 + i * 0.15)}><td><b>{op}</b></td><td className="ok">O(log n)</td><td className="bad">O(n)</td></tr>
          ))}
        </tbody>
      </table>} right={<>
        <p {...rv(0.5)}>O poder da ABB reside no <b>O(log n)</b>, que depende da <b>altura</b> da árvore.</p>
        <p {...rv(0.65)} className="rv callout">Sem balanceamento automático, a estrutura pode colapsar numa linha reta. O design estrutural é o limite do hardware.</p>
      </>} />,
  },
  {
    id: 'degeneracao', part: P4, kind: 'content', title: 'Degeneração: o desequilíbrio',
    body: () => (
      <div className="duo">
        <div><Anim id="saudavel" compact /><p className="duo-cap ok">Altura ≈ log n → <b>O(log n)</b></p></div>
        <div><Anim id="degenerada" compact /><p className="duo-cap bad">Altura = n → vira lista → <b>O(n)</b></p></div>
      </div>
    ),
  },
  {
    id: 'balanceamento', part: P4, kind: 'content', title: 'Balanceamento: a cura',
    body: () => <Two ratio="1.1fr 1fr" left={<>
      <p {...rv(0.1)}>Inserir dados <b>já ordenados</b> (10, 20, 30, 40…) destrói o benefício logarítmico: O(log n) → O(n).</p>
      <p {...rv(0.25)}>Árvores <b>autobalanceadas</b> fazem <b>rotações</b> após inserções e remoções para manter a altura ≈ log n:</p>
      <ul {...rv(0.4)} className="rv">
        <li><b>AVL</b>: diferença de altura entre subárvores ≤ 1</li>
        <li><b>Rubro-Negra</b>: regras de cores; usada em <code>TreeMap</code> (Java) e <code>std::map</code> (C++)</li>
      </ul>
      <div {...rv(0.55)} className="rv refs-inline">
        <Ext href="https://www.cs.usfca.edu/~galles/visualization/AVLtree.html">Simulador AVL (USFCA)</Ext>
        <Ext href="https://www.cs.usfca.edu/~galles/visualization/RedBlack.html">Simulador Rubro-Negra</Ext>
      </div>
    </>} right={<div {...rv(0.3)} className="rv rot">
      <div className="rot-box"><MiniTree pre={[10, 20, 30]} hl={{ 10: 'del' }} w={240} h={230} r={24} /><span>desbalanceada</span></div>
      <div className="rot-arrow">⟳<small>rotação</small></div>
      <div className="rot-box"><MiniTree pre={[20, 10, 30]} hl={{ 20: 'found' }} w={240} h={230} r={24} /><span>balanceada</span></div>
    </div>} />,
  },

  // ---------------------------------------------------------------- PARTE 5
  { id: 'p5', part: P5, kind: 'divider', num: '05', title: 'Além das árvores', subtitle: 'Tabelas hash, colisões e a busca em grafos', art: 'arte-2' },
  {
    id: 'hash', part: P5, kind: 'content', title: 'O atalho supremo: tabelas hash',
    body: () => <Two left={<>
      <p {...rv(0.1)}>E se pudéssemos <b>calcular</b> onde a informação está, sem procurar?</p>
      <p {...rv(0.25)} className="rv callout">Chave → transformação matemática → endereço exato</p>
      <p {...rv(0.4)}>Complexidade média: <span className="tag-gr">O(1)</span>, independente do tamanho do banco de dados.</p>
    </>} right={<Anim id="hash" />} />,
  },
  {
    id: 'colisao', part: P5, kind: 'content', title: 'A inevitabilidade das colisões',
    body: () => <Two left={<>
      <p {...rv(0.1)}><b>Princípio da Casa dos Pombos:</b> ao compactar um universo infinito de chaves num espaço finito, colisões são matematicamente inevitáveis.</p>
      <p {...rv(0.3)}>Aqui, <b>"Beto"</b> (soma 394) e <b>"Rui"</b> (soma 304) caem ambos na posição <b>4</b>.</p>
    </>} right={<Anim id="colisao" />} />,
  },
  {
    id: 'resolucao', part: P5, kind: 'content', title: 'Como resolver colisões',
    body: () => (
      <div className="duo">
        <div><Anim id="encadeamento" compact /><p className="duo-cap"><b>Encadeamento:</b> listas externas. Pró: nunca "enche". Contra: memória extra com ponteiros.</p></div>
        <div><Anim id="sondagem" compact /><p className="duo-cap"><b>Sondagem linear:</b> próxima vaga livre. Pró: cache da CPU. Contra: aglomeração (clustering).</p></div>
      </div>
    ),
  },
  {
    id: 'grafos', part: P5, kind: 'content', title: 'Busca em grafos',
    body: (go) => <Two ratio="1fr 1fr" left={<>
      <p {...rv(0.1)}>Nem toda informação tem hierarquia óbvia. <b>Redes sociais, mapas e roteamento</b> exigem travessias cegas, porém sistemáticas.</p>
      <p {...rv(0.3)} className="rv callout"><b>Desafio:</b> visitar todos os nós sem entrar num loop infinito.<br /><b>Resposta:</b> marcadores de estado (<i>visited flags</i>).</p>
      <div {...rv(0.45)} className="rv links-col"><Link to="bfs" go={go}>BFS: a onda de expansão</Link><Link to="dfs" go={go}>DFS: o fio de Ariadne</Link></div>
    </>} right={<div {...rv(0.2)} className="rv evolve">
      <MiniTree pre={[50, 25, 10, 30, 75, 60, 90]} w={260} h={170} r={16} />
      <span className="evolve-arrow">→</span>
      <svg viewBox="0 0 260 200" className="minitree">
        {[[40, 40, 130, 20], [130, 20, 220, 60], [40, 40, 70, 150], [70, 150, 190, 170], [190, 170, 220, 60], [130, 20, 130, 100], [130, 100, 70, 150], [130, 100, 190, 170], [40, 40, 130, 100], [220, 60, 130, 100]].map(([a, b, c, d], i) => <line key={i} x1={a} y1={b} x2={c} y2={d} stroke="#6B7A8F" strokeWidth={3} />)}
        {[[40, 40], [130, 20], [220, 60], [70, 150], [190, 170], [130, 100]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={16} fill={i === 5 ? '#E0475B' : '#0F1B2D'} stroke="#fff" strokeWidth={3} />)}
      </svg>
    </div>} />,
  },
  {
    id: 'bfs', part: P5, kind: 'content', title: 'BFS: busca em largura',
    body: () => <Two ratio="0.7fr 1.8fr" left={<>
      <p {...rv(0.1)}><b>Motor:</b> fila (FIFO). O primeiro descoberto é o primeiro explorado.</p>
      <p {...rv(0.25)}><b>Cenário ideal:</b> rota mais curta em mapas, labirintos e redes.</p>
      <pre {...rv(0.4)} className="rv code">{'fila.append(origem)\nwhile fila:\n    atual = fila.pop(0)\n    explorar_vizinhos(atual, fila)'}</pre>
    </>} right={<Anim id="bfs" />} />,
  },
  {
    id: 'dfs', part: P5, kind: 'content', title: 'DFS: busca em profundidade',
    body: () => <Two ratio="0.7fr 1.8fr" left={<>
      <p {...rv(0.1)}><b>Motor:</b> pilha (LIFO) / recursão. Vai o mais fundo possível antes de recuar (<i>backtracking</i>).</p>
      <p {...rv(0.25)}><b>Cenário ideal:</b> dependências, detecção de ciclos e quebra-cabeças.</p>
      <pre {...rv(0.4)} className="rv code">{'def dfs(no):\n    no.visitado = True\n    for viz in no.vizinhos:\n        if not viz.visitado:\n            dfs(viz)'}</pre>
    </>} right={<Anim id="dfs" />} />,
  },
  {
    id: 'matriz', part: P5, kind: 'content', title: 'Matriz de decisão arquitetural',
    body: () => (
      <table className="tbl wide">
        <thead><tr {...rv(0.05)}><th>Algoritmo</th><th>Estrutura</th><th>Busca (média)</th><th>Busca (pior)</th><th>Caso de uso ideal</th></tr></thead>
        <tbody>
          {[
            ['Sequencial', 'Array / Lista', 'O(n)', 'O(n)', 'Dados não classificados / volumes minúsculos'],
            ['Binária', 'Vetor ordenado', 'O(log n)', 'O(log n)', 'Dados estáticos consultados massivamente'],
            ['ABB', 'Nós ligados', 'O(log n)', 'O(n)', 'Dados dinâmicos que exigem ordem e atualizações'],
            ['Hashing', 'Tabela de dispersão', 'O(1)', 'O(n)', 'Dicionários, caches, acesso instantâneo via chave'],
            ['BFS / DFS', 'Grafos / matrizes', 'O(V+E)', 'O(V+E)', 'Navegação de redes, mapas e topologias'],
          ].map((r, i) => (
            <tr key={r[0]} {...rv(0.15 + i * 0.1)} className={`rv ${r[0] === 'ABB' ? 'hi' : ''}`}>{r.map((c, j) => <td key={j} className={j === 2 || j === 3 ? 'mono' : ''}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    ),
  },
  {
    id: 'video-cart', part: P5, kind: 'content', title: 'Vídeo-resumo: cartografia',
    body: () => <div className="video-wrap"><video src="./media/cartografia-dos-dados.mp4" controls autoPlay muted playsInline /></div>,
  },
  {
    id: 'desafio2', part: P5, kind: 'content', title: 'Desafio: qual estrutura usar?',
    body: () => <div className="reveals grid2">
      <Reveal q="Um dicionário de 5 milhões de palavras consultado o tempo todo, sem ordem." a={<><b>Tabela hash</b>: acesso O(1) pela chave.</>} />
      <Reveal q="Uma agenda que recebe inserções e precisa listar contatos em ordem alfabética." a={<><b>ABB balanceada</b>: inserção O(log n) e em-ordem ordenado.</>} />
      <Reveal q="O caminho com menos estações entre duas paradas de ônibus." a={<><b>BFS</b>: explora em camadas e encontra a rota mais curta.</>} />
      <Reveal q="Uma lista de 8 itens que nunca muda." a={<><b>Busca sequencial</b>: simples e suficiente para n pequeno.</>} />
    </div>,
  },
  {
    id: 'refs', part: 'Encerramento', kind: 'content', title: 'Referências e simuladores',
    body: () => (
      <div className="refs">
        {[
          ['https://visualgo.net/en/bst', 'VisuAlgo: BST / AVL', 'Animações passo a passo de busca, inserção e remoção.'],
          ['https://www.cs.usfca.edu/~galles/visualization/BST.html', 'USFCA: Binary Search Tree', 'Simulador clássico usado em universidades.'],
          ['https://pt.wikipedia.org/wiki/%C3%81rvore_bin%C3%A1ria_de_busca', 'Wikipédia: Árvore binária de busca', 'Definição, propriedades e complexidade.'],
          ['https://pt.wikipedia.org/wiki/Tabela_de_dispers%C3%A3o', 'Wikipédia: Tabela de dispersão (hash)', 'Funções hash e tratamento de colisões.'],
          ['https://visualgo.net/en/dfsbfs', 'VisuAlgo: BFS e DFS', 'Travessias de grafos animadas.'],
          ['https://docs.python.org/pt-br/3/tutorial/datastructures.html', 'Python: estruturas de dados', 'Documentação oficial em português.'],
        ].map(([href, t, d], i) => (
          <a key={href} href={href} target="_blank" rel="noreferrer" {...rv(0.08 + i * 0.08)} className="rv ref">
            <b>{t}</b><span>{d}</span><small>{href.replace(/^https?:\/\//, '').slice(0, 52)}</small>
          </a>
        ))}
        <p {...rv(0.6)} className="rv refs-note">Material-base: <i>Árvores Binárias de Busca</i> (2 apostilas) e <i>A Cartografia dos Dados</i>.</p>
      </div>
    ),
  },
  { id: 'fim', part: 'Encerramento', kind: 'final' },
];

export { IfLogo };
