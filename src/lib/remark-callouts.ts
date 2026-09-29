/**
 * Plugin remark para callouts no estilo Obsidian:
 *
 *   > [!nota] Título opcional
 *   > Conteúdo do callout…
 *
 * Trabalhamos na árvore Markdown (mdast), e não no HTML, porque ali o marcador
 * `[!tipo]` ainda é texto simples no início do primeiro parágrafo. O plugin:
 *   1. marca o <blockquote> com `data-callout="<tipo>"`;
 *   2. separa a primeira linha (título) num parágrafo com classe `callout-titulo`;
 *   3. deixa o resto do conteúdo intacto.
 * O componente <Callout> decide depois como desenhar cada tipo.
 */
import type { Blockquote, Paragraph, PhrasingContent, Root, RootContent } from 'mdast'
import { normalizar } from './text'

export const TIPOS_CALLOUT = ['citacao', 'nota', 'aviso', 'secreto'] as const
export type TipoCallout = (typeof TIPOS_CALLOUT)[number]

/** Aceita a grafia portuguesa com/sem acento e os nomes em inglês do Obsidian. */
const ALIASES: Record<string, TipoCallout> = {
  citacao: 'citacao',
  quote: 'citacao',
  cite: 'citacao',
  nota: 'nota',
  note: 'nota',
  info: 'nota',
  aviso: 'aviso',
  warning: 'aviso',
  caution: 'aviso',
  secreto: 'secreto',
  secret: 'secreto',
}

/** Rótulo usado quando o callout não tem título próprio. Citações ficam sem. */
export const ROTULO_CALLOUT: Record<TipoCallout, string> = {
  citacao: '',
  nota: 'Nota',
  aviso: 'Aviso',
  secreto: 'Secreto',
}

export const CLASSE_TITULO = 'callout-titulo'

// [!tipo] seguido opcionalmente de +/- (dobra do Obsidian, aqui ignorada).
const MARCADOR = /^\[!([^\]\s]+)\][+-]?[ \t]*/

export default function remarkCallouts() {
  return (arvore: Root) => percorrer(arvore)
}

function percorrer(no: Root | RootContent): void {
  if (!('children' in no)) return
  for (const filho of no.children) {
    if (filho.type === 'blockquote') transformar(filho)
    percorrer(filho)
  }
}

function transformar(citacao: Blockquote): void {
  const primeiro = citacao.children[0]
  if (primeiro?.type !== 'paragraph') return
  const texto = primeiro.children[0]
  if (texto?.type !== 'text') return
  const marcador = MARCADOR.exec(texto.value)
  if (!marcador) return

  // Tipos desconhecidos viram "nota", como no Obsidian.
  const tipo = ALIASES[normalizar(marcador[1]!)] ?? 'nota'
  texto.value = texto.value.slice(marcador[0].length)

  // Tudo até a primeira quebra de linha é título; o restante é corpo.
  const titulo: PhrasingContent[] = []
  const corpo: PhrasingContent[] = []
  let quebrou = false
  for (const no of primeiro.children) {
    if (quebrou) {
      corpo.push(no)
    } else if (no.type === 'text' && no.value.includes('\n')) {
      const i = no.value.indexOf('\n')
      const antes = no.value.slice(0, i)
      const depois = no.value.slice(i + 1)
      if (antes) titulo.push({ type: 'text', value: antes })
      if (depois) corpo.push({ type: 'text', value: depois })
      quebrou = true
    } else if (no.type === 'break') {
      quebrou = true
    } else {
      titulo.push(no)
    }
  }

  const temTitulo = titulo.some((n) => n.type !== 'text' || n.value.trim())
  if (!temTitulo && ROTULO_CALLOUT[tipo]) {
    titulo.splice(0, titulo.length, { type: 'text', value: ROTULO_CALLOUT[tipo] })
  }

  const novos: Paragraph[] = []
  if (titulo.length && (temTitulo || ROTULO_CALLOUT[tipo])) {
    novos.push({ type: 'paragraph', children: titulo, data: { hProperties: { className: [CLASSE_TITULO] } } })
  }
  if (corpo.length) novos.push({ type: 'paragraph', children: corpo })

  citacao.children.splice(0, 1, ...novos)
  citacao.data = { ...citacao.data, hProperties: { dataCallout: tipo } }
}
