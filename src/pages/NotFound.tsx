import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  useEffect(() => {
    document.title = 'Registro não encontrado · Arquivo da Velha Era'
  }, [])

  return (
    <div className="pagina pagina--estreita">
      <p className="sobretitulo">Registro não encontrado</p>
      <h1 className="pagina__titulo">Esta página não consta no arquivo</h1>
      <p className="prosa">
        O endereço pode ter mudado, ou o documento ainda não foi escrito. <Link to="/">Voltar à capa do arquivo</Link>.
      </p>
    </div>
  )
}
