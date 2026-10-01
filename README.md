# Arquivo da Velha Era

Wiki estática de worldbuilding, no estilo Obsidian, para o universo da **Velha Era**.
O conteúdo são arquivos Markdown em `content/`: **criar um `.md` cria uma página**, sem tocar em código.

```bash
npm install       # uma vez
npm run dev       # servidor local em http://localhost:5173 (atualiza ao salvar)
npm run build     # gera o site estático em dist/
npm run preview   # serve o dist/ localmente para conferir o build
```

---

## Receita 1 — Adicionar um documento

1. Copie o [`TEMPLATE.md`](TEMPLATE.md) para a pasta do reino, por exemplo
   `content/02-isteros/guarda-imperial.md`.
2. Ajuste o frontmatter (o bloco entre `---`). Os campos:

   | Campo        | Obrigatório | Exemplo                               | Observação |
   |--------------|:-----------:|---------------------------------------|------------|
   | `titulo`     | sim         | `Guarda Imperial`                     | Use aspas se tiver `:` → `"Relatório: X"` |
   | `ordem`      |             | `5`                                   | Posição na sidebar; empate → ordem alfabética |
   | `tipo`       |             | `artigo`                              | `artigo`, `visao-geral`, `relatorio`, `linha-do-tempo` |
   | `tags`       |             | `[militar, capital]`                  | Entram na busca |
   | `status`     |             | `rascunho`                            | `rascunho` ou `canônico` |
   | `resumo`     |             | `Uma frase.`                          | Aparece na busca e em "Mencionado em" |
   | `atualizado` |             | `2026-09-29`                          | Entra em "Atualizados recentemente" na capa |
   | `registro`   |             | `AI-0042`                             | Só para relatórios; se omitido, é gerado |

3. Salve. O documento aparece na sidebar, na busca e na página do reino.

- O **endereço** vem do nome do arquivo: `guarda-imperial.md` → `/isteros/guarda-imperial`.
- O **título exibido** vem do frontmatter, então renomear o título não quebra links antigos de URL.
- Arquivos que começam com `_` (ex.: `_ideias.md`) são **ignorados**: servem como rascunho oculto.
- Frontmatter com erro **não quebra o site**: o documento aparece com um aviso discreto
  ("⚠ 1 aviso de formatação") dizendo o que corrigir.

## Receita 2 — Adicionar um reino

1. Crie uma pasta em `content/`, por exemplo `content/05-mar-de-cinzas/`.
   O prefixo numérico é opcional e só serve para ordenar as pastas no seu editor;
   o endereço fica `/mar-de-cinzas`.
2. Dentro dela, crie `_reino.md`:

   ```markdown
   ---
   nome: Mar de Cinzas
   subtitulo: Subtítulo em itálico
   ordem: 5
   ---

   Texto opcional de introdução, exibido na página do reino.
   ```

3. Adicione documentos como na receita 1. Pronto: o reino aparece na sidebar e na capa.

## Receita 3 — Recursos de Markdown

Tudo do Markdown comum funciona (títulos, listas, **negrito**, *itálico*, tabelas). Além disso:

### Links internos (wikilinks)

```markdown
[[Fortaleza e Prisão de Helland]]                  → link pelo título
[[Fortaleza e Prisão de Helland|a fortaleza]]      → com texto próprio
[[Visão Geral de Farlands#Geografia]]              → direto para uma seção
[[Página que Ainda Não Existe]]                    → aparece em vermelho tracejado
```

A busca pelo título ignora maiúsculas e acentos (`[[fortaleza e prisao de helland]]` funciona).
Cada documento lista no rodapé, em **"Mencionado em"**, quem aponta para ele.

### Callouts

```markdown
> [!citacao] Nome do Autor
> Citação em destaque, grande, com filete de bronze.

> [!nota]
> Caixa de anotação.

> [!aviso] Título opcional
> Algo em aberto ou a confirmar.

> [!secreto]
> Informação restrita, marcada em vermelho-selo.
```

### Linha do tempo

````markdown
```timeline
Ano 12  | Fundação da cidade
Ano 40  | Um evento com [[Link Interno]]
```
````

Uma linha por marco, no formato `Quando | O quê`.

### Infobox (ficha)

````markdown
```infobox
# Título da ficha (opcional)
Região: Noroeste
Capital: [[Visão Geral da Capital]]
```
````

Pares `Chave: Valor`. Flutua à direita no desktop e vai para o topo do documento no celular.

Para um **retrato, brasão ou mapa no topo da ficha** (como nas biografias da Wikipédia), coloque a
imagem na pasta do reino e acrescente uma linha dentro do bloco, com a legenda depois do `|`:

````markdown
```infobox
# Sir Windlock Bohgmah
![[sir-windlock-bohgmah.jpg|Sir Windlock Bohgmah em seu gabinete]]
Nascimento: c. 1096 da Era Comum
```
````

### Imagens

1. Coloque a imagem **na pasta do reino**, ao lado dos documentos
   (ex.: `content/02-isteros/dinastia-ahgamo.jpg`). Prefira nomes sem espaços nem acentos.
2. No documento, escreva:

```markdown
![[dinastia-ahgamo.jpg]]                              → imagem
![[dinastia-ahgamo.jpg|Árvore genealógica dos Ahgamo]] → com descrição (recomendado)
```

A descrição é lida por leitores de tela e aparece se a imagem não carregar. Clicar na imagem
abre em tamanho original. Se o nome estiver errado, aparece um aviso "Imagem não encontrada".
A sintaxe comum do Markdown, `![descrição](dinastia-ahgamo.jpg)`, também funciona.

Formatos: `png`, `jpg`, `webp`, `gif`, `svg`, `avif`. Imagens pesam no carregamento:
para ilustrações e fotos, prefira `.jpg` ou `.webp` com até ~1 MB.

---

## Publicação

O build gera arquivos estáticos em `dist/`, sem backend.

**Vercel:** importe o repositório; o preset "Vite" já acerta os comandos. O `vercel.json`
redireciona todas as rotas para o `index.html`, então URLs diretas como `/farlands/arhto-keim`
funcionam ao recarregar.

**GitHub Pages:** em *Settings → Pages*, escolha *Source: GitHub Actions*. O workflow em
`.github/workflows/deploy.yml` publica a cada push na `main`, já configurando o caminho
`/<nome-do-repositório>/`. Para testar esse modo localmente:

```bash
BASE_PATH=/velha-era/ npm run build && npm run preview
```

O build copia `index.html` para `404.html`, que é como o GitHub Pages passa a abrir URLs diretas.

## Onde está cada coisa

```
content/                 conteúdo (reinos = pastas, documentos = .md)
src/lib/content.ts       descobre, valida e indexa os .md
src/lib/wikilinks.ts     resolve [[links]] e calcula backlinks
src/lib/remark-callouts.ts  transforma > [!tipo] em callouts
src/lib/blocks.ts        lê os blocos timeline e infobox
src/lib/search.ts        índice e pontuação da busca
src/components/          Sidebar, DocView, Callout, Timeline, Infobox, Search, Backlinks…
src/styles/tokens.css    paleta, fontes, escala e espaçamentos (o tema inteiro)
src/styles/global.css    layout e componentes
```
# wikilore
