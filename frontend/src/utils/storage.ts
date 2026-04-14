export const TOKEN_STORAGE_KEY = 'auth_token'
export const TOKEN_STORAGE_KEY_LEGADO = 'gpi_token'
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
  window.dispatchEvent(new Event(EVENTO_TOKEN_ATUALIZADO))
}
