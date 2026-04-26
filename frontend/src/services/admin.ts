import api from '../lib/axios'
import type {
  AdminAssinante,
  AdminAssinantesFiltros,
  AdminConteudosResponse,
  AdminWebhookEvento,
  AdminWebhookEventosFiltros,
  AdminUsuario,
  AdminUsuarioDetalhe,
  AdminUsuariosFiltros,
  AtualizarUsuarioPayload,
  CriarUsuarioPayload,
  PaginacaoLaravel,
} from '../types/admin'
import type { TipoConteudo, PlanoMinimo, Conteudo } from '../types/biblioteca'
import type { EmpresaB2B, CriarLicencaPayload, RenovarLicencaPayload } from '../types/b2b'

export interface CriarConteudoPayload {
  tipo: TipoConteudo
  titulo: string
  tese_manchete?: string
  regiao?: string
  tags?: string[]
  resumo?: string
  plano_minimo: PlanoMinimo
  corpo: string
  publicado: boolean
}

const ITENS_POR_PAGINA = 25

export const adminKeys = {
  all: ['admin'] as const,
  assinantes: (filtros: AdminAssinantesFiltros) => [...adminKeys.all, 'assinantes', filtros] as const,
  webhookEventos: (filtros: AdminWebhookEventosFiltros) => [...adminKeys.all, 'webhook-eventos', filtros] as const,
  conteudos: (page: number) => [...adminKeys.all, 'conteudos', page] as const,
  b2bEmpresas: () => [...adminKeys.all, 'b2b', 'empresas'] as const,
  usuarios: (filtros: AdminUsuariosFiltros) => [...adminKeys.all, 'usuarios', filtros] as const,
  usuario: (id: number) => [...adminKeys.all, 'usuarios', id] as const,
}

function montarParams<T extends object>(filtros: T) {
  const params = new URLSearchParams()

  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor === undefined || valor === '') {
      return
    }

    params.set(chave, String(valor))
  })

  params.set('per_page', String(ITENS_POR_PAGINA))

  return params
}

export async function buscarAdminAssinantes(
  filtros: AdminAssinantesFiltros,
): Promise<PaginacaoLaravel<AdminAssinante>> {
  const resposta = await api.get<PaginacaoLaravel<AdminAssinante>>('/admin/assinantes', {
    params: montarParams(filtros),
  })

  return resposta.data
}

export async function buscarAdminWebhookEventos(
  filtros: AdminWebhookEventosFiltros,
): Promise<PaginacaoLaravel<AdminWebhookEvento>> {
  const resposta = await api.get<PaginacaoLaravel<AdminWebhookEvento>>('/admin/webhook-eventos', {
    params: montarParams(filtros),
  })

  return resposta.data
}

export async function criarConteudo(payload: CriarConteudoPayload): Promise<Conteudo> {
  const resposta = await api.post<Conteudo>('/admin/conteudos', payload)

  return resposta.data
}

export async function fetchConteudosAdmin(page: number): Promise<AdminConteudosResponse> {
  const resposta = await api.get<AdminConteudosResponse>('/admin/conteudos', {
    params: { page },
  })

  return resposta.data
}

export async function despublicarConteudo(id: number): Promise<void> {
  await api.delete(`/admin/conteudos/${id}`)
}

// --- Usuários Admin ---

export async function criarAdminUsuario(payload: CriarUsuarioPayload): Promise<AdminUsuario> {
  const resposta = await api.post<{ usuario: AdminUsuario }>('/admin/usuarios', payload)
  return resposta.data.usuario
}

export async function buscarAdminUsuarios(
  filtros: AdminUsuariosFiltros,
): Promise<PaginacaoLaravel<AdminUsuario>> {
  const resposta = await api.get<PaginacaoLaravel<AdminUsuario>>('/admin/usuarios', {
    params: montarParams(filtros),
  })
  return resposta.data
}

export async function buscarAdminUsuario(id: number): Promise<AdminUsuarioDetalhe> {
  const resposta = await api.get<AdminUsuarioDetalhe>(`/admin/usuarios/${id}`)
  return resposta.data
}

export async function atualizarAdminUsuario(
  id: number,
  payload: AtualizarUsuarioPayload,
): Promise<AdminUsuario> {
  const resposta = await api.patch<{ usuario: AdminUsuario }>(`/admin/usuarios/${id}`, payload)
  return resposta.data.usuario
}

export async function excluirAdminUsuario(id: number): Promise<void> {
  await api.delete(`/admin/usuarios/${id}`)
}

// --- B2B Admin ---

export async function fetchAdminB2BEmpresas(): Promise<EmpresaB2B[]> {
  const resposta = await api.get<EmpresaB2B[]>('/admin/b2b/empresas')
  return resposta.data
}

export async function criarLicencaB2B(payload: CriarLicencaPayload): Promise<EmpresaB2B> {
  const resposta = await api.post<EmpresaB2B>('/admin/b2b/empresas', payload)
  return resposta.data
}

export async function renovarLicencaB2B(id: number, payload: RenovarLicencaPayload): Promise<EmpresaB2B> {
  const resposta = await api.post<EmpresaB2B>(`/admin/b2b/empresas/${id}/renovar`, payload)
  return resposta.data
}
