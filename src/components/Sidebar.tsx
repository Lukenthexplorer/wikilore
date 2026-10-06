import { useEffect, type ReactNode } from 'react'
import { Link, NavLink, useParams } from 'react-router-dom'
import { reinos, ROTULO_PADRAO } from '../lib/content'
import { usePreferencia } from '../lib/storage'
import { IconeChevron, IconePasta } from './Icons'

const EH_MAC = /Mac|iPhone|iPad/.test(navigator.userAgent)

interface SidebarProps {
  id: string
  /** Só relevante no mobile, onde a sidebar é uma gaveta. */
  aberta: boolean
  onFechar: () => void
  onBuscar: () => void
  temaControle: ReactNode
}

export default function Sidebar({ id, aberta, onFechar, onBuscar, temaControle }: SidebarProps) {
  const { reino: reinoAtivo, doc: docAtivo } = useParams()
  // Mapa slug → aberto/fechado. Pastas nunca tocadas usam o padrão "aberta".
  const [pastas, setPastas] = usePreferencia<Record<string, boolean>>('pastas', {})
  const estaAberta = (slug: string) => pastas[slug] ?? true

  // Ao chegar em um documento (por link ou URL direta), garante que sua pasta esteja visível.
  useEffect(() => {
    if (reinoAtivo && pastas[reinoAtivo] === false) setPastas((p) => ({ ...p, [reinoAtivo]: true }))
  }, [reinoAtivo]) // depende só do reino: reabrir a pasta a cada clique no chevron anularia o recolher

  return (
    <aside id={id} className="sidebar" data-aberta={aberta} aria-label="Arquivo">
      <div className="sidebar__topo">
        <Link to="/" className="sidebar__titulo" onClick={onFechar}>
          Arquivo da <span>Velha Era</span>
        </Link>
        <button type="button" className="sidebar__busca" onClick={onBuscar} aria-keyshortcuts="Control+K Meta+K">
          <span>Buscar no arquivo…</span>
          <kbd>{EH_MAC ? '⌘' : 'Ctrl'} K</kbd>
        </button>
      </div>

      <nav className="arvore" aria-label="Reinos e documentos">
        <ul>
          {reinos.map((reino) => {
            const aberto = estaAberta(reino.slug)
            const listaId = `pasta-${reino.slug}`
            return (
              <li key={reino.slug} className="arvore__reino">
                <button
                  type="button"
                  className="arvore__pasta"
                  aria-expanded={aberto}
                  aria-controls={listaId}
                  onClick={() => setPastas((p) => ({ ...p, [reino.slug]: !aberto }))}
                >
                  <IconeChevron className="arvore__chevron" />
                  <IconePasta className="arvore__icone" />
                  <span className="arvore__nomes">
                    <span className="arvore__nome">{reino.nome}</span>
                    {reino.subtitulo && <span className="arvore__subtitulo">{reino.subtitulo}</span>}
                  </span>
                </button>
                <ul id={listaId} hidden={!aberto}>
                  <li>
                    <NavLink to={reino.caminho} end className="arvore__doc arvore__doc--sobre" onClick={onFechar}>
                      {reino.rotulo === ROTULO_PADRAO ? 'Sobre o reino' : 'Apresentação'}
                    </NavLink>
                  </li>
                  {reino.soltos.map((doc) => (
                    <li key={doc.id}>
                      <NavLink to={doc.caminho} className="arvore__doc" onClick={onFechar}>
                        {doc.titulo}
                      </NavLink>
                    </li>
                  ))}
                  {reino.secoes.map((secao) => {
                    const chave = `${reino.slug}/${secao.pasta}`
                    // Seções começam fechadas (podem ter dezenas de itens), exceto a do documento aberto.
                    const contemAtivo =
                      reino.slug === reinoAtivo && secao.documentos.some((d) => d.slug === docAtivo)
                    const secaoAberta = pastas[chave] ?? contemAtivo
                    const secaoId = `secao-${reino.slug}-${secao.pasta}`
                    return (
                      <li key={secao.pasta} className="arvore__secao" data-ambiente={secao.ambiente}>
                        <button
                          type="button"
                          className="arvore__secao-botao"
                          aria-expanded={secaoAberta}
                          aria-controls={secaoId}
                          onClick={() => setPastas((p) => ({ ...p, [chave]: !secaoAberta }))}
                        >
                          <IconeChevron className="arvore__chevron" />
                          <span>{secao.nome}</span>
                          <span className="arvore__contagem">{secao.documentos.length}</span>
                        </button>
                        <ul id={secaoId} hidden={!secaoAberta}>
                          {secao.documentos.map((doc) => (
                            <li key={doc.id}>
                              <NavLink to={doc.caminho} className="arvore__doc" onClick={onFechar}>
                                {doc.titulo}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      </li>
                    )
                  })}
                </ul>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="sidebar__rodape">{temaControle}</div>
    </aside>
  )
}
