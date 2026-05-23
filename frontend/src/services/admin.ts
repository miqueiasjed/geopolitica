import api from '../lib/axios'
import type {
  AdminAssinante,
  AdminAssinantesFiltros,
  AdminConteudosResponse,
  AdminWebhookEvento,
  AdminWebhookEventosFiltros,
  AdminWebhookOfferPlano,
  CriarWebhookOfferPlanoPayload,
  AtualizarWebhookOfferPlanoPayload,
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
  EventoSemEditorial,
  EventosSemEditorialFiltros,
  ReprocessarEditorialStatus,
  IniciarReprocessamentoResponse,
  AdminProduto,
} from '../types/admin'
import type { TipoConteudo, VerticalConteudo, Conteudo } from '../types/biblioteca'
import type { EmpresaB2B, CriarLicencaPayload, RenovarLicencaPayload } from '../types/b2b'

export interface CriarConteudoPayload {
  tipo: TipoConteudo
  edicao?: number | null
  autor?: string | null
  titulo: string
  tese_manchete?: string
  regiao?: string
  tags?: string[]
  resumo?: string
  vertical_conteudo?: VerticalConteudo | null
  corpo: string
  publicado: boolean
}

export interface ParseDocxResponse {
  edicao: number | null
  autor: string | null
  corpo: string
}

export interface EnriquecerBriefingResponse {
  titulo: string | null
  regiao: string | null
  tags: string[]
  resumo: string | null
}

export async function parsearArquivoBriefing(arquivo: File): Promise<ParseDocxResponse> {
  const form = new FormData()
  form.append('arquivo', arquivo)
  const resposta = await api.post<ParseDocxResponse>('/admin/conteudos/parse-docx', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return resposta.data
}

export async function enriquecerBriefing(corpo: string): Promise<EnriquecerBriefingResponse> {
  const resposta = await api.post<EnriquecerBriefingResponse>('/admin/conteudos/enriquecer-briefing', { corpo })
  return resposta.data
}

const ITENS_POR_PAGINA = 25

export const adminKeys = {
  all: ['admin'] as const,
  assinantes: (filtros: AdminAssinantesFiltros) => [...adminKeys.all, 'assinantes', filtros] as const,
  webhookEventos: (filtros: AdminWebhookEventosFiltros) => [...adminKeys.all, 'webhook-eventos', filtros] as const,
  webhookTokens: () => [...adminKeys.all, 'webhook-tokens'] as const,
  webhookOfferPlanos: () => [...adminKeys.all, 'webhook-offer-planos'] as const,
  planosAtivos: () => [...adminKeys.all, 'planos-ativos'] as const,
  produtos: () => [...adminKeys.all, 'produtos'] as const,
  conteudos: (page: number, filtros?: import('../types/admin').AdminConteudosFiltros) => [...adminKeys.all, 'conteudos', page, filtros] as const,
  b2bEmpresas: () => [...adminKeys.all, 'b2b', 'empresas'] as const,
  usuarios: (filtros: AdminUsuariosFiltros) => [...adminKeys.all, 'usuarios', filtros] as const,
  usuario: (id: number) => [...adminKeys.all, 'usuarios', id] as const,
  crises: () => [...adminKeys.all, 'crises'] as const,
  paises: () => [...adminKeys.all, 'paises'] as const,
  sources: () => [...adminKeys.all, 'sources'] as const,
  eventosSemEditorial: (filtros: import('../types/admin').EventosSemEditorialFiltros) => [...adminKeys.all, 'eventos-sem-editorial', filtros] as const,
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

export interface TrocaPlanoStatus {
  total: number
  processados: number
  sucesso: number
  erros_count: number
  erros: string[]
  concluido: boolean
  percentual: number
}

export async function trocarPlanoEmMassa(
  ids: number[],
  plano: string,
): Promise<{ operacao_id: string; total: number }> {
  const resposta = await api.patch<{ operacao_id: string; total: number }>(
    '/admin/assinantes/plano-em-massa',
    { ids, plano },
  )
  return resposta.data
}

export async function buscarStatusTrocaPlano(operacaoId: string): Promise<TrocaPlanoStatus> {
  const resposta = await api.get<TrocaPlanoStatus>(
    `/admin/assinantes/plano-em-massa/${operacaoId}/status`,
  )
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

// --- Produtos (Addons) ---

export async function buscarProdutos(): Promise<AdminProduto[]> {
  const resposta = await api.get<AdminProduto[]>('/admin/produtos')
  return resposta.data
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

export async function atualizarWebhookOfferPlano(
  id: number,
  payload: AtualizarWebhookOfferPlanoPayload,
): Promise<AdminWebhookOfferPlano> {
  const resposta = await api.patch<{ data: AdminWebhookOfferPlano }>(`/admin/webhook-offer-planos/${id}`, payload)
  return resposta.data.data
}

export async function excluirWebhookOfferPlano(id: number): Promise<void> {
  await api.delete(`/admin/webhook-offer-planos/${id}`)
}

export async function criarConteudo(payload: CriarConteudoPayload): Promise<Conteudo> {
  const resposta = await api.post<Conteudo>('/admin/conteudos', payload)

  return resposta.data
}

export async function fetchConteudosAdmin(
  page: number,
  filtros?: import('../types/admin').AdminConteudosFiltros,
): Promise<AdminConteudosResponse> {
  const resposta = await api.get<AdminConteudosResponse>('/admin/conteudos', {
    params: { page, ...filtros },
  })

  return resposta.data
}

export async function despublicarConteudo(id: number): Promise<void> {
  await api.delete(`/admin/conteudos/${id}`)
}

export async function excluirConteudo(id: number): Promise<void> {
  await api.delete(`/admin/conteudos/${id}/excluir`)
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

export async function resetarPrimeiroAcessoAssinante(id: number): Promise<{ message: string }> {
  const resposta = await api.post<{ message: string }>(`/admin/assinantes/${id}/resetar-primeiro-acesso`)
  return resposta.data
}

export interface CriarAddonUsuarioPayload {
  nome: string
  email: string
  addon_key: 'elections' | 'war'
  expira_em?: string | null
  enviar_email: boolean
}

export async function criarAddonUsuario(payload: CriarAddonUsuarioPayload): Promise<{ message: string; user_id: number }> {
  const resposta = await api.post<{ message: string; user_id: number }>('/admin/assinantes/addon', payload)
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

// --- Eventos sem Editorial ---

export async function buscarEventosSemEditorial(
  filtros: EventosSemEditorialFiltros,
): Promise<PaginacaoLaravel<EventoSemEditorial>> {
  const params = new URLSearchParams()
  if (filtros.tipo && filtros.tipo !== 'todos') params.set('tipo', filtros.tipo)
  if (filtros.page) params.set('page', String(filtros.page))
  params.set('per_page', '25')
  const resposta = await api.get<PaginacaoLaravel<EventoSemEditorial>>('/admin/eventos-sem-editorial', { params })
  return resposta.data
}

export async function reprocessarEventosEditoriais(
  ids: number[],
  delaySegundos = 8,
): Promise<IniciarReprocessamentoResponse> {
  const resposta = await api.post<IniciarReprocessamentoResponse>('/admin/eventos-sem-editorial/reprocessar', {
    ids,
    delay_segundos: delaySegundos,
  })
  return resposta.data
}

export async function buscarStatusReprocessamento(operacaoId: string): Promise<ReprocessarEditorialStatus> {
  const resposta = await api.get<ReprocessarEditorialStatus>(`/admin/eventos-sem-editorial/${operacaoId}/status`)
  return resposta.data
}

export interface ResultadoTesteIa {
  ok: boolean
  provider?: string
  modelo?: string
  duracao_ms?: number
  resposta?: string
  mensagem?: string
}

export async function testarConexaoIa(): Promise<ResultadoTesteIa> {
  const resposta = await api.post<ResultadoTesteIa>('/admin/ai/testar-conexao')
  return resposta.data
}
