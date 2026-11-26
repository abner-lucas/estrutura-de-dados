# 🌳 Portal de Estrutura de Dados

Repositório central de aulas, códigos das práticas, materiais e laboratórios interativos da disciplina de **Estrutura de Dados** (TIINF0939 · Técnico em Informática · Prof. Ábner Lucas · IFPA Campus Breves).

🌐 **Acesse o portal:** https://abner-lucas.github.io/estrutura-de-dados/

---

## 📌 Visão Geral

Este repositório é ao mesmo tempo **material didático de consulta** e o **portal publicado via GitHub Pages**. Na raiz, os estudantes encontram os avisos da turma, as aulas, os códigos das aulas práticas no Google Colab, os materiais e três laboratórios interativos.

A identidade visual segue a ideia de **memória e ponteiros**: nós com cantos arredondados, setas ligando uma coisa à seguinte, endereços em hexadecimal e o `NULL` que encerra cada cadeia. Os avisos formam uma pilha (o mais novo no topo), as atividades são nós ligados, os materiais ficam numa “tabela hash” e a trilha é uma lista encadeada.

---

## 📂 Estrutura do Repositório

```text
estrutura-de-dados/
├── index.html        # 🌟 Portal principal (raiz do GitHub Pages)
├── style.css         # Visual: tokens claro/escuro, palco escuro, nós e ponteiros
├── logica.js         # Lógica pura: pilha, fila, lista ligada, ordenação e árvore binária de busca
├── script.js         # Interface: tema, rolagem, divisores, filtro, busca, bancadas e laboratórios
├── arvore3d.js       # Abertura: árvore binária de busca em 3D (Three.js), com plano B em SVG
├── testes/           # Testes da lógica: node --test testes/*.test.js
├── ferramentas/      # aplicar-identidade.cjs (paleta do portal) e ficha-abb/ (gera a ficha .docx)
├── docs/             # PDFs da disciplina (plano, listas, apostilas)
└── aulas/
    └── 01-arvores-binarias/      # Apresentação da aula de árvores binárias de busca
        ├── index.html            # Apresentação pronta (gerada pelo build)
        ├── media/                # Vídeos e imagens renderizados com Remotion
        ├── fonte/                # Código-fonte da apresentação (React + Remotion)
        ├── laboratorio/          # Orientações do laboratório (passo a passo) + ficha do aluno .docx
        └── simulador/            # Simulador Estoque ABB: a árvore como o depósito de uma loja
            ├── index.html        # Simulador pronto (gerado pelo build)
            ├── materiais/        # Exercícios do aluno (.ipynb) e cartões da árvore humana (PDF/HTML)
            └── fonte/            # Código-fonte do simulador (React + Vite)
```

---

## 🧭 Seções do Portal

| Seção | Conteúdo |
|---|---|
| **Abertura** | **Árvore binária de busca em 3D** que se constrói na tela: cada valor desce comparando com os nós até virar folha. Dá para girar, passar o ponteiro num nó (endereço, filhos) e inserir valores. |
| **Avisos** | Mural de comunicados da turma, empilhado como uma pilha. |
| **Atividades** | Aula de árvores binárias (apresentação, simulador e exercícios no Colab), códigos das aulas práticas no **Google Colab** e laboratórios, com filtro. |
| **Códigos** | Os notebooks das aulas no **Google Colab**, agrupados por conteúdo (funções e recursão, cadeias de caracteres, vetores/matrizes/registros, listas/pilhas/filas, hash, árvores), com busca que ignora acentos. |
| **Materiais** | Tabela com apresentação, simulador, códigos e laboratórios. |
| **Laboratório** | Três bancadas em abas: **pilha, fila e lista ligada**, **ordenação passo a passo** (bolha, seleção, inserção) e **árvore binária de busca** (inserção, busca e percursos). Os links `#lab-lineares`, `#lab-ordenacao` e `#arvore` abrem a bancada certa. |
| **Trilha** | Os tópicos da disciplina encadeados: vetores e matrizes → listas encadeadas → pilhas e filas → recursão → árvores → busca e ordenação. |

---

## ✍️ Como publicar novos conteúdos

O `index.html` traz comentários `COMO ADICIONAR...` em cada seção. Em resumo:

1. **Aviso** → copie um `<li class="aviso">` para o topo da lista e altere a data, o tipo (`data-tipo="info"`, `"prazo"` ou `"ok"`) e o texto.
2. **Notebook do Colab** → na seção `#codigos`, copie um `<li>` do grupo certo e troque o título, o nome do arquivo, o link (`https://colab.research.google.com/drive/ID`) e as palavras de `data-busca`. Confira no Colab se o compartilhamento está como “Qualquer pessoa com o link”. Se for um dos mais recentes, troque também os dois links de destaque do cartão “Códigos no Google Colab” e atualize a contagem de notebooks nos textos.
3. **Atividade ou aula** → copie um `<article class="no-card">` e defina `data-categoria` como `aula`, `codigo` ou `pratica`. O último cartão usa `NULL` no lugar de `próx`.
4. **Material (PDF)** → coloque o arquivo em `docs/` e copie uma linha `<tr>` da tabela de materiais.
5. Se alterar `style.css`, `script.js` ou `logica.js`, troque o número `?v=...` nos links do `index.html` (ex.: `?v=2026.11.20`) para o navegador dos alunos baixar a versão nova.
6. Faça commit e push na branch `main`. O GitHub Pages atualiza o site em cerca de 1 minuto.

---

## 🎞️ Apresentação de árvores binárias

Abra pelo portal (cartão **Árvores binárias** → *Abrir apresentação*) ou direto em `aulas/01-arvores-binarias/`. Teclas: **← →** ou espaço navegam · **M** abre o mapa · **F** tela cheia · botão **← Portal** volta ao portal.

Para editar (requer Node.js), dentro de `aulas/01-arvores-binarias/fonte/`:

```bash
npm install          # só na primeira vez
npm run dev          # versão de edição no navegador
npm run render       # gera de novo os vídeos e imagens em ../media
npm run build        # atualiza ../index.html (a apresentação publicada)
```

Conteúdo dos slides: `src/deck.tsx` · Animações: `src/remotion/` · Lógica da ABB: `src/bst.ts` · Cores e fontes: `src/theme.ts` e `src/styles.css`.

## 🧪 Laboratório de árvores binárias

Em `aulas/01-arvores-binarias/laboratorio/`: página para o aluno com o passo a passo de cada parte (o que fazer, o que vai ver, onde registrar na ficha), glossário de termos e a **ficha do aluno em .docx**, entregue pelo SIGAA. Para mudar a ficha, edite `ferramentas/ficha-abb/gerar.cjs` e rode `npm install` e `npm run gerar` nessa pasta. As capturas de tela ficam em `laboratorio/img/`.

**Conferir cupons das Missões (uso do professor):** `aulas/01-arvores-binarias/conferir/` (não aparece nos menus). Digite os dados do print do cupom e a página diz se o código confere e se os dados seguem as regras da árvore. A regra do código está em `conferir/codigo-cupom.mjs`, a mesma usada pelo simulador.

## 🧮 Simulador Estoque ABB

Em `aulas/01-arvores-binarias/simulador/`. A árvore é o depósito de uma loja: cada nó é uma caixa com código de barras EAN-13 (JsBarcode), `inserir` traz uma caixa nova, `buscar` passa o leitor com laser e o bipe é opcional (Web Audio). As **Missões** terminam com um cupom de comprovante. Na visão **Ver código e pilha**, executa, linha por linha, o código Python da aula (`inserir`, `buscar`, `em_ordem`, `pre_ordem`, `pos_ordem`), mostrando a árvore, a linha atual, a pilha de chamadas, as variáveis e a saída do `print`, com perguntas de previsão e uma aba de desafios.

Links prontos para a turma (também gerados pelo botão **⚙ Professor → Copiar link**):

- `?numeros=45,20,60,10,30,50,70`: lista usada no script
- `&busca=30`: valor de `valor_teste`
- `&perguntas=nenhuma|essenciais|todas`: nível das perguntas de previsão
- `&modo=missoes`: abre direto nas Missões
- `?cenario=ordenado`: abre no Cadastro em ordem

Os exercícios do aluno abrem direto no Colab a partir deste repositório. O notebook do professor (com gabarito) **não** fica no repositório, que é público.

Para editar, dentro de `aulas/01-arvores-binarias/simulador/fonte/`: `npm install`, depois `npm run dev` (edição) ou `npm run build` (atualiza `../index.html`). Código da aula: `src/code.ts` · Execução e perguntas: `src/tracer.ts` · Árvore animada: `src/TreeView.tsx`.

---

## 🧪 Testes

```bash
node --test testes/logica.test.js
```

Cobrem as operações de pilha, fila e lista ligada (incluindo estouro e pilha vazia), os três algoritmos de ordenação (resultado ordenado, contagem de comparações e trocas, melhor caso) e a árvore binária de busca (inserção, busca, duplicados, altura e percursos).

---

## 🌐 Publicação no GitHub Pages

Settings › Pages › Source: branch `main`, pasta `/ (root)`.

---

> *Material desenvolvido para fins acadêmicos e pedagógicos.*
