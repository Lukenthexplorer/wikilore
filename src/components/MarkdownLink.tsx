import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PREFIXO_AUSENTE } from '../lib/wikilinks'

/**
 * <a> do Markdown: decide entre rota interna, página ainda não escrita e link externo.
 * Os [[wikilinks]] já chegam aqui convertidos em hrefs (ver lib/wikilinks.ts).
 */
export default function MarkdownLink({ href = '', children }: { href?: string; children?: ReactNode }) {
  if (href.startsWith(PREFIXO_AUSENTE)) {
    const alvo = decodeURIComponent(href.slice(PREFIXO_AUSENTE.length))
    return (
      <span className="wikilink wikilink--ausente" title={`“${alvo}” — página ainda não escrita`}>
        {children}
        <span className="sr-only"> (página ainda não escrita)</span>
      </span>
    )
  }
  if (href.startsWith('/')) {
    return (
      <Link to={href} className="wikilink">
        {children}
      </Link>
    )
  }
  if (href.startsWith('#')) return <a href={href}>{children}</a>
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="link-externo">
      {children}
    </a>
  )
}
