import api from '../lib/axios'
import type {
  AdminProduto,
  CriarProdutoPayload,
  AtualizarProdutoPayload,
  ProdutoAssinantes,
} from '../types/produto'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const adminProdutosKeys = {
  all: ['admin', 'produtos'] as const,
  lista: () => [...adminProdutosKeys.all] as const,
  assinantes: (id: number) => [...adminProdutosKeys.all, id, 'assinantes'] as const,
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

  listarAssinantes: (id: number): Promise<ProdutoAssinantes> =>
    api.get<ProdutoAssinantes>(`/admin/produtos/${id}/assinantes`).then(r => r.data),

  importarAddons: (
    arquivo: File,
    planoPadrao?: string,
  ): Promise<
    | { importados: number; criados: number; erros: Array<{ linha: number; motivo: string }> }
    | { job_id: string; mensagem: string }
  > => {
    const form = new FormData()
    form.append('arquivo', arquivo)
    if (planoPadrao) form.append('plano_padrao', planoPadrao)
    return api
      .post<
        | { importados: number; criados: number; erros: Array<{ linha: number; motivo: string }> }
        | { job_id: string; mensagem: string }
      >('/admin/assinantes/addons/importar', form)
      .then(r => r.data)
  },

  statusImportacaoAddons: (jobId: string): Promise<{
    status: 'processando' | 'concluido' | 'erro' | 'nao_encontrado'
    total?: number
    processados?: number
    importados?: number
    criados?: number
    erros?: Array<{ linha: number; motivo: string }>
    mensagem?: string
  }> =>
    api.get(`/admin/assinantes/addons/importar/${jobId}/status`).then(r => r.data),

  exportarAddons: (): Promise<Blob> =>
    api
      .get<Blob>('/admin/assinantes/addons/exportar', { responseType: 'blob' })
      .then(r => r.data),
}
