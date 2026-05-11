export const TOKEN_STORAGE_KEY = 'auth_token'
export const TOKEN_STORAGE_KEY_LEGADO = 'gpi_token'
export const USER_CACHE_KEY = 'auth_user'
export const EVENTO_TOKEN_ATUALIZADO = 'auth-token-atualizado'

export function obterTokenAutenticacao() {
  return localStorage.getItem(TOKEN_STORAGE_KEY) ?? localStorage.getItem(TOKEN_STORAGE_KEY_LEGADO)
}

export function salvarTokenAutenticacao(token: string) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
  localStorage.setItem(TOKEN_STORAGE_KEY_LEGADO, token)
  window.dispatchEvent(new Event(EVENTO_TOKEN_ATUALIZADO))
}

export function removerTokenAutenticacao() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(TOKEN_STORAGE_KEY_LEGADO)
  localStorage.removeItem(USER_CACHE_KEY)
  window.dispatchEvent(new Event(EVENTO_TOKEN_ATUALIZADO))
}

export function salvarUsuarioCache(usuario: unknown) {
  localStorage.setItem(USER_CACHE_KEY, JSON.stringify(usuario))
}

export function obterUsuarioCache<T>(): T | null {
  const raw = localStorage.getItem(USER_CACHE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function removerUsuarioCache() {
  localStorage.removeItem(USER_CACHE_KEY)
}
