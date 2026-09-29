import { lerInfobox } from '../lib/blocks'
import InlineMarkdown from './InlineMarkdown'

/** Bloco ```infobox```: ficha estilo enciclopédia com pares "Chave: Valor". */
export default function Infobox({ fonte }: { fonte: string }) {
  const { titulo, campos } = lerInfobox(fonte)
  return (
    <aside className="infobox" aria-label={titulo ?? 'Ficha'}>
      {titulo && <p className="infobox__titulo">{titulo}</p>}
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
