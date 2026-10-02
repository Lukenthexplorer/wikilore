/**
 * Links internos no estilo Obsidian: [[Título]], [[Título|texto]] e [[Título#Seção]].
 *
 * Estratégia: antes de entregar o Markdown ao react-markdown, reescrevemos cada
 * [[wikilink]] como um link Markdown comum, já resolvido para a rota final
 * (`[texto](/farlands/arhto-keim)`). Assim o parser trata o link como qualquer
 * outro e o componente <a> só precisa distinguir "interno" de "ausente".
 *
 * Por que texto e não um plugin remark? Porque o `|` do alias colidiria com as
 * colunas dos blocos ```timeline``` (Ano | Evento). Resolvendo antes, o `|` some
 * e os blocos especiais recebem links prontos.
 */
import { slug as slugDeTitulo } from 'github-slugger'
import { documentos, reinos, type Documento } from './content'
import { normalizar } from './text'

/** Prefixo dos links para páginas que ainda não existem (tratado em <MarkdownLink>). */
export const PREFIXO_AUSENTE = '/__ausente__/'

/** Blocos cercados cujo conteúdo também pode conter [[links]]. */
const BLOCOS_COM_LINKS = new Set(['timeline', 'infobox'])

const WIKILINK = /\[\[([^[\]|#\n]+)(?:#([^[\]|\n]+))?(?:\|([^[\]\n]+))?\]\]/g

/** ![[imagem.png]] ou ![[imagem.png|legenda]]: imagem embutida, como no Obsidian. */
const EMBED = /!\[\[([^[\]|\n]+)(?:\|([^[\]\n]+))?\]\]/g
const EXTENSAO_IMAGEM = /\.(png|jpe?g|webp|gif|svg|avif)$/i

/**
 * Converte ![[imagem]] em imagem Markdown comum. Embeds de documentos (não
 * suportados) viram um link normal, para o "!" não transformar o link em imagem.
 */
function transformarEmbeds(trecho: string): string {
  return trecho.replace(EMBED, (_, alvo: string, legenda: string | undefined) => {
    const arquivo = alvo.trim()
    if (!EXTENSAO_IMAGEM.test(arquivo)) return legenda ? `[[${arquivo}|${legenda}]]` : `[[${arquivo}]]`
    // Sem legenda, o texto alternativo é o nome do arquivo, sem extensão e hífens.
    const alt = (legenda ?? arquivo.replace(EXTENSAO_IMAGEM, '').replace(/[-_]+/g, ' ')).trim()
    return `![${alt}](<${arquivo}>)`
  })
}

// Índice de busca por título normalizado (sem acentos/maiúsculas).
// Também aceita o slug do arquivo e o nome do reino, para conveniência.
const destinos = new Map<string, string>()
for (const reino of reinos) destinos.set(normalizar(reino.nome), reino.caminho)
for (const doc of documentos) destinos.set(normalizar(doc.slug.replace(/-/g, ' ')), doc.caminho)
// Apelidos declarados no frontmatter (`apelidos: [Longbridge]`).
for (const doc of documentos) for (const apelido of doc.apelidos) destinos.set(normalizar(apelido), doc.caminho)
// Títulos por último: têm prioridade sobre slugs, apelidos e nomes de reino.
for (const doc of documentos) destinos.set(normalizar(doc.titulo), doc.caminho)

export interface WikilinkResolvido {
  alvo: string
  /** Rota interna, ou `undefined` se o documento ainda não foi escrito. */
  caminho?: string
}

export function resolverWikilink(alvo: string, secao?: string): WikilinkResolvido {
  const caminho = destinos.get(normalizar(alvo))
  if (!caminho) return { alvo }
  // Mesmo algoritmo do rehype-slug, para bater com os ids dos títulos.
  return { alvo, caminho: secao ? `${caminho}#${slugDeTitulo(secao.trim())}` : caminho }
}

/**
 * Percorre o Markdown aplicando `fn` apenas ao texto "comum": ignora blocos de
 * código (exceto timeline/infobox) e trechos `em código inline`, para que
 * exemplos de sintaxe não virem links de verdade.
 */
function mapearTextoForaDeCodigo(markdown: string, fn: (trecho: string) => string): string {
  const linhas = markdown.split('\n')
  let cerca: { marca: string; transformar: boolean } | null = null

  return linhas
    .map((linha) => {
      const abertura = /^\s{0,3}(`{3,}|~{3,})\s*([\w-]*)/.exec(linha)
      if (cerca) {
        if (abertura && abertura[1]!.startsWith(cerca.marca) && !abertura[2]) {
          cerca = null
          return linha
        }
        return cerca.transformar ? fn(linha) : linha
      }
      if (abertura) {
        cerca = { marca: abertura[1]!, transformar: BLOCOS_COM_LINKS.has(abertura[2]!.toLowerCase()) }
        return linha
      }
      // Separa `código inline` (índices ímpares) do texto normal (índices pares).
      return linha
        .split(/(`[^`]*`)/)
        .map((parte, i) => (i % 2 === 1 ? parte : fn(parte)))
        .join('')
    })
    .join('\n')
}

/** Reescreve [[wikilinks]] como links Markdown já resolvidos. */
export function transformarWikilinks(markdown: string): string {
  return mapearTextoForaDeCodigo(markdown, (trecho) =>
    transformarEmbeds(trecho).replace(WIKILINK, (_, alvo: string, secao: string | undefined, apelido: string | undefined) => {
      const texto = (apelido ?? (secao ? `${alvo} › ${secao}` : alvo)).trim()
      const { caminho } = resolverWikilink(alvo, secao)
      const destino = caminho ?? PREFIXO_AUSENTE + encodeURIComponent(alvo.trim())
      return `[${texto}](<${destino}>)`
    }),
  )
}

/** Lista os alvos (títulos) de todos os [[wikilinks]] de um texto. */
export function extrairAlvos(markdown: string): string[] {
  const alvos: string[] = []
  mapearTextoForaDeCodigo(markdown, (trecho) => {
    for (const m of transformarEmbeds(trecho).matchAll(WIKILINK)) alvos.push(m[1]!)
    return trecho
  })
  return alvos
}

// ---------------------------------------------------------------------------
// Backlinks: calculados uma vez para toda a wiki.
// ---------------------------------------------------------------------------

const backlinks = new Map<string, Documento[]>()
for (const origem of documentos) {
  const destinosDaOrigem = new Set(
    extrairAlvos(origem.corpo)
      .map((alvo) => resolverWikilink(alvo).caminho)
      .filter((c): c is string => !!c && c !== origem.caminho),
  )
  for (const caminho of destinosDaOrigem) {
    backlinks.set(caminho, [...(backlinks.get(caminho) ?? []), origem])
  }
}

/** Documentos que contêm um [[link]] para `doc`. */
export function backlinksDe(caminho: string): Documento[] {
  return backlinks.get(caminho) ?? []
}
