import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import MarkdownLink from './MarkdownLink'

/**
 * Markdown de uma linha só (sem <p> em volta), para valores de infobox e
 * eventos de timeline: permite *itálico*, **negrito** e links dentro deles.
 */
const componentes: Components = {
  p: ({ children }) => <>{children}</>,
  a: ({ href, children }) => <MarkdownLink href={href}>{children}</MarkdownLink>,
}

export default function InlineMarkdown({ fonte }: { fonte: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={componentes}>
      {fonte}
    </ReactMarkdown>
  )
}
