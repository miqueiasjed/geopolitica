import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import type { Produto, StatusAddonUsuario } from '../types/produto'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const produtosKeys = {
  all: ['meus-produtos'] as const,
}

// ─── Função de fetch ──────────────────────────────────────────────────────────

async function fetchMeusProdutos(): Promise<Produto[]> {
  const res = await api.get<Produto[]>('/meus-produtos')
  return res.data
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useProdutos() {
  return useQuery({
    queryKey: produtosKeys.all,
    queryFn: fetchMeusProdutos,
    staleTime: 0,
  })
}

// ─── Helpers de CTA ───────────────────────────────────────────────────────────

/**
 * Retorna o link correto para o CTA baseado no status atual do usuário.
 * Retorna null quando ambos os links são null (botão desabilitado).
 */
export function resolveLinkCta(produto: Produto): string | null {
  switch (produto.status_usuario) {
    case 'cancelado':
      return produto.link_reativar ?? produto.link_compra
    case 'expirado':
      return produto.link_compra ?? produto.link_reativar
    case 'reembolsado':
      return produto.link_compra
    case 'ativo':
    case null:
    default:
      return produto.link_compra
  }
}

/**
 * Retorna o label correto para o botão de CTA baseado no status do addon.
 */
export function resolveLabelCta(status: StatusAddonUsuario): string {
  switch (status) {
    case 'cancelado':
      return 'Reativar'
    case 'expirado':
      return 'Renovar'
    case 'reembolsado':
      return 'Assinar'
    case 'ativo':
    case null:
    default:
      return 'Adicionar'
  }
}
