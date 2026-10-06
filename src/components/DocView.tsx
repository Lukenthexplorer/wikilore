import { useEffect, useRef } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { encontrarDocumento, reinoDe, secaoDe, ROTULO_STATUS, ROTULO_TIPO, type Documento } from '../lib/content'
import Markdown from './Markdown'
import ReportHeader from './ReportHeader'
import TableOfContents from './TableOfContents'
import Backlinks from './Backlinks'
import NotFound from '../pages/NotFound'

/** Rola para o topo ao trocar de documento, ou até a seção pedida em `#ancora`. */
function useRolagemInicial(docId: string, hash: string) {
  useEffect(() => {
    const alvo = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null
    if (alvo) alvo.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [docId, hash])
}

export default function DocView() {
  const { reino = '', doc: slug = '' } = useParams()
  const { hash } = useLocation()
  const doc = encontrarDocumento(reino, slug)

  useRolagemInicial(doc?.id ?? '', hash)
  useEffect(() => {
    document.title = doc ? `${doc.titulo} · Arquivo da Velha Era` : 'Arquivo da Velha Era'
  }, [doc])

  if (!doc) return <NotFound />
  // `key` remonta o artigo a cada documento, disparando a transição de opacidade.
  return <Artigo key={doc.id} doc={doc} />
}

function Artigo({ doc }: { doc: Documento }) {
  const reino = reinoDe(doc)
  const secao = secaoDe(doc)
  const corpoRef = useRef<HTMLDivElement>(null)

  return (
    <div className="documento">
      <article className="artigo" aria-labelledby="titulo-doc">
        <nav className="trilha" aria-label="Trilha">
          <ol>
            <li>
              <Link to={reino.caminho}>{reino.nome}</Link>
            </li>
            {secao && <li>{secao.nome}</li>}
            <li aria-current="page">{doc.titulo}</li>
          </ol>
        </nav>

        {doc.tipo === 'relatorio' && <ReportHeader doc={doc} reino={reino} />}

        <header className="artigo__cabecalho">
          <h1 id="titulo-doc" className="artigo__titulo">
            {doc.titulo}
            {doc.status === 'rascunho' && <span className="marca-rascunho">Rascunho</span>}
          </h1>
          <Metadados doc={doc} />
        </header>

        {doc.avisos.length > 0 && <Avisos avisos={doc.avisos} arquivo={doc.arquivo} />}

        <div className="artigo__corpo prosa" ref={corpoRef}>
          <Markdown fonte={doc.corpo} pasta={doc.pasta} />
        </div>

        <Backlinks caminho={doc.caminho} />
      </article>

      <TableOfContents corpo={corpoRef} />
    </div>
  )
}

function Metadados({ doc }: { doc: Documento }) {
  return (
    <dl className="metadados">
      <div>
        <dt>Tipo</dt>
        <dd>{ROTULO_TIPO[doc.tipo]}</dd>
      </div>
      <div>
        <dt>Status</dt>
        <dd data-status={doc.status}>{ROTULO_STATUS[doc.status]}</dd>
      </div>
      {doc.tags.length > 0 && (
        <div>
          <dt>Tags</dt>
          <dd>
            <ul className="tags">
              {doc.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </dd>
        </div>
      )}
    </dl>
  )
}

/** Problemas de frontmatter: visíveis para quem escreve, discretos para quem lê. */
function Avisos({ avisos, arquivo }: { avisos: string[]; arquivo: string }) {
  return (
    <details className="avisos">
      <summary>
        {avisos.length === 1 ? '1 aviso de formatação' : `${avisos.length} avisos de formatação`}
      </summary>
      <p>
        Em <code>{arquivo.replace(/^\//, '')}</code>:
      </p>
      <ul>
        {avisos.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
    </details>
  )
}
