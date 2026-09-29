import { parse } from 'yaml'

/**
 * Separa o frontmatter YAML do corpo Markdown.
 *
 * Por que não usar gray-matter? Ele foi escrito para Node: depende de `Buffer`
 * (inexistente no navegador) e traz um motor que usa `eval`, o que gera avisos no
 * build do Vite. Como só precisamos de "--- yaml --- corpo", o pacote `yaml`
 * resolve o mesmo problema sem polyfills.
 *
 * Nunca lança exceção: um YAML quebrado vira um aviso e o documento segue
 * sendo exibido com valores padrão.
 */
export interface FrontmatterResult {
  dados: Record<string, unknown>
  corpo: string
  erro?: string
}

// Aceita BOM no início e quebras de linha do Windows.
const BLOCO = /^﻿?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/

export function separarFrontmatter(raw: string): FrontmatterResult {
  const match = BLOCO.exec(raw)
  if (!match) {
    return { dados: {}, corpo: raw, erro: 'Documento sem frontmatter (bloco --- no topo).' }
  }

  const corpo = raw.slice(match[0].length)
  try {
    const dados: unknown = parse(match[1] ?? '')
    if (dados === null || dados === undefined) return { dados: {}, corpo }
    if (typeof dados !== 'object' || Array.isArray(dados)) {
      return { dados: {}, corpo, erro: 'O frontmatter precisa ser uma lista de pares "chave: valor".' }
    }
    return { dados: dados as Record<string, unknown>, corpo }
  } catch (e) {
    const detalhe = e instanceof Error ? e.message.split('\n')[0] : String(e)
    return { dados: {}, corpo, erro: `Frontmatter com YAML inválido: ${detalhe}` }
  }
}
