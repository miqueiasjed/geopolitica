// Status que o usuário tem para um produto específico
export type StatusAddonUsuario = 'ativo' | 'cancelado' | 'expirado' | 'reembolsado' | null

// Produto retornado pelo endpoint /api/meus-produtos (visão do usuário)
export interface Produto {
  chave: string
  nome: string
  descricao: string | null
  preco_label: string | null
  link_compra: string | null
  link_reativar: string | null
  ativo: boolean
  ordem: number
  status_usuario: StatusAddonUsuario
}

// Produto no contexto admin (CRUD) — sem status_usuario
export interface AdminProduto {
  id: number
  chave: string
  nome: string
  descricao: string | null
  preco_label: string | null
  link_compra: string | null
  link_reativar: string | null
  ativo: boolean
  ordem: number
  recurso_plano: string | null
  product_id_lastlink: string | null
  product_id_hotmart: string | null
  created_at: string
  updated_at: string
}

// Payload para criar produto
export interface CriarProdutoPayload {
  chave: string
  nome: string
  descricao?: string | null
  preco_label?: string | null
  link_compra?: string | null
  link_reativar?: string | null
  ativo?: boolean
  ordem?: number
  recurso_plano?: string | null
  product_id_lastlink?: string | null
  product_id_hotmart?: string | null
}

// Payload para atualizar produto (chave é imutável)
export type AtualizarProdutoPayload = Omit<CriarProdutoPayload, 'chave'>

// Addon de um assinante (visão admin)
export interface AssinanteAddon {
  id: number
  user_id: number
  produto_id: number
  chave: string
  status: StatusAddonUsuario
  data_inicio: string | null
  data_fim: string | null
  created_at: string
  updated_at: string
}

// Payload para adicionar addon a um assinante
export interface AdicionarAddonPayload {
  produto_chave: string
  status: Exclude<StatusAddonUsuario, null>
  data_inicio?: string | null
  data_fim?: string | null
}

// Payload para atualizar addon de um assinante
export type AtualizarAddonPayload = Partial<AdicionarAddonPayload>

// Usuário com acesso a um produto (visão admin)
export interface ProdutoAssinanteItem {
  user_id: number
  email: string | null
  nome: string | null
  tipo_acesso: 'addon' | 'plano'
  fonte: 'lastlink' | 'hotmart' | 'manual' | 'plano'
  status: string
  plano?: string
  iniciado_em: string | null
  expira_em: string | null
}

export interface ProdutoAssinantes {
  total: number
  usuarios: ProdutoAssinanteItem[]
}
