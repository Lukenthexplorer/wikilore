import { lerInfobox } from '../lib/blocks'
import { resolverImagem } from '../lib/content'
import InlineMarkdown from './InlineMarkdown'

interface InfoboxProps {
  fonte: string
  /** Pasta do reino em content/, base para resolver a imagem da ficha. */
  pasta: string
}

/** Bloco ```infobox```: ficha estilo enciclopédia com imagem opcional e pares "Chave: Valor". */
export default function Infobox({ fonte, pasta }: InfoboxProps) {
  const { titulo, imagem, campos } = lerInfobox(fonte)
  const url = imagem && resolverImagem(pasta, imagem.src)
  return (
    <aside className="infobox" aria-label={titulo ?? 'Ficha'}>
      {titulo && <p className="infobox__titulo">{titulo}</p>}
      {imagem && (
        <figure className="infobox__imagem">
          {url ? (
            <a href={url} target="_blank" rel="noopener" title="Abrir em tamanho original">
              <img src={url} alt={imagem.legenda || titulo || ''} loading="lazy" decoding="async" />
            </a>
          ) : (
            <span className="imagem-ausente">
              Imagem não encontrada: <code>{imagem.src}</code>
            </span>
          )}
          {imagem.legenda && (
            <figcaption>
              <InlineMarkdown fonte={imagem.legenda} />
            </figcaption>
          )}
        </figure>
      )}
      <dl>
        {campos.map(({ chave, valor }, i) => (
          <div key={i}>
            <dt>{chave}</dt>
            <dd>{valor ? <InlineMarkdown fonte={valor} /> : '—'}</dd>
          </div>
        ))}
      </dl>
    </aside>
  )
}
