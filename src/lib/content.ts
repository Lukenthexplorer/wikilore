/**
 * Carregamento, validação e indexação do conteúdo da wiki.
 *
 * TODO o conteúdo vem de `content/<pasta-do-reino>/<documento>.md`. Nada aqui
 * lista arquivos à mão: `import.meta.glob` é resolvido pelo Vite em tempo de
 * build (e observado em modo dev), então criar um .md novo basta para ele
 * aparecer no site, sem tocar em código.
 *
 * Convenções:
 *   - pasta   `01-farlands/`   → reino com slug `farlands` (prefixo numérico é só ordenação)
 *   - arquivo `_reino.md`      → metadados do reino (o corpo vira a introdução da página do reino)
 *   - arquivo `arhto-keim.md`  → documento com slug `arhto-keim`
 *   - arquivos iniciados por `_` (além de `_reino.md`) são ignorados: servem de rascunho oculto
 */
import { separarFrontmatter } from './frontmatter'
import { normalizar, slugificar, tituloDoArquivo } from './text'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export const TIPOS = ['artigo', 'visao-geral', 'relatorio', 'linha-do-tempo'] as const
export type TipoDoc = (typeof TIPOS)[number]

export const STATUS = ['rascunho', 'canonico'] as const
export type StatusDoc = (typeof STATUS)[number]

export const ROTULO_TIPO: Record<TipoDoc, string> = {
  artigo: 'Artigo',
  'visao-geral': 'Visão geral',
  relatorio: 'Relatório',
  'linha-do-tempo': 'Linha do tempo',
}

export const ROTULO_STATUS: Record<StatusDoc, string> = {
  rascunho: 'Rascunho',
  canonico: 'Canônico',
}

export interface Documento {
  /** `reino/slug`, único em toda a wiki. */
  id: string
  slug: string
  reinoSlug: string
  /** Rota no site, ex.: `/farlands/arhto-keim`. */
  caminho: string
  /** Caminho do arquivo-fonte, útil nos avisos. */
  arquivo: string
  titulo: string
  ordem: number
  tipo: TipoDoc
  tags: string[]
  status: StatusDoc
  resumo?: string
  /** Data ISO (AAAA-MM-DD) usada em "atualizados recentemente". */
  atualizado?: string
  /** Número de registro exibido no cabeçalho dos relatórios. */
  registro?: string
  /** Markdown sem o frontmatter. */
  corpo: string
  /** Problemas de frontmatter encontrados; exibidos discretamente no documento. */
  avisos: string[]
}

export interface Reino {
  slug: string
  pasta: string
  caminho: string
  nome: string
  subtitulo?: string
  ordem: number
  introducao: string
  documentos: Documento[]
  avisos: string[]
}

// ---------------------------------------------------------------------------
// Leitura dos arquivos
// ---------------------------------------------------------------------------

/**
 * `eager: true` embute o texto de todos os .md no bundle. Para uma wiki de
 * texto isso é leve e dá navegação instantânea, além de permitir busca e
 * backlinks sem servidor. `query: '?raw'` entrega a string crua do arquivo.
 */
const arquivos = import.meta.glob<string>('/content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

// ---------------------------------------------------------------------------
// Validação de campos: cada leitor devolve um valor seguro e anota avisos.
// ---------------------------------------------------------------------------

type Avisos = string[]

function lerTexto(dados: Record<string, unknown>, campo: string, avisos: Avisos): string | undefined {
  const valor = dados[campo]
  if (valor === undefined || valor === null || valor === '') return undefined
  if (typeof valor === 'string') return valor.trim()
  if (typeof valor === 'number' || typeof valor === 'boolean') return String(valor)
  avisos.push(`Campo "${campo}" deveria ser um texto.`)
  return undefined
}

function lerNumero(dados: Record<string, unknown>, campo: string, avisos: Avisos): number | undefined {
  const valor = dados[campo]
  if (valor === undefined || valor === null || valor === '') return undefined
  const n = typeof valor === 'number' ? valor : Number(valor)
  if (Number.isFinite(n)) return n
  avisos.push(`Campo "${campo}" deveria ser um número (recebido: ${JSON.stringify(valor)}).`)
  return undefined
}

function lerOpcao<T extends string>(
  dados: Record<string, unknown>,
  campo: string,
  opcoes: readonly T[],
  padrao: T,
  avisos: Avisos,
): T {
  const bruto = lerTexto(dados, campo, avisos)
  if (bruto === undefined) return padrao
  // Normalizar permite escrever "canônico" ou "Canonico" indiferentemente.
  const valor = slugificar(bruto)
  const achado = opcoes.find((o) => o === valor)
  if (achado) return achado
  avisos.push(`Campo "${campo}" com valor desconhecido "${bruto}". Use: ${opcoes.join(', ')}.`)
  return padrao
}

function lerTags(dados: Record<string, unknown>, avisos: Avisos): string[] {
  const valor = dados.tags
  if (valor === undefined || valor === null) return []
  // Aceita tanto `tags: [a, b]` quanto `tags: a, b`.
  const lista = Array.isArray(valor) ? valor : typeof valor === 'string' ? valor.split(',') : null
  if (!lista) {
    avisos.push('Campo "tags" deveria ser uma lista, ex.: [fortaleza, prisão].')
    return []
  }
  return lista.map((t) => String(t).trim()).filter(Boolean)
}

function lerData(dados: Record<string, unknown>, campo: string, avisos: Avisos): string | undefined {
  const valor = dados[campo]
  if (valor === undefined || valor === null || valor === '') return undefined
  const texto = valor instanceof Date ? valor.toISOString().slice(0, 10) : String(valor).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto
  avisos.push(`Campo "${campo}" deveria estar no formato AAAA-MM-DD.`)
  return undefined
}

// ---------------------------------------------------------------------------
// Construção do índice (roda uma única vez, quando o módulo é carregado)
// ---------------------------------------------------------------------------

/** "/content/01-farlands/arhto-keim.md" → ["01-farlands", "arhto-keim"] */
function partesDoCaminho(caminho: string): [pasta: string, nome: string] | null {
  const relativo = caminho.replace(/^\/content\//, '')
  const partes = relativo.split('/')
  // Arquivos soltos na raiz de content/ não pertencem a nenhum reino.
  if (partes.length < 2) return null
  const pasta = partes[0]!
  const nome = partes[partes.length - 1]!.replace(/\.md$/i, '')
  return [pasta, nome]
}

function criarReino(pasta: string): Reino {
  const semPrefixo = pasta.replace(/^\d+[-_.\s]*/, '')
  const slug = slugificar(semPrefixo) || slugificar(pasta)
  const prefixo = /^(\d+)/.exec(pasta)?.[1]
  return {
    slug,
    pasta,
    caminho: `/${slug}`,
    // Valores provisórios; substituídos pelo _reino.md quando existir.
    nome: tituloDoArquivo(semPrefixo || pasta),
    ordem: prefixo ? Number(prefixo) : Number.MAX_SAFE_INTEGER,
    introducao: '',
    documentos: [],
    avisos: [],
  }
}

function aplicarMetadadosDoReino(reino: Reino, raw: string, arquivo: string): void {
  const { dados, corpo, erro } = separarFrontmatter(raw)
  const avisos: Avisos = erro ? [erro] : []
  reino.nome = lerTexto(dados, 'nome', avisos) ?? reino.nome
  reino.subtitulo = lerTexto(dados, 'subtitulo', avisos)
  reino.ordem = lerNumero(dados, 'ordem', avisos) ?? reino.ordem
  reino.introducao = corpo.trim()
  reino.avisos.push(...avisos.map((a) => `${arquivo}: ${a}`))
}

function criarDocumento(reino: Reino, nome: string, raw: string, arquivo: string): Documento {
  const { dados, corpo, erro } = separarFrontmatter(raw)
  const avisos: Avisos = erro ? [erro] : []

  let titulo = lerTexto(dados, 'titulo', avisos)
  if (!titulo) {
    titulo = tituloDoArquivo(nome)
    if (!erro) avisos.push('Campo "titulo" ausente; usando o nome do arquivo.')
  }

  const slug = slugificar(nome)
  return {
    id: `${reino.slug}/${slug}`,
    slug,
    reinoSlug: reino.slug,
    caminho: `/${reino.slug}/${slug}`,
    arquivo,
    titulo,
    ordem: lerNumero(dados, 'ordem', avisos) ?? Number.MAX_SAFE_INTEGER,
    tipo: lerOpcao(dados, 'tipo', TIPOS, 'artigo', avisos),
    tags: lerTags(dados, avisos),
    status: lerOpcao(dados, 'status', STATUS, 'rascunho', avisos),
    resumo: lerTexto(dados, 'resumo', avisos),
    atualizado: lerData(dados, 'atualizado', avisos),
    registro: lerTexto(dados, 'registro', avisos),
    corpo,
    avisos,
  }
}

/** Ordem pelo campo `ordem`; empate → alfabética, respeitando acentos do português. */
function comparar(a: { ordem: number; nome: string }, b: { ordem: number; nome: string }): number {
  return a.ordem - b.ordem || a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
}

function construirIndice(): Reino[] {
  const porPasta = new Map<string, Reino>()
  const comMetadados = new Set<string>()
  const obterReino = (pasta: string): Reino => {
    let reino = porPasta.get(pasta)
    if (!reino) {
      reino = criarReino(pasta)
      porPasta.set(pasta, reino)
    }
    return reino
  }

  // Ordena os caminhos para que o resultado não dependa da ordem do glob.
  for (const arquivo of Object.keys(arquivos).sort()) {
    const raw = arquivos[arquivo] ?? ''
    const partes = partesDoCaminho(arquivo)
    if (!partes) {
      console.warn(`[conteúdo] Ignorado (fora de uma pasta de reino): ${arquivo}`)
      continue
    }
    const [pasta, nome] = partes
    const reino = obterReino(pasta)

    if (nome === '_reino') {
      aplicarMetadadosDoReino(reino, raw, arquivo)
      comMetadados.add(pasta)
    } else if (!nome.startsWith('_')) {
      reino.documentos.push(criarDocumento(reino, nome, raw, arquivo))
    }
  }

  const reinos = [...porPasta.values()]
  for (const reino of reinos) {
    if (!comMetadados.has(reino.pasta)) {
      reino.avisos.push(`A pasta "${reino.pasta}" não tem _reino.md; usando o nome da pasta.`)
    }
    reino.documentos.sort((a, b) => comparar({ ordem: a.ordem, nome: a.titulo }, { ordem: b.ordem, nome: b.titulo }))
    garantirSlugsUnicos(reino)
  }

  reinos.sort(comparar)
  garantirReinosUnicos(reinos)
  return reinos
}

/** Dois arquivos que viram o mesmo slug (ex.: "Helland.md" e "helland.md") não podem colidir. */
function garantirSlugsUnicos(reino: Reino): void {
  const vistos = new Set<string>()
  for (const doc of reino.documentos) {
    let slug = doc.slug
    for (let n = 2; vistos.has(slug); n++) slug = `${doc.slug}-${n}`
    if (slug !== doc.slug) {
      doc.avisos.push(`Outro arquivo já usa o endereço "${doc.slug}"; este ficou em "${slug}".`)
      doc.slug = slug
      doc.id = `${reino.slug}/${slug}`
      doc.caminho = `/${reino.slug}/${slug}`
    }
    vistos.add(slug)
  }
}

function garantirReinosUnicos(reinos: Reino[]): void {
  const vistos = new Set<string>()
  for (const reino of reinos) {
    let slug = reino.slug
    for (let n = 2; vistos.has(slug); n++) slug = `${reino.slug}-${n}`
    if (slug !== reino.slug) {
      reino.avisos.push(`Outra pasta já usa o endereço "${reino.slug}"; esta ficou em "${slug}".`)
      reino.slug = slug
      reino.caminho = `/${slug}`
      for (const doc of reino.documentos) {
        doc.reinoSlug = slug
        doc.id = `${slug}/${doc.slug}`
        doc.caminho = `/${slug}/${doc.slug}`
      }
    }
    vistos.add(slug)
  }
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

export const reinos: readonly Reino[] = construirIndice()

export const documentos: readonly Documento[] = reinos.flatMap((r) => r.documentos)

const reinoPorSlug = new Map(reinos.map((r) => [r.slug, r]))
const documentoPorId = new Map(documentos.map((d) => [d.id, d]))

export function encontrarReino(slug: string): Reino | undefined {
  return reinoPorSlug.get(slug)
}

export function encontrarDocumento(reinoSlug: string, slug: string): Documento | undefined {
  return documentoPorId.get(`${reinoSlug}/${slug}`)
}

export function reinoDe(doc: Documento): Reino {
  // Todo documento nasce dentro de um reino, então a busca nunca falha.
  return reinoPorSlug.get(doc.reinoSlug)!
}

/** Documentos com data `atualizado`, do mais recente para o mais antigo. */
export function atualizadosRecentemente(limite = 6): Documento[] {
  return documentos
    .filter((d) => d.atualizado)
    .sort((a, b) => b.atualizado!.localeCompare(a.atualizado!) || a.titulo.localeCompare(b.titulo, 'pt-BR'))
    .slice(0, limite)
}

/** Títulos repetidos tornam [[wikilinks]] ambíguos; avisamos nos dois documentos. */
;(function avisarTitulosDuplicados() {
  const porTitulo = new Map<string, Documento[]>()
  for (const doc of documentos) {
    const chave = normalizar(doc.titulo)
    porTitulo.set(chave, [...(porTitulo.get(chave) ?? []), doc])
  }
  for (const grupo of porTitulo.values()) {
    if (grupo.length < 2) continue
    for (const doc of grupo) {
      const outros = grupo.filter((d) => d !== doc).map((d) => d.arquivo)
      doc.avisos.push(`Título idêntico ao de ${outros.join(', ')}; [[links]] para ele podem ir ao documento errado.`)
    }
  }
})()

if (import.meta.env.DEV) {
  for (const r of reinos) r.avisos.forEach((a) => console.warn(`[conteúdo] ${a}`))
  for (const d of documentos) d.avisos.forEach((a) => console.warn(`[conteúdo] ${d.arquivo}: ${a}`))
}
