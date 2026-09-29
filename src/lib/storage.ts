import { useCallback, useState } from 'react'

/**
 * localStorage pode lançar exceção (modo privado, cookies bloqueados), então
 * toda leitura/escrita passa por aqui e falha em silêncio: a preferência
 * simplesmente não é lembrada, mas o site continua funcionando.
 */
const PREFIXO = 'velha-era:'

export function lerPreferencia<T>(chave: string, padrao: T): T {
  try {
    const bruto = localStorage.getItem(PREFIXO + chave)
    return bruto === null ? padrao : (JSON.parse(bruto) as T)
  } catch {
    return padrao
  }
}

export function salvarPreferencia(chave: string, valor: unknown): void {
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify(valor))
  } catch {
    /* sem armazenamento disponível: ignorar */
  }
}

/** useState que persiste o valor no localStorage. */
export function usePreferencia<T>(chave: string, padrao: T): [T, (valor: T | ((anterior: T) => T)) => void] {
  const [valor, setValor] = useState<T>(() => lerPreferencia(chave, padrao))
  const atualizar = useCallback(
    (novo: T | ((anterior: T) => T)) => {
      setValor((anterior) => {
        const proximo = typeof novo === 'function' ? (novo as (a: T) => T)(anterior) : novo
        salvarPreferencia(chave, proximo)
        return proximo
      })
    },
    [chave],
  )
  return [valor, atualizar]
}
