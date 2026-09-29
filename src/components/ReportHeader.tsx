import type { Documento, Reino } from '../lib/content'

/**
 * Número de registro estável para relatórios sem o campo `registro`:
 * derivado do endereço do documento, então não muda entre builds.
 */
function registroPadrao(id: string): string {
  let hash = 0
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return `AI-${String(hash % 10000).padStart(4, '0')}`
}

/** Cabeçalho de documento oficial para `tipo: relatorio`. */
export default function ReportHeader({ doc, reino }: { doc: Documento; reino: Reino }) {
  return (
    <div className="oficio">
      <p className="oficio__linha">
        <span>Arquivo Imperial</span>
        <span>
          Registro nº <strong>{doc.registro ?? registroPadrao(doc.id)}</strong>
        </span>
        <span>{reino.nome}</span>
      </p>
      <span className="carimbo" aria-hidden="true">
        Registrado
      </span>
    </div>
  )
}
