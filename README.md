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
├── script.js         # Interface: tema, rolagem, visualizadores, filtro e laboratórios
├── testes/           # Testes da lógica: node --test testes/logica.test.js
├── docs/             # PDFs da disciplina (plano, listas, apostilas)
└── aulas/
    └── 01-arvores-binarias/      # Apresentação da aula de árvores binárias de busca
        ├── index.html            # Apresentação pronta (gerada pelo build)
        ├── media/                # Vídeos e imagens renderizados com Remotion
        └── fonte/                # Código-fonte da apresentação (React + Remotion)
```

---

## 🧭 Seções do Portal

| Seção | Conteúdo |
|---|---|
| **Abertura** | Visualizador de **pilha, fila e lista ligada**: insira e remova valores e veja o custo de cada operação. |
| **Avisos** | Mural de comunicados da turma, empilhado como uma pilha. |
| **Atividades** | Aula de árvores binárias (apresentação), códigos das aulas práticas no **Google Colab** e laboratórios, com filtro. |
| **Materiais** | Tabela com apresentação, notebooks e laboratórios. |
| **Laboratório** | **Ordenação passo a passo** (bolha, seleção, inserção) e **árvore binária de busca** (inserção, busca e percursos). |
| **Trilha** | Os tópicos da disciplina encadeados: vetores e matrizes → listas encadeadas → pilhas e filas → recursão → árvores → busca e ordenação. |

---

## ✍️ Como publicar novos conteúdos

O `index.html` traz comentários `COMO ADICIONAR...` em cada seção. Em resumo:

1. **Aviso** → copie um `<li class="aviso">` para o topo da lista e altere a data, o tipo (`data-tipo="info"`, `"prazo"` ou `"ok"`) e o texto.
2. **Notebook do Colab** → no cartão “Códigos no Google Colab”, copie um `<li>` de `<ul class="no-links">` e troque o link, o título e a data. Confira no Colab se o compartilhamento está como “Qualquer pessoa com o link”.
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
