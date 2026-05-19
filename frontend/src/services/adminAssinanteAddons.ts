import api from '../lib/axios'
import type {
  AssinanteAddon,
  AdicionarAddonPayload,
  AtualizarAddonPayload,
} from '../types/produto'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const adminAssinanteAddonsKeys = {
  all: ['admin', 'assinante-addons'] as const,
  porUsuario: (userId: number) => [...adminAssinanteAddonsKeys.all, userId] as const,
}

// ─── Funções de API ───────────────────────────────────────────────────────────

export const adminAssinanteAddons = {
  listar: (userId: number): Promise<AssinanteAddon[]> =>
    api
      .get<AssinanteAddon[]>(`/admin/assinantes/${userId}/addons`)
      .then(r => r.data),

  adicionar: (userId: number, payload: AdicionarAddonPayload): Promise<AssinanteAddon> =>
    api
      .post<AssinanteAddon>(`/admin/assinantes/${userId}/addons`, payload)
      .then(r => r.data),

  atualizar: (
    userId: number,
    addonId: number,
    payload: AtualizarAddonPayload,
  ): Promise<AssinanteAddon> =>
    api
      .put<AssinanteAddon>(`/admin/assinantes/${userId}/addons/${addonId}`, payload)
      .then(r => r.data),

  remover: (userId: number, addonId: number): Promise<void> =>
    api
      .delete(`/admin/assinantes/${userId}/addons/${addonId}`)
      .then(() => undefined),
}
