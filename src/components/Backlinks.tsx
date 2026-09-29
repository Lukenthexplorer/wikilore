import { Link } from 'react-router-dom'
import { reinoDe } from '../lib/content'
import { backlinksDe } from '../lib/wikilinks'

/** Rodapé "Mencionado em": documentos que contêm um [[link]] para este. */
export default function Backlinks({ caminho }: { caminho: string }) {
  const mencoes = backlinksDe(caminho)
  return (
    <section className="mencoes" aria-labelledby="mencoes-titulo">
      <h2 id="mencoes-titulo">Mencionado em</h2>
      {mencoes.length === 0 ? (
        <p className="mencoes__vazio">Nenhum outro registro menciona este documento ainda.</p>
      ) : (
        <ul>
          {mencoes.map((doc) => (
            <li key={doc.id}>
              <Link to={doc.caminho}>{doc.titulo}</Link>
              <p>
                {reinoDe(doc).nome}
                {doc.resumo && ` — ${doc.resumo}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
