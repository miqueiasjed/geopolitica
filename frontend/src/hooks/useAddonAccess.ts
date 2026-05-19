import { useProdutos } from './useProdutos'

export function useAddonAccess(addonKey: string): boolean {
  const { data: produtos } = useProdutos()

  if (!produtos) return false

  const produto = produtos.find(p => p.chave === addonKey)
  return produto?.status_usuario === 'ativo'
}
