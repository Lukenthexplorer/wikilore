import { lerTimeline } from '../lib/blocks'
import InlineMarkdown from './InlineMarkdown'

/** Bloco ```timeline```: linha vertical com um marco por linha "Ano | Evento". */
export default function Timeline({ fonte }: { fonte: string }) {
  const marcos = lerTimeline(fonte)
  if (marcos.length === 0) return null
  return (
    <ol className="timeline">
      {marcos.map((m, i) => (
        <li key={i}>
          <span className="timeline__ano">{m.ano}</span>
          <span className="timeline__evento">
            <InlineMarkdown fonte={m.evento} />
          </span>
        </li>
      ))}
    </ol>
  )
}
