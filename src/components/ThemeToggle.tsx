import { useEffect, useState } from 'react'
import { lerPreferencia, salvarPreferencia } from '../lib/storage'
import { IconeVela } from './Icons'

type Tema = 'papel' | 'vela'

/** Tema efetivo: escolha salva, senão a preferência do sistema. */
function temaInicial(): Tema {
  const salvo = lerPreferencia<Tema | null>('tema', null)
  if (salvo === 'papel' || salvo === 'vela') return salvo
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'vela' : 'papel'
}

/** Alterna entre papel (claro) e "à luz de vela" (noturno). */
export default function ThemeToggle() {
  const [tema, setTema] = useState<Tema>(temaInicial)

  useEffect(() => {
    document.documentElement.dataset.tema = tema
  }, [tema])

  const alternar = () => {
    const proximo: Tema = tema === 'vela' ? 'papel' : 'vela'
    salvarPreferencia('tema', proximo)
    setTema(proximo)
  }

  return (
    <button type="button" className="tema-toggle" aria-pressed={tema === 'vela'} onClick={alternar}>
      <IconeVela />
      <span>À luz de vela</span>
    </button>
  )
}
