/** Utilitários de texto compartilhados entre índice, busca e wikilinks. */

/**
 * Forma canônica para comparar textos: sem acentos, minúsculo e com espaços
 * colapsados. É o que permite [[fortaleza e prisao de helland]] encontrar
 * "Fortaleza e Prisão de Helland".
 */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Converte um nome de arquivo/pasta em trecho de URL seguro. */
export function slugificar(texto: string): string {
  return normalizar(texto)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** "fortaleza-helland" → "Fortaleza helland" (usado quando falta o título). */
export function tituloDoArquivo(nome: string): string {
  const limpo = nome.replace(/[-_]+/g, ' ').trim()
  return limpo.charAt(0).toUpperCase() + limpo.slice(1)
}
