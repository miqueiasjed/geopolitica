#!/usr/bin/env node
// Servidor MCP para ler e criar conteudos da biblioteca (admin/novo-conteudo).
// Conversa com a API Laravel usando um token Sanctum de um usuario admin.
//
// Variaveis de ambiente:
//   API_BASE_URL    URL base da API (padrao: http://localhost:8000/api)
//   ADMIN_TOKEN     Token Sanctum de um admin (tem prioridade se definido)
//   ADMIN_EMAIL     E-mail do admin (usado para login se ADMIN_TOKEN ausente)
//   ADMIN_PASSWORD  Senha do admin (usado para login se ADMIN_TOKEN ausente)

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const API_BASE_URL = (process.env.API_BASE_URL || 'http://localhost:8000/api').replace(/\/$/, '')

// Mapeamento tipo -> plano minimo, identico ao backend (ConteudoService::PLANO_POR_TIPO).
const PLANO_POR_TIPO = {
  briefing: 'essencial (plano Essencial)',
  mapa: 'pro (plano Pro)',
  tese: 'reservado (plano Reservado)',
}

let tokenEmCache = null

async function obterToken() {
  if (process.env.ADMIN_TOKEN) {
    return process.env.ADMIN_TOKEN
  }
  if (tokenEmCache) {
    return tokenEmCache
  }
  const email = process.env.ADMIN_EMAIL
  const senha = process.env.ADMIN_PASSWORD
  if (!email || !senha) {
    throw new Error(
      'Autenticacao ausente: defina ADMIN_TOKEN, ou ADMIN_EMAIL e ADMIN_PASSWORD nas variaveis de ambiente.',
    )
  }
  const resposta = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password: senha }),
  })
  if (!resposta.ok) {
    const corpo = await resposta.text()
    throw new Error(`Falha no login (${resposta.status}): ${corpo}`)
  }
  const dados = await resposta.json()
  if (!dados.token) {
    throw new Error('Login bem-sucedido, mas a resposta nao trouxe token.')
  }
  tokenEmCache = dados.token
  return tokenEmCache
}

async function apiFetch(caminho, opcoes = {}) {
  const token = await obterToken()
  const resposta = await fetch(`${API_BASE_URL}${caminho}`, {
    ...opcoes,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(opcoes.headers || {}),
    },
  })
  const texto = await resposta.text()
  let dados = null
  try {
    dados = texto ? JSON.parse(texto) : null
  } catch {
    dados = texto
  }
  if (!resposta.ok) {
    const erro = new Error(`API ${resposta.status}: ${typeof dados === 'string' ? dados : JSON.stringify(dados)}`)
    erro.status = resposta.status
    erro.corpo = dados
    throw erro
  }
  return dados
}

function textoJson(valor) {
  return { content: [{ type: 'text', text: JSON.stringify(valor, null, 2) }] }
}

function textoErro(mensagem) {
  return { isError: true, content: [{ type: 'text', text: mensagem }] }
}

const server = new McpServer({
  name: 'mcp-conteudo',
  version: '1.0.0',
})

// --- Ferramenta: guia de publicacao (regras de como postar corretamente) ---
server.registerTool(
  'guia_de_publicacao',
  {
    title: 'Guia de publicacao',
    description:
      'Retorna as regras e convencoes para criar conteudos corretamente: tipos validos, ' +
      'mapeamento de plano, verticais, limites de campos e formato HTML aceito no corpo. ' +
      'Consulte SEMPRE antes de criar conteudo.',
    inputSchema: {},
  },
  async () => {
    return textoJson({
      campos: {
        titulo: 'obrigatorio, string, ate 255 caracteres.',
        tipo: "obrigatorio, um de: 'briefing', 'mapa', 'tese'.",
        edicao: 'opcional, inteiro >= 1 (numero da edicao, usado em briefings).',
        autor: 'opcional, string ate 150 caracteres.',
        corpo: 'obrigatorio, HTML (ver formato_corpo abaixo).',
        resumo: 'opcional, string ate 500 caracteres (texto puro, sem HTML).',
        regiao: 'opcional, string ate 100 caracteres (ex: America Latina, Europa).',
        tags: 'opcional, array de strings, cada uma ate 50 caracteres.',
        tese_manchete: "obrigatorio QUANDO tipo='tese', string ate 255 caracteres; caso contrario ignore.",
        vertical_conteudo: "opcional, null ou 'elections' (Monitor Eleitoral) ou 'war' (Monitor de Guerra). Use null para GPI Core.",
        publicado: 'booleano. true publica imediatamente; false salva como rascunho.',
      },
      plano_minimo_automatico: PLANO_POR_TIPO,
      observacao_plano: 'O plano minimo NAO e enviado: o backend deriva automaticamente a partir do tipo.',
      formato_corpo:
        'O corpo e HTML gerado por um editor TipTap StarterKit. Use apenas estas tags: ' +
        '<p>, <strong>, <em>, <h2>, <ul><li>, <ol><li>, <blockquote>, <hr>, <a href>. ' +
        'Nao use <h1> (o titulo ja e o H1 da pagina). Estruture com paragrafos <p> e subtitulos <h2>. ' +
        'Exemplo: "<h2>Contexto</h2><p>Texto do paragrafo com <strong>destaque</strong>.</p>".',
      dica:
        'Antes de criar, use listar_conteudos e obter_conteudo para inspecionar exemplos reais ' +
        'do mesmo tipo e imitar o tom, a estrutura de H2 e o comprimento do corpo.',
    })
  },
)

// --- Ferramenta: listar conteudos existentes ---
server.registerTool(
  'listar_conteudos',
  {
    title: 'Listar conteudos',
    description:
      'Lista conteudos ja existentes na biblioteca (paginado, 20 por pagina). ' +
      'Use para aprender as convencoes de titulo, resumo, tags e regiao antes de criar.',
    inputSchema: {
      tipo: z.enum(['briefing', 'mapa', 'tese']).optional().describe('Filtra por tipo de conteudo.'),
      status: z.enum(['publicado', 'rascunho']).optional().describe('Filtra por status.'),
      q: z.string().optional().describe('Busca por trecho do titulo.'),
      page: z.number().int().min(1).optional().describe('Pagina (padrao 1).'),
      incluir_corpo: z
        .boolean()
        .optional()
        .describe('Se true, mantem o HTML completo do corpo de cada item. Padrao false (corpo omitido).'),
    },
  },
  async ({ tipo, status, q, page, incluir_corpo }) => {
    try {
      const params = new URLSearchParams()
      if (tipo) params.set('tipo', tipo)
      if (status) params.set('status', status)
      if (q) params.set('q', q)
      if (page) params.set('page', String(page))
      const query = params.toString()
      const dados = await apiFetch(`/admin/conteudos${query ? `?${query}` : ''}`)
      if (!incluir_corpo && Array.isArray(dados?.data)) {
        dados.data = dados.data.map(({ corpo, ...resto }) => ({
          ...resto,
          corpo_tamanho: typeof corpo === 'string' ? corpo.length : 0,
        }))
      }
      return textoJson(dados)
    } catch (e) {
      return textoErro(`Erro ao listar conteudos: ${e.message}`)
    }
  },
)

// --- Ferramenta: obter um conteudo completo por id ---
server.registerTool(
  'obter_conteudo',
  {
    title: 'Obter conteudo',
    description:
      'Retorna um conteudo completo por id, incluindo o HTML do corpo. ' +
      'Use para estudar a fundo um exemplo antes de escrever um novo.',
    inputSchema: {
      id: z.number().int().min(1).describe('ID do conteudo.'),
    },
  },
  async ({ id }) => {
    try {
      const dados = await apiFetch(`/admin/conteudos/${id}`)
      return textoJson(dados)
    } catch (e) {
      return textoErro(`Erro ao obter conteudo ${id}: ${e.message}`)
    }
  },
)

// --- Ferramenta: criar conteudo ---
server.registerTool(
  'criar_conteudo',
  {
    title: 'Criar conteudo',
    description:
      'Cria um novo conteudo na biblioteca (equivalente ao formulario admin/novo-conteudo). ' +
      'O plano minimo e derivado automaticamente do tipo. Consulte guia_de_publicacao antes.',
    inputSchema: {
      tipo: z.enum(['briefing', 'mapa', 'tese']).describe('Tipo de conteudo.'),
      titulo: z.string().min(1).max(255).describe('Titulo do conteudo.'),
      corpo: z.string().min(1).describe('Corpo em HTML (ver guia_de_publicacao).'),
      edicao: z.number().int().min(1).nullable().optional().describe('Numero da edicao (briefings).'),
      autor: z.string().max(150).nullable().optional().describe('Autor.'),
      resumo: z.string().max(500).nullable().optional().describe('Resumo em texto puro, ate 500 chars.'),
      regiao: z.string().max(100).nullable().optional().describe('Regiao geografica.'),
      tags: z.array(z.string().max(50)).optional().describe('Lista de tags.'),
      tese_manchete: z
        .string()
        .max(255)
        .nullable()
        .optional()
        .describe("Manchete da tese (obrigatorio quando tipo='tese')."),
      vertical_conteudo: z
        .enum(['elections', 'war'])
        .nullable()
        .optional()
        .describe('Vertical: elections, war ou null (GPI Core).'),
      publicado: z.boolean().optional().describe('Publicar imediatamente (padrao false = rascunho).'),
    },
  },
  async (args) => {
    try {
      if (args.tipo === 'tese' && !args.tese_manchete) {
        return textoErro("Para tipo='tese', o campo tese_manchete e obrigatorio.")
      }
      const payload = { publicado: false, ...args }
      const dados = await apiFetch('/admin/conteudos', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      return textoJson({ mensagem: 'Conteudo criado com sucesso.', conteudo: dados })
    } catch (e) {
      const detalhe = e.corpo?.errors ? `\nValidacao: ${JSON.stringify(e.corpo.errors, null, 2)}` : ''
      return textoErro(`Erro ao criar conteudo: ${e.message}${detalhe}`)
    }
  },
)

const transport = new StdioServerTransport()
await server.connect(transport)
