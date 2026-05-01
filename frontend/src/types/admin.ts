export interface PaginacaoLaravel<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface AdminAssinante {
  id: number
  email: string
  name: string
  plano: string
  status: string
  ativo: boolean
  assinado_em: string | null
}

export interface ImportacaoAssinantesResponse {
  importacao_id: string
  total: number
  message: string
}

export interface ImportacaoAssinantesStatus {
  total: number
  processados: number
  sucesso: number
  erros_count: number
  erros: string[]
  concluido: boolean
  percentual: number
}

export interface AdminWebhookEvento {
  id: number
  fonte: 'lastlink' | 'hotmart' | string
  event_type: string
  email: string | null
  hotmart_subscriber_code: string | null
  processado: boolean
  processado_em: string | null
  erro: string | null
  log_acao: string | null
  created_at: string
  payload: unknown
}

export interface AdminAssinantesFiltros {
  search?: string
  plano?: string
  status?: string
  page?: number
}

export interface AdminWebhookEventosFiltros {
  fonte?: string
  type?: string
  processado?: string
  page?: number
}

export type StatusConteudo = 'publicado' | 'rascunho'

export interface AdminConteudoItem {
  id: number
  tipo: import('./biblioteca').TipoConteudo
  titulo: string
  plano_minimo: import('./biblioteca').PlanoMinimo
  status: StatusConteudo
  publicado_em: string | null
}

export interface AdminConteudosResponse {
  data: AdminConteudoItem[]
  total: number
  per_page: number
  current_page: number
  last_page: number
}

export type RoleUsuario = string

export interface AdminUsuario {
  id: number
  name: string
  email: string
  role: RoleUsuario | null
  created_at: string
}

export interface AdminUsuarioDetalhe extends AdminUsuario {
  email_verified_at: string | null
  assinante: {
    plano: string
    ativo: boolean
    status: string
    expira_em: string | null
  } | null
}

export interface AdminUsuariosFiltros {
  search?: string
  role?: string
  page?: number
}

export interface AtualizarUsuarioPayload {
  name?: string
  email?: string
  role?: RoleUsuario
  expira_em?: string | null
}

export interface CriarUsuarioPayload {
  name: string
  email: string
  password: string
  role: RoleUsuario
  expira_em?: string | null
}

// --- Crises Históricas ---

export interface MetricaItem {
  label: string
  valor: string
}

export interface AdminCriseHistorica {
  id: number
  titulo: string
  slug: string
  ano: number
  data_inicio: string
  data_fim: string | null
  contexto_geopolitico: string
  impacto_global: string
  impacto_brasil: string
  metricas_globais: MetricaItem[]
  metricas_brasil: MetricaItem[]
  categorias: string[]
  content_slug: string | null
  em_andamento: boolean
}

export interface CriarCrisePayload {
  titulo: string
  slug: string
  ano: number
  data_inicio: string
  data_fim: string | null
  contexto_geopolitico: string
  impacto_global: string
  impacto_brasil: string
  metricas_globais: MetricaItem[]
  metricas_brasil: MetricaItem[]
  categorias: string[]
  content_slug: string | null
}

// --- Países Base ---

export interface AdminPerfilPais {
  codigo_pais: string
  nome_pt: string
  bandeira_emoji: string | null
  regiao_geopolitica: string | null
  contexto_geopolitico: string | null
  analise_lideranca: string | null
  indicadores_relevantes: string[]
  termos_busca: string[]
  gerado_em: string | null
}

export interface CriarPerfilPaisPayload {
  codigo_pais: string
  nome_pt: string
  bandeira_emoji: string | null
  regiao_geopolitica: string | null
  contexto_geopolitico: string | null
  analise_lideranca: string | null
  indicadores_relevantes: string[]
  termos_busca: string[]
}

export interface AtualizarPerfilPaisPayload {
  nome_pt: string
  bandeira_emoji: string | null
  regiao_geopolitica: string | null
  contexto_geopolitico: string | null
  analise_lideranca: string | null
  indicadores_relevantes: string[]
  termos_busca: string[]
}

// --- Webhook Offer → Plano ---

export type PlanoWebhook = 'essencial' | 'pro' | 'reservado'

export interface AdminWebhookOfferPlano {
  id: number
  fonte: FonteWebhook
  offer_id: string
  descricao: string
  plano: PlanoWebhook
  created_at: string
}

export interface CriarWebhookOfferPlanoPayload {
  fonte: FonteWebhook
  offer_id: string
  descricao: string
  plano: PlanoWebhook
}

// --- Webhook Tokens ---

export type FonteWebhook = 'hotmart' | 'lastlink'

export interface AdminWebhookToken {
  id: number
  fonte: FonteWebhook
  descricao: string
  token: string
  ativo: boolean
  created_at: string
}

export interface CriarWebhookTokenPayload {
  fonte: FonteWebhook
  descricao: string
  token: string
}

// --- Fontes RSS ---

export type CategoriaSource = 'geopolitica' | 'economia' | 'defesa' | 'mercados'
export type TierSource = 'A' | 'B'

export interface AdminSource {
  id: number
  nome: string
  rss_url: string
  categoria: CategoriaSource
  tier: TierSource
  ativo: boolean
  ultima_coleta_em: string | null
  created_at: string
}

export interface CriarSourcePayload {
  nome: string
  rss_url: string
  categoria: CategoriaSource
  tier: TierSource
  ativo: boolean
}

export interface AtualizarSourcePayload {
  nome?: string
  rss_url?: string
  categoria?: CategoriaSource
  tier?: TierSource
  ativo?: boolean
}
