import { memo, useMemo } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import type { Element } from 'hast'
import remarkCallouts, { TIPOS_CALLOUT, type TipoCallout } from '../lib/remark-callouts'
import { transformarWikilinks } from '../lib/wikilinks'
import MarkdownLink from './MarkdownLink'
import Callout from './Callout'
import Timeline from './Timeline'
import Infobox from './Infobox'

/** Extrai linguagem e texto de um <pre><code class="language-x">. */
function lerBlocoDeCodigo(pre: Element | undefined): { lang?: string; texto: string } | null {
  const code = pre?.children.find((c): c is Element => c.type === 'element' && c.tagName === 'code')
  if (!code) return null
  const classes = Array.isArray(code.properties.className) ? code.properties.className.map(String) : []
  const lang = classes.find((c) => c.startsWith('language-'))?.slice('language-'.length)
  const texto = code.children.map((c) => (c.type === 'text' ? c.value : '')).join('')
  return { lang, texto }
}

const componentes: Components = {
  a: ({ href, children }) => <MarkdownLink href={href}>{children}</MarkdownLink>,

  // Blocos ```timeline``` e ```infobox``` viram componentes; o resto é código normal.
  pre: ({ node, children }) => {
    const bloco = lerBlocoDeCodigo(node)
    if (bloco?.lang === 'timeline') return <Timeline fonte={bloco.texto} />
    if (bloco?.lang === 'infobox') return <Infobox fonte={bloco.texto} />
    return <pre>{children}</pre>
  },

  // O plugin remark-callouts marca os blockquotes que são callouts.
  blockquote: ({ node, children }) => {
    const tipo = node?.properties.dataCallout
    if (typeof tipo === 'string' && (TIPOS_CALLOUT as readonly string[]).includes(tipo)) {
      return <Callout tipo={tipo as TipoCallout}>{children}</Callout>
    }
    return <blockquote>{children}</blockquote>
  },

  // Tabelas largas rolam dentro de si mesmas em vez de estourar a página no mobile.
  table: ({ children }) => (
    <div className="tabela-rolagem">
      <table>{children}</table>
    </div>
  ),
}

/**
 * Pipeline: [[wikilinks]] → links (texto) → remark (GFM + callouts) → rehype
 * (ids nos títulos, usados pelo sumário e por [[Doc#Seção]]) → React.
 */
function Markdown({ fonte }: { fonte: string }) {
  const processado = useMemo(() => transformarWikilinks(fonte), [fonte])
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkCallouts]} rehypePlugins={[rehypeSlug]} components={componentes}>
      {processado}
    </ReactMarkdown>
  )
}

export default memo(Markdown)
