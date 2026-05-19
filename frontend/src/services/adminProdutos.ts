import api from '../lib/axios'
import type {
  AdminProduto,
  CriarProdutoPayload,
  AtualizarProdutoPayload,
} from '../types/produto'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const adminProdutosKeys = {
  all: ['admin', 'produtos'] as const,
  lista: () => [...adminProdutosKeys.all] as const,
}

// ─── Funções de API ───────────────────────────────────────────────────────────

export const adminProdutos = {
  listar: (): Promise<AdminProduto[]> =>
    api.get<AdminProduto[]>('/admin/produtos').then(r => r.data),

  criar: (payload: CriarProdutoPayload): Promise<AdminProduto> =>
    api.post<AdminProduto>('/admin/produtos', payload).then(r => r.data),

  atualizar: (id: number, payload: AtualizarProdutoPayload): Promise<AdminProduto> =>
    api.put<AdminProduto>(`/admin/produtos/${id}`, payload).then(r => r.data),

  excluir: (id: number): Promise<void> =>
    api.delete(`/admin/produtos/${id}`).then(() => undefined),

  importarAddons: (
    arquivo: File,
  ): Promise<{ importados: number; erros: Array<{ linha: number; motivo: string }> }> => {
    const form = new FormData()
    form.append('arquivo', arquivo)
    return api
      .post<{ importados: number; erros: Array<{ linha: number; motivo: string }> }>(
        '/admin/assinantes/addons/importar',
        form,
      )
      .then(r => r.data)
  },

  exportarAddons: (): Promise<Blob> =>
    api
      .get<Blob>('/admin/assinantes/addons/exportar', { responseType: 'blob' })
      .then(r => r.data),
}
