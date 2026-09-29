import type { ReactNode } from 'react'

/**
 * Ícones em SVG inline, desenhados com traço fino para combinar com a gravura
 * tipográfica. `currentColor` herda a cor do contexto (bronze, selo etc.).
 */
interface IconeProps {
  className?: string
}

function Svg({ className, children }: IconeProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

export const IconeChevron = (p: IconeProps) => (
  <Svg {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
)

export const IconePasta = (p: IconeProps) => (
  <Svg {...p}>
    <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2h9A1.5 1.5 0 0 1 21 9.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z" />
  </Svg>
)

export const IconeMenu = (p: IconeProps) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
)

export const IconeFechar = (p: IconeProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
)

export const IconeBusca = (p: IconeProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </Svg>
)

/** Vela: alterna o modo noturno. */
export const IconeVela = (p: IconeProps) => (
  <Svg {...p}>
    <path d="M12 3c1.6 1.8 1.6 3.4 0 4.6-1.6-1.2-1.6-2.8 0-4.6z" />
    <path d="M9 10h6v10H9z" />
    <path d="M6.5 20h11" />
  </Svg>
)

/** Pena: nota do arquivista. */
export const IconeNota = (p: IconeProps) => (
  <Svg {...p}>
    <path d="M20 4c-7 1-11 5-13 12l-2 4" />
    <path d="M20 4c-1 6-4 10-10 12" />
    <path d="M9 12h5" />
  </Svg>
)

/** Triângulo: aviso. */
export const IconeAviso = (p: IconeProps) => (
  <Svg {...p}>
    <path d="M12 4l9 16H3z" />
    <path d="M12 10v4.5M12 17.5v.01" />
  </Svg>
)

/** Selo de lacre: segredo. */
export const IconeSecreto = (p: IconeProps) => (
  <Svg {...p}>
    <circle cx="12" cy="11" r="6" />
    <path d="M9.5 16.5L8 21l4-1.5 4 1.5-1.5-4.5" />
    <path d="M10 11h4" />
  </Svg>
)
