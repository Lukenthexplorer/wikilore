import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { atualizadosRecentemente, reinoDe, reinos, ROTULO_PADRAO, type Reino } from '../lib/content'

const formatoData = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

/** Capa do arquivo: os reinos e os registros atualizados recentemente. */
export default function Home() {
  const recentes = atualizadosRecentemente()
  // Pastas com `rotulo` próprio (biblioteca, acervos…) ficam separadas dos reinos.
  const soReinos = reinos.filter((r) => r.rotulo === ROTULO_PADRAO)
  const colecoes = reinos.filter((r) => r.rotulo !== ROTULO_PADRAO)

  useEffect(() => {
    document.title = 'Arquivo da Velha Era'
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="pagina capa">
      <header className="capa__cabecalho">
        <p className="sobretitulo">Registros do Arquivista Imperial</p>
        <h1 className="capa__titulo">Arquivo da Velha Era</h1>
        <div className="ornamento" aria-hidden="true">
          <span>❦</span>
        </div>
      </header>

      <GradeDePastas id="capa-reinos" titulo="Os Reinos" pastas={soReinos} />
      {colecoes.length > 0 && <GradeDePastas id="capa-colecoes" titulo="Acervo" pastas={colecoes} />}

      {recentes.length > 0 && (
        <section aria-labelledby="capa-recentes">
          <h2 id="capa-recentes" className="secao-titulo">Atualizados recentemente</h2>
          <ol className="lista-docs">
            {recentes.map((doc) => (
              <li key={doc.id}>
                <Link to={doc.caminho} className="lista-docs__titulo">
                  {doc.titulo}
                </Link>
                <span className="lista-docs__tipo">
                  {reinoDe(doc).nome} · <time dateTime={doc.atualizado}>{formatoData.format(new Date(doc.atualizado!))}</time>
                </span>
                {doc.resumo && <p className="lista-docs__resumo">{doc.resumo}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}

function GradeDePastas({ id, titulo, pastas }: { id: string; titulo: string; pastas: Reino[] }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="secao-titulo">{titulo}</h2>
      <ol className="grade-reinos">
        {pastas.map((pasta, i) => (
          <li key={pasta.slug}>
            <Link to={pasta.caminho} className="cartao-reino">
              <span className="cartao-reino__numero">{toRomano(i + 1)}</span>
              <span className="cartao-reino__nome">{pasta.nome}</span>
              {pasta.subtitulo && <span className="cartao-reino__subtitulo">{pasta.subtitulo}</span>}
              <span className="cartao-reino__contagem">
                {pasta.documentos.length} {pasta.documentos.length === 1 ? 'documento' : 'documentos'}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}

/** Numeração romana para os reinos, como capítulos de um códice. */
function toRomano(n: number): string {
  const tabela: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ]
  let resto = n
  let saida = ''
  for (const [valor, simbolo] of tabela) {
    while (resto >= valor) {
      saida += simbolo
      resto -= valor
    }
  }
  return saida
}
