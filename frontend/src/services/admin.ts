import api from '../lib/axios'
import type {
  AdminAssinante,
  AdminAssinantesFiltros,
  AdminConteudosResponse,
  AdminWebhookEvento,
  AdminWebhookEventosFiltros,
  PaginacaoLaravel,
} from '../types/admin'
import type { TipoConteudo, PlanoMinimo, Conteudo } from '../types/biblioteca'

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
