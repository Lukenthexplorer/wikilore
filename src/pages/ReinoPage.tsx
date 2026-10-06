import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { encontrarReino, ROTULO_TIPO, type Documento } from '../lib/content'
import Markdown from '../components/Markdown'
import NotFound from './NotFound'

/** Página de um reino: introdução (corpo do _reino.md) e lista de documentos. */
export default function ReinoPage() {
  const { reino: slug = '' } = useParams()
  const reino = encontrarReino(slug)

  useEffect(() => {
    if (reino) document.title = `${reino.nome} · Arquivo da Velha Era`
    window.scrollTo(0, 0)
  }, [reino])

  if (!reino) return <NotFound />

  return (
    <div className="pagina" key={reino.slug}>
      <header className="pagina__cabecalho">
        <p className="sobretitulo">{reino.rotulo}</p>
        <h1 className="pagina__titulo">{reino.nome}</h1>
        {reino.subtitulo && <p className="pagina__subtitulo">{reino.subtitulo}</p>}
      </header>

      {reino.introducao && (
        <div className="prosa">
          <Markdown fonte={reino.introducao} pasta={reino.pasta} />
        </div>
      )}

      {reino.documentos.length === 0 && <p className="vazio">Nenhum documento aqui ainda.</p>}
      {reino.soltos.length > 0 && <ListaDeDocumentos id="docs-reino" titulo="Documentos" documentos={reino.soltos} />}
      {reino.secoes.map((secao) => (
        <ListaDeDocumentos key={secao.pasta} id={`docs-${secao.pasta}`} titulo={secao.nome} documentos={secao.documentos} />
      ))}
    </div>
  )
}

function ListaDeDocumentos({ id, titulo, documentos }: { id: string; titulo: string; documentos: Documento[] }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="secao-titulo">{titulo}</h2>
      <ol className="lista-docs">
        {documentos.map((doc) => (
          <li key={doc.id}>
            <Link to={doc.caminho} className="lista-docs__titulo">
              {doc.titulo}
            </Link>
            <span className="lista-docs__tipo">{ROTULO_TIPO[doc.tipo]}</span>
            {doc.resumo && <p className="lista-docs__resumo">{doc.resumo}</p>}
          </li>
        ))}
      </ol>
    </section>
  )
}
