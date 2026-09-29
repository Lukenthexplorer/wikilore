import { useEffect, useState, type RefObject } from 'react'

interface Secao {
  id: string
  texto: string
  nivel: 2 | 3
}

/** Distância do topo da janela a partir da qual uma seção conta como "atual". */
const LINHA_DE_LEITURA = 120

/**
 * Sumário lateral (h2/h3), visível só em telas ≥ 1280px (ver global.css).
 * Lê os títulos direto do DOM renderizado: assim os ids são exatamente os
 * gerados pelo rehype-slug, sem reimplementar o algoritmo.
 */
export default function TableOfContents({ corpo }: { corpo: RefObject<HTMLElement | null> }) {
  const [secoes, setSecoes] = useState<Secao[]>([])
  const [atual, setAtual] = useState<string | null>(null)

  useEffect(() => {
    const raiz = corpo.current
    if (!raiz) return
    const titulos = [...raiz.querySelectorAll<HTMLHeadingElement>('h2[id], h3[id]')]
    setSecoes(titulos.map((h) => ({ id: h.id, texto: h.textContent ?? '', nivel: h.tagName === 'H2' ? 2 : 3 })))

    // Seção atual = último título que já passou da linha de leitura.
    let quadro = 0
    const atualizar = () => {
      quadro = 0
      let ativo: string | null = null
      for (const h of titulos) {
        if (h.getBoundingClientRect().top <= LINHA_DE_LEITURA) ativo = h.id
        else break
      }
      setAtual(ativo ?? titulos[0]?.id ?? null)
    }
    const aoRolar = () => {
      if (!quadro) quadro = requestAnimationFrame(atualizar)
    }
    atualizar()
    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => {
      window.removeEventListener('scroll', aoRolar)
      cancelAnimationFrame(quadro)
    }
  }, [corpo])

  if (secoes.length < 2) return null

  return (
    <nav className="sumario" aria-labelledby="sumario-titulo">
      <h2 id="sumario-titulo" className="sumario__titulo">
        Neste documento
      </h2>
      <ol>
        {secoes.map((s) => (
          <li key={s.id} className={`sumario__nivel-${s.nivel}`}>
            <a href={`#${s.id}`} aria-current={s.id === atual ? 'true' : undefined}>
              {s.texto}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
