/**
 * Parsers dos blocos especiais escritos como código cercado:
 *
 *   ```timeline            ```infobox
 *   Ano 12 | Evento        # Título opcional
 *   Ano 40 | Evento        ![[retrato.jpg|Legenda opcional]]
 *   ```                    Chave: Valor
 *                          ```
 *
 * São formatos de linha simples de propósito: fáceis de escrever à mão e
 * tolerantes a erro (linhas fora do padrão não quebram nada).
 */

export interface MarcoTimeline {
  ano: string
  evento: string
}

export function lerTimeline(fonte: string): MarcoTimeline[] {
  return linhasUteis(fonte).map((linha) => {
    const i = linha.indexOf('|')
    // Sem "|", a linha inteira é o evento (marco sem data).
    if (i === -1) return { ano: '', evento: linha }
    return { ano: linha.slice(0, i).trim(), evento: linha.slice(i + 1).trim() }
  })
}

export interface Infobox {
  titulo?: string
  /** Imagem de topo (retrato, brasão, mapa), como nas fichas de enciclopédia. */
  imagem?: { src: string; legenda: string }
  campos: { chave: string; valor: string }[]
}

export function lerInfobox(fonte: string): Infobox {
  const infobox: Infobox = { campos: [] }
  for (const linha of linhasUteis(fonte)) {
    if (linha.startsWith('#')) {
      infobox.titulo = linha.replace(/^#+\s*/, '')
      continue
    }
    // Linha de imagem. Chega aqui como ![legenda](<arquivo>): o ![[arquivo|legenda]]
    // do autor já foi convertido em lib/wikilinks.ts.
    const imagem = /^!\[([^\]]*)\]\(<?([^>)]+)>?\)$/.exec(linha)
    if (imagem) {
      infobox.imagem = { legenda: imagem[1]!.trim(), src: imagem[2]!.trim() }
      continue
    }
    // Divide só no primeiro ":" para permitir valores como "12:30" ou URLs.
    const i = linha.indexOf(':')
    if (i === -1) infobox.campos.push({ chave: linha, valor: '' })
    else infobox.campos.push({ chave: linha.slice(0, i).trim(), valor: linha.slice(i + 1).trim() })
  }
  return infobox
}

function linhasUteis(fonte: string): string[] {
  return fonte
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}
