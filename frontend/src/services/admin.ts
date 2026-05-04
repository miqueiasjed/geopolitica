import api from '../lib/axios'
import type {
  AdminAssinante,
  AdminAssinantesFiltros,
  AdminConteudosResponse,
  AdminWebhookEvento,
  AdminWebhookEventosFiltros,
  AdminWebhookOfferPlano,
  CriarWebhookOfferPlanoPayload,
  AdminWebhookToken,
  CriarWebhookTokenPayload,
  AdminUsuario,
  AdminUsuarioDetalhe,
  AdminUsuariosFiltros,
  AtualizarUsuarioPayload,
  CriarUsuarioPayload,
  ImportacaoAssinantesPayload,
  ImportacaoAssinantesResponse,
  ImportacaoAssinantesStatus,
  PaginacaoLaravel,
  AdminCriseHistorica,
  CriarCrisePayload,
  AdminPerfilPais,
  CriarPerfilPaisPayload,
  AtualizarPerfilPaisPayload,
  AdminSource,
  CriarSourcePayload,
  AtualizarSourcePayload,
} from '../types/admin'
import type { TipoConteudo, PlanoMinimo, VerticalConteudo, Conteudo } from '../types/biblioteca'
import type { EmpresaB2B, CriarLicencaPayload, RenovarLicencaPayload } from '../types/b2b'

export interface CriarConteudoPayload {
  tipo: TipoConteudo
  titulo: string
  tese_manchete?: string
  regiao?: string
  tags?: string[]
  resumo?: string
  plano_minimo: PlanoMinimo
  vertical_conteudo?: VerticalConteudo | null
  corpo: string
  publicado: boolean
}

const ITENS_POR_PAGINA = 25

export const adminKeys = {
  all: ['admin'] as const,
  assinantes: (filtros: AdminAssinantesFiltros) => [...adminKeys.all, 'assinantes', filtros] as const,
  webhookEventos: (filtros: AdminWebhookEventosFiltros) => [...adminKeys.all, 'webhook-eventos', filtros] as const,
  webhookTokens: () => [...adminKeys.all, 'webhook-tokens'] as const,
  webhookOfferPlanos: () => [...adminKeys.all, 'webhook-offer-planos'] as const,
  planosAtivos: () => [...adminKeys.all, 'planos-ativos'] as const,
  conteudos: (page: number) => [...adminKeys.all, 'conteudos', page] as const,
  b2bEmpresas: () => [...adminKeys.all, 'b2b', 'empresas'] as const,
  usuarios: (filtros: AdminUsuariosFiltros) => [...adminKeys.all, 'usuarios', filtros] as const,
  usuario: (id: number) => [...adminKeys.all, 'usuarios', id] as const,
  crises: () => [...adminKeys.all, 'crises'] as const,
  paises: () => [...adminKeys.all, 'paises'] as const,
  sources: () => [...adminKeys.all, 'sources'] as const,
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

export async function excluirWebhookEventos(ids: number[]): Promise<{ deleted: number }> {
  const resposta = await api.delete<{ deleted: number }>('/admin/webhook-eventos', {
    data: { ids },
  })

  return resposta.data
}

export async function reprocessarWebhookEvento(id: number): Promise<{ success: boolean }> {
  const resposta = await api.post<{ success: boolean }>(`/admin/webhook-eventos/${id}/reprocessar`)
  return resposta.data
}

// --- Webhook Tokens Admin ---

export async function buscarWebhookTokens(): Promise<AdminWebhookToken[]> {
  const resposta = await api.get<{ data: AdminWebhookToken[] }>('/admin/webhook-tokens')
  return resposta.data.data
}

export async function criarWebhookToken(payload: CriarWebhookTokenPayload): Promise<AdminWebhookToken> {
  const resposta = await api.post<{ data: AdminWebhookToken }>('/admin/webhook-tokens', payload)
  return resposta.data.data
}

export async function toggleWebhookToken(id: number): Promise<AdminWebhookToken> {
  const resposta = await api.patch<{ data: AdminWebhookToken }>(`/admin/webhook-tokens/${id}/toggle`)
  return resposta.data.data
}

export async function excluirWebhookToken(id: number): Promise<void> {
  await api.delete(`/admin/webhook-tokens/${id}`)
}

// --- Planos ativos (para dropdowns) ---

export interface PlanoOpcao {
  id: number
  slug: string
  nome: string
  ativo: boolean
}

export async function buscarPlanosAtivos(): Promise<PlanoOpcao[]> {
  const resposta = await api.get<{ data: PlanoOpcao[] }>('/admin/planos')
  return resposta.data.data.filter((p) => p.ativo)
}

// --- Webhook Offer → Plano Admin ---

export async function buscarWebhookOfferPlanos(): Promise<AdminWebhookOfferPlano[]> {
  const resposta = await api.get<{ data: AdminWebhookOfferPlano[] }>('/admin/webhook-offer-planos')
  return resposta.data.data
}

export async function criarWebhookOfferPlano(
  payload: CriarWebhookOfferPlanoPayload,
): Promise<AdminWebhookOfferPlano> {
  const resposta = await api.post<{ data: AdminWebhookOfferPlano }>('/admin/webhook-offer-planos', payload)
  return resposta.data.data
}

export async function excluirWebhookOfferPlano(id: number): Promise<void> {
  await api.delete(`/admin/webhook-offer-planos/${id}`)
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

// --- Roles Admin ---

export interface AdminRole {
  role: string
  label: string
  assinante: boolean
}

export async function fetchAdminRoles(): Promise<AdminRole[]> {
  const res = await api.get<{ data: AdminRole[] }>('/admin/usuarios/roles')
  return res.data.data
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

// --- Importação Lastlink ---

export async function importarAssinantesLastlink(
  payload: ImportacaoAssinantesPayload,
): Promise<ImportacaoAssinantesResponse> {
  const resposta = await api.post<ImportacaoAssinantesResponse>('/admin/assinantes/importar', payload)
  return resposta.data
}

export async function buscarStatusImportacao(id: string): Promise<ImportacaoAssinantesStatus> {
  const resposta = await api.get<ImportacaoAssinantesStatus>(`/admin/assinantes/importar/${id}/status`)
  return resposta.data
}

export async function reenviarBoasVindasAssinante(id: number): Promise<{ message: string }> {
  const resposta = await api.post<{ message: string }>(`/admin/assinantes/${id}/reenviar-boas-vindas`)
  return resposta.data
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

// --- Crises Históricas Admin ---

export async function buscarAdminCrises(): Promise<AdminCriseHistorica[]> {
  const resposta = await api.get<{ data: AdminCriseHistorica[] }>('/admin/crises')
  return resposta.data.data
}

export async function criarCrise(payload: CriarCrisePayload): Promise<AdminCriseHistorica> {
  const resposta = await api.post<{ data: AdminCriseHistorica }>('/admin/crises', payload)
  return resposta.data.data
}

export async function atualizarCrise(id: number, payload: CriarCrisePayload): Promise<AdminCriseHistorica> {
  const resposta = await api.patch<{ data: AdminCriseHistorica }>(`/admin/crises/${id}`, payload)
  return resposta.data.data
}

export async function excluirCrise(id: number): Promise<void> {
  await api.delete(`/admin/crises/${id}`)
}

// --- Países Base Admin ---

export async function buscarAdminPaises(): Promise<AdminPerfilPais[]> {
  const resposta = await api.get<{ data: AdminPerfilPais[] }>('/admin/paises')
  return resposta.data.data
}

export async function criarPais(payload: CriarPerfilPaisPayload): Promise<AdminPerfilPais> {
  const resposta = await api.post<{ data: AdminPerfilPais }>('/admin/paises', payload)
  return resposta.data.data
}

export async function atualizarPais(codigo: string, payload: AtualizarPerfilPaisPayload): Promise<AdminPerfilPais> {
  const resposta = await api.patch<{ data: AdminPerfilPais }>(`/admin/paises/${codigo}`, payload)
  return resposta.data.data
}

export async function excluirPais(codigo: string): Promise<void> {
  await api.delete(`/admin/paises/${codigo}`)
}

// --- Fontes RSS Admin ---

export async function buscarAdminSources(): Promise<AdminSource[]> {
  const resposta = await api.get<{ data: AdminSource[] }>('/admin/sources')
  return resposta.data.data
}

export async function criarSource(payload: CriarSourcePayload): Promise<AdminSource> {
  const resposta = await api.post<{ data: AdminSource }>('/admin/sources', payload)
  return resposta.data.data
}

export async function atualizarSource(id: number, payload: AtualizarSourcePayload): Promise<AdminSource> {
  const resposta = await api.patch<{ data: AdminSource }>(`/admin/sources/${id}`, payload)
  return resposta.data.data
}

export async function excluirSource(id: number): Promise<void> {
  await api.delete(`/admin/sources/${id}`)
}
