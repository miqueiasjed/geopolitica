import { useAuth } from './useAuth'

/**
 * Retorna true se o recurso booleano está habilitado no plano do usuário.
 * Admin sempre retorna true.
 */
export function useRecurso(chave: string): boolean {
  const { user } = useAuth()
  if (user?.role === 'admin') return true
  return user?.assinante?.recursos?.[chave] === 'true'
}

/**
 * Retorna o limite inteiro do recurso.
 * null = ilimitado, undefined = recurso não configurado.
 * Admin retorna null (ilimitado).
 */
export function useRecursoInteiro(chave: string): number | null | undefined {
  const { user } = useAuth()
  if (user?.role === 'admin') return null
  const recursos = user?.assinante?.recursos
  if (!recursos) return undefined
  if (!(chave in recursos)) return undefined
  const valor = recursos[chave]
  if (valor === null) return null
  return parseInt(valor, 10)
}

/**
 * Retorna o valor bruto (string | null) do recurso.
 */
export function useRecursoValor(chave: string): string | null | undefined {
  const { user } = useAuth()
  if (user?.role === 'admin') return null
  return user?.assinante?.recursos?.[chave]
}
