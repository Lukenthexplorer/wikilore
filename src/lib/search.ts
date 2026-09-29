/**
 * Busca em memória sobre título, tags, resumo e reino.
 *
 * A wiki inteira já está no bundle, então um índice pré-normalizado e uma
 * pontuação simples bastam: nada de biblioteca de busca nem servidor.
 */
import { documentos, reinoDe, type Documento } from './content'
import { normalizar } from './text'

interface Entrada {
  doc: Documento
  titulo: string
  tags: string[]
  resumo: string
  reino: string
}

const indice: Entrada[] = documentos.map((doc) => ({
  doc,
  titulo: normalizar(doc.titulo),
  tags: doc.tags.map(normalizar),
  resumo: normalizar(doc.resumo ?? ''),
  reino: normalizar(reinoDe(doc).nome),
}))

/** Pontua um termo; 0 = não encontrado. Título pesa mais que tag, que pesa mais que resumo. */
function pontuar(e: Entrada, termo: string): number {
  if (e.titulo.startsWith(termo)) return 100
  if (e.titulo.split(/[^a-z0-9]+/).some((p) => p.startsWith(termo))) return 70
  if (e.titulo.includes(termo)) return 50
  if (e.tags.some((t) => t === termo)) return 45
  if (e.tags.some((t) => t.startsWith(termo))) return 35
  if (e.resumo.includes(termo)) return 15
  if (e.reino.startsWith(termo)) return 10
  return 0
}

export function termosDe(consulta: string): string[] {
  return normalizar(consulta).split(' ').filter(Boolean)
}

/**
 * Todos os termos precisam aparecer em algum campo. Consulta vazia devolve
 * todos os documentos na ordem da sidebar, útil para navegar só pelo teclado.
 */
export function buscar(consulta: string, limite = 30): Documento[] {
  const termos = termosDe(consulta)
  if (termos.length === 0) return documentos.slice(0, limite)

  const resultados: { doc: Documento; pontos: number }[] = []
  for (const entrada of indice) {
    let pontos = 0
    for (const termo of termos) {
      const p = pontuar(entrada, termo)
      if (p === 0) {
        pontos = 0
        break
      }
      pontos += p
    }
    if (pontos > 0) resultados.push({ doc: entrada.doc, pontos })
  }
  return resultados
    .sort((a, b) => b.pontos - a.pontos || a.doc.titulo.localeCompare(b.doc.titulo, 'pt-BR'))
    .slice(0, limite)
    .map((r) => r.doc)
}

/**
 * Divide `texto` em trechos marcando onde os termos aparecem, ignorando acentos
 * ("prisao" destaca "Prisão"). Normalizamos caractere a caractere para manter
 * a correspondência de posições com o texto original.
 */
export function destacar(texto: string, termos: string[]): { trecho: string; destaque: boolean }[] {
  if (termos.length === 0) return [{ trecho: texto, destaque: false }]
  const chars = [...texto]
  const normal = chars.map((c) => normalizar(c) || c).join('')
  // Mapa: índice no texto normalizado → índice no array original.
  const mapa: number[] = []
  chars.forEach((c, i) => {
    const n = normalizar(c) || c
    for (let k = 0; k < n.length; k++) mapa.push(i)
  })

  const marcado = new Array<boolean>(chars.length).fill(false)
  for (const termo of termos) {
    let pos = normal.indexOf(termo)
    while (pos !== -1) {
      for (let k = pos; k < pos + termo.length; k++) marcado[mapa[k]!] = true
      pos = normal.indexOf(termo, pos + termo.length)
    }
  }

  const partes: { trecho: string; destaque: boolean }[] = []
  chars.forEach((c, i) => {
    const ultimo = partes[partes.length - 1]
    if (ultimo && ultimo.destaque === marcado[i]) ultimo.trecho += c
    else partes.push({ trecho: c, destaque: marcado[i]! })
  })
  return partes
}
