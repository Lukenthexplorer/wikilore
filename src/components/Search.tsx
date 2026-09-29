import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { reinoDe, ROTULO_TIPO } from '../lib/content'
import { buscar, destacar, termosDe } from '../lib/search'
import { IconeBusca } from './Icons'

interface SearchProps {
  aberta: boolean
  onFechar: () => void
}

/**
 * Paleta de busca (Ctrl/Cmd + K). Usa <dialog> nativo com showModal(): o
 * navegador cuida de prender o foco, fechar com Esc e devolver o foco ao
 * elemento anterior. O campo segue o padrão ARIA "combobox + listbox".
 */
export default function Search({ aberta, onFechar }: SearchProps) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const lista = useRef<HTMLUListElement>(null)
  const [consulta, setConsulta] = useState('')
  const [selecionado, setSelecionado] = useState(0)
  const navegar = useNavigate()
  const idBase = useId()

  const resultados = useMemo(() => buscar(consulta), [consulta])
  const termos = useMemo(() => termosDe(consulta), [consulta])

  useEffect(() => {
    const d = dialogo.current
    if (!d) return
    if (aberta && !d.open) {
      setConsulta('')
      setSelecionado(0)
      d.showModal()
    } else if (!aberta && d.open) {
      d.close()
    }
  }, [aberta])

  // Mantém o item selecionado visível ao navegar com as setas.
  useEffect(() => {
    lista.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [selecionado])

  const abrir = (indice: number) => {
    const doc = resultados[indice]
    if (!doc) return
    onFechar()
    navegar(doc.caminho)
  }

  const aoTeclar = (e: KeyboardEvent<HTMLInputElement>) => {
    const total = resultados.length
    if (total === 0) return
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelecionado((i) => (i + 1) % total)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelecionado((i) => (i - 1 + total) % total)
        break
      case 'Home':
        if (e.ctrlKey) setSelecionado(0)
        break
      case 'End':
        if (e.ctrlKey) setSelecionado(total - 1)
        break
      case 'Enter':
        e.preventDefault()
        abrir(selecionado)
        break
    }
  }

  const idOpcao = (i: number) => `${idBase}-opcao-${i}`
  const idLista = `${idBase}-lista`

  return (
    <dialog
      ref={dialogo}
      className="busca"
      aria-label="Buscar no arquivo"
      onClose={onFechar}
      // Clique no fundo escurecido (fora do painel) fecha a busca.
      onClick={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div className="busca__campo">
        <IconeBusca />
        <input
          type="search"
          role="combobox"
          aria-expanded="true"
          aria-controls={idLista}
          aria-autocomplete="list"
          aria-activedescendant={resultados.length ? idOpcao(selecionado) : undefined}
          placeholder="Título, tag ou assunto…"
          value={consulta}
          onChange={(e) => {
            setConsulta(e.target.value)
            setSelecionado(0)
          }}
          onKeyDown={aoTeclar}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {resultados.length === 0 ? (
        <p className="busca__vazio" role="status">
          Nenhum registro encontrado para “{consulta}”.
        </p>
      ) : (
        <ul ref={lista} id={idLista} className="busca__lista" role="listbox" aria-label="Resultados">
          {resultados.map((doc, i) => (
            <li
              key={doc.id}
              id={idOpcao(i)}
              role="option"
              aria-selected={i === selecionado}
              className="busca__item"
              onMouseMove={() => setSelecionado(i)}
              onClick={() => abrir(i)}
            >
              <span className="busca__titulo">
                {destacar(doc.titulo, termos).map((p, k) => (p.destaque ? <mark key={k}>{p.trecho}</mark> : p.trecho))}
              </span>
              <span className="busca__meta">
                {reinoDe(doc).nome} · {ROTULO_TIPO[doc.tipo]}
                {doc.tags.length > 0 && ` · ${doc.tags.join(', ')}`}
              </span>
              {doc.resumo && <span className="busca__resumo">{doc.resumo}</span>}
            </li>
          ))}
        </ul>
      )}

      <p className="busca__dicas" aria-hidden="true">
        <span>
          <kbd>↑</kbd> <kbd>↓</kbd> navegar
        </span>
        <span>
          <kbd>Enter</kbd> abrir
        </span>
        <span>
          <kbd>Esc</kbd> fechar
        </span>
      </p>
    </dialog>
  )
}
