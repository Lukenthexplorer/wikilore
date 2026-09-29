import { useCallback, useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Search from './Search'
import ThemeToggle from './ThemeToggle'
import { IconeMenu } from './Icons'

const SIDEBAR_ID = 'sidebar'

/**
 * Casca da aplicação: sidebar fixa no desktop, gaveta no mobile, e a busca
 * global (Ctrl/Cmd + K) disponível em qualquer página.
 */
export default function Layout() {
  const [gavetaAberta, setGavetaAberta] = useState(false)
  const [buscaAberta, setBuscaAberta] = useState(false)
  const { pathname } = useLocation()

  const fecharGaveta = useCallback(() => setGavetaAberta(false), [])
  const abrirBusca = useCallback(() => {
    setGavetaAberta(false)
    setBuscaAberta(true)
  }, [])

  // Trocar de página sempre fecha a gaveta (inclusive ao usar voltar/avançar).
  useEffect(() => setGavetaAberta(false), [pathname])

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setBuscaAberta((aberta) => !aberta)
      } else if (e.key === 'Escape') {
        setGavetaAberta(false)
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [])

  return (
    <div className="app" data-gaveta={gavetaAberta}>
      <a href="#conteudo" className="pular-link">
        Pular para o conteúdo
      </a>

      <header className="barra-movel">
        <button
          type="button"
          className="botao-icone"
          aria-label="Abrir índice do arquivo"
          aria-expanded={gavetaAberta}
          aria-controls={SIDEBAR_ID}
          onClick={() => setGavetaAberta(true)}
        >
          <IconeMenu />
        </button>
        <Link to="/" className="barra-movel__titulo">
          Arquivo da Velha Era
        </Link>
      </header>

      <Sidebar
        id={SIDEBAR_ID}
        aberta={gavetaAberta}
        onFechar={fecharGaveta}
        onBuscar={abrirBusca}
        temaControle={<ThemeToggle />}
      />
      {/* Véu escuro atrás da gaveta; clicar fora fecha. Decorativo para leitores de tela. */}
      <div className="veu" aria-hidden="true" onClick={fecharGaveta} />

      <main id="conteudo" className="principal" tabIndex={-1}>
        <Outlet />
      </main>

      <Search aberta={buscaAberta} onFechar={() => setBuscaAberta(false)} />
    </div>
  )
}
