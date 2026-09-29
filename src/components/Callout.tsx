import { Children, isValidElement, type ReactElement, type ReactNode } from 'react'
import { CLASSE_TITULO, type TipoCallout } from '../lib/remark-callouts'
import { IconeAviso, IconeNota, IconeSecreto } from './Icons'

const ICONES = {
  nota: IconeNota,
  aviso: IconeAviso,
  secreto: IconeSecreto,
} as const

interface CalloutProps {
  tipo: TipoCallout
  children: ReactNode
}

/**
 * Desenha um callout já preparado pelo plugin remark-callouts. O primeiro
 * filho, se tiver a classe `callout-titulo`, é o título (ou o autor, nas citações).
 */
export default function Callout({ tipo, children }: CalloutProps) {
  const itens = Children.toArray(children).filter((c) => !(typeof c === 'string' && !c.trim()))
  const primeiro = itens[0]
  const ehTitulo =
    isValidElement<{ className?: string; children?: ReactNode }>(primeiro) &&
    primeiro.props.className === CLASSE_TITULO
  const titulo = ehTitulo ? (primeiro as ReactElement<{ children?: ReactNode }>).props.children : null
  const corpo = ehTitulo ? itens.slice(1) : itens

  if (tipo === 'citacao') {
    return (
      <figure className="citacao">
        <blockquote>{corpo}</blockquote>
        {titulo && <figcaption>{titulo}</figcaption>}
      </figure>
    )
  }

  const Icone = ICONES[tipo]
  return (
    <aside className={`callout callout--${tipo}`} role="note">
      {titulo && (
        <p className="callout__titulo">
          <Icone />
          <span>{titulo}</span>
        </p>
      )}
      <div className="callout__corpo">{corpo}</div>
    </aside>
  )
}
