import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EyeOpenIcon, EyeClosedIcon, CheckCircledIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons'
import api from '../../lib/axios'
import type { Configuracao, GrupoConfiguracao, GruposConfiguracao } from '../../types/configuracao'

// ─── Labels dos grupos ────────────────────────────────────────────────────────

const LABEL_GRUPO: Record<GrupoConfiguracao, string> = {
  ia:         '🤖 IA & Provedores',
  email:      '📧 E-mail',
  pagamentos: '💳 Pagamentos',
  seguranca:  '🔒 Segurança',
  alertas:    '⚙️ Limites & Alertas',
  geral:      '🌐 Geral',
  prompts:    '✍️ Prompts de IA',
}

const ORDEM_GRUPOS: GrupoConfiguracao[] = ['ia', 'prompts', 'alertas', 'email', 'pagamentos', 'seguranca', 'geral']

const PROVIDER_LABELS: Record<string, string> = {
  claude: 'Claude (Anthropic)',
  openai: 'GPT (OpenAI)',
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function buscarConfiguracoes(): Promise<GruposConfiguracao> {
  const res = await api.get<{ data: GruposConfiguracao }>('/admin/configuracoes')
  return res.data.data
}

async function salvarConfiguracoes(dados: Record<string, string>): Promise<GruposConfiguracao> {
  const res = await api.patch<{ data: GruposConfiguracao }>('/admin/configuracoes', {
    configuracoes: dados,
  })
  return res.data.data
}

// ─── Campo individual ─────────────────────────────────────────────────────────

interface CampoProps {
  config: Configuracao
  valor: string
  onChange: (chave: string, valor: string) => void
}

function Campo({ config, valor, onChange }: CampoProps) {
  const [visivel, setVisivel] = useState(false)

  const placeholder = config.sensivel && config.configurado && valor === ''
    ? '••••••••  (deixe em branco para manter)'
    : config.descricao ?? ''

  const baseInput = 'w-full rounded-lg border border-[#2a2a2e] bg-[#111113] px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-[#C9B882]/40 focus:ring-1 focus:ring-[#C9B882]/20'

  const header = (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-zinc-200">{config.label}</label>
      {config.configurado ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 font-mono text-[10px] text-green-400">
          <CheckCircledIcon className="h-3 w-3" />
          Configurado
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] text-amber-400">
          <ExclamationTriangleIcon className="h-3 w-3" />
          Padrão
        </span>
      )}
    </div>
  )

  // ── select ────────────────────────────────────────────────────────────────
  if (config.tipo === 'select') {
    return (
      <div className="space-y-1.5">
        {header}
        {config.descricao && <p className="text-xs text-zinc-500">{config.descricao}</p>}
        <select
          value={valor || config.valor || ''}
          onChange={(e) => onChange(config.chave, e.target.value)}
          className={`${baseInput} cursor-pointer`}
        >
          {(config.opcoes ?? []).map((op) => (
            <option key={op} value={op} className="bg-[#111113]">
              {PROVIDER_LABELS[op] ?? op}
            </option>
          ))}
        </select>
      </div>
    )
  }

  // ── textarea ──────────────────────────────────────────────────────────────
  if (config.tipo === 'textarea') {
    return (
      <div className="col-span-full space-y-1.5">
        {header}
        {config.descricao && <p className="text-xs text-zinc-500">{config.descricao}</p>}
        <textarea
          value={valor}
          onChange={(e) => onChange(config.chave, e.target.value)}
          placeholder={config.valor ?? placeholder}
          rows={5}
          className={`${baseInput} resize-y font-mono text-xs leading-relaxed`}
        />
      </div>
    )
  }

  // ── input padrão (texto, numero, senha) ───────────────────────────────────
  const inputType = config.tipo === 'numero'
    ? 'number'
    : config.tipo === 'senha' && !visivel
      ? 'password'
      : 'text'

  return (
    <div className="space-y-1.5">
      {header}
      {config.descricao && <p className="text-xs text-zinc-500">{config.descricao}</p>}
      <div className="relative">
        <input
          type={inputType}
          value={valor}
          onChange={(e) => onChange(config.chave, e.target.value)}
          placeholder={placeholder}
          className={`${baseInput} pr-10`}
        />
        {config.tipo === 'senha' && (
          <button
            type="button"
            onClick={() => setVisivel((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
            aria-label={visivel ? 'Ocultar' : 'Mostrar'}
          >
            {visivel ? <EyeClosedIcon className="h-4 w-4" /> : <EyeOpenIcon className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Card de grupo ────────────────────────────────────────────────────────────

interface GrupoCardProps {
  grupo: GrupoConfiguracao
  configs: Configuracao[]
  valores: Record<string, string>
  onChange: (chave: string, valor: string) => void
  onSalvar: (grupo: GrupoConfiguracao) => void
  salvando: boolean
  salvoSucesso: boolean
}

function GrupoCard({ grupo, configs, valores, onChange, onSalvar, salvando, salvoSucesso }: GrupoCardProps) {
  const pendentes = configs.filter((c) => !c.configurado).length

  // Detecta provider ativo para o banner informativo no grupo IA
  const providerAtivo = valores['ia_provider']
    ?? configs.find((c) => c.chave === 'ia_provider')?.valor
    ?? 'claude'

  return (
    <div className="rounded-xl border border-[#1e1e20] bg-[#0d0d0f]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1e1e20] px-5 py-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-zinc-100">
            {LABEL_GRUPO[grupo]}
          </h2>
          {pendentes > 0 && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] text-amber-400">
              {pendentes} pendente{pendentes > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={salvando}
          onClick={() => onSalvar(grupo)}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-xs uppercase tracking-[0.14em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            salvoSucesso
              ? 'border-green-500/30 bg-green-500/10 text-green-400'
              : 'border-[#C9B882]/30 bg-[#C9B882]/10 text-[#C9B882] hover:bg-[#C9B882]/20'
          }`}
        >
          {salvando ? (
            <>
              <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Salvando...
            </>
          ) : salvoSucesso ? (
            <>
              <CheckCircledIcon className="h-3 w-3" />
              Salvo!
            </>
          ) : (
            'Salvar'
          )}
        </button>
      </div>

      {/* Banner do provider ativo (apenas no grupo IA) */}
      {grupo === 'ia' && (
        <div className="mx-5 mt-4 flex items-center gap-3 rounded-lg border border-[#C9B882]/20 bg-[#C9B882]/5 px-4 py-2.5">
          <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_6px_theme(colors.green.400)]" />
          <span className="text-xs text-zinc-300">
            Provedor ativo:{' '}
            <span className="font-semibold text-[#C9B882]">
              {PROVIDER_LABELS[providerAtivo] ?? providerAtivo}
            </span>
          </span>
        </div>
      )}

      {/* Separadores de subseção no grupo IA */}
      {grupo === 'ia' ? (
        <div className="p-5 space-y-6">
          {/* Provider selector */}
          {configs.filter((c) => c.chave === 'ia_provider').map((config) => (
            <Campo key={config.chave} config={config} valor={valores[config.chave] ?? ''} onChange={onChange} />
          ))}

          {/* Claude */}
          <div className="space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              — Claude / Anthropic
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {configs.filter((c) => c.chave.startsWith('claude_')).map((config) => (
                <Campo key={config.chave} config={config} valor={valores[config.chave] ?? ''} onChange={onChange} />
              ))}
            </div>
          </div>

          {/* OpenAI */}
          <div className="space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              — GPT / OpenAI
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {configs.filter((c) => c.chave.startsWith('openai_')).map((config) => (
                <Campo key={config.chave} config={config} valor={valores[config.chave] ?? ''} onChange={onChange} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Layout padrão para outros grupos */
        <div className="grid gap-5 p-5 sm:grid-cols-2">
          {configs.map((config) => (
            <Campo
              key={config.chave}
              config={config}
              valor={valores[config.chave] ?? ''}
              onChange={onChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function AdminConfiguracoes() {
  const queryClient = useQueryClient()
  const [valores, setValores] = useState<Record<string, string>>({})
  const [grupoSalvando, setGrupoSalvando] = useState<GrupoConfiguracao | null>(null)
  const [gruposSalvos, setGruposSalvos] = useState<Set<GrupoConfiguracao>>(new Set())
  const [erro, setErro] = useState<string | null>(null)

  const { data: grupos, isLoading } = useQuery({
    queryKey: ['admin', 'configuracoes'],
    queryFn: buscarConfiguracoes,
    staleTime: 30_000,
  })

  const mutation = useMutation({
    mutationFn: salvarConfiguracoes,
    onSuccess: (novosDados) => {
      queryClient.setQueryData(['admin', 'configuracoes'], novosDados)
      setErro(null)
    },
    onError: () => {
      setErro('Não foi possível salvar. Verifique os valores e tente novamente.')
    },
  })

  function handleChange(chave: string, valor: string) {
    setValores((prev) => ({ ...prev, [chave]: valor }))
    const config = Object.values(grupos ?? {})
      .flat()
      .find((c) => c.chave === chave)
    if (config) {
      setGruposSalvos((prev) => {
        const novo = new Set(prev)
        novo.delete(config.grupo as GrupoConfiguracao)
        return novo
      })
    }
  }

  async function handleSalvar(grupo: GrupoConfiguracao) {
    if (!grupos) return

    const configsDoGrupo = grupos[grupo] ?? []
    const dadosGrupo: Record<string, string> = {}

    for (const config of configsDoGrupo) {
      const val = valores[config.chave]
      if (val !== undefined) {
        dadosGrupo[config.chave] = val
      }
    }

    if (Object.keys(dadosGrupo).length === 0) return

    setGrupoSalvando(grupo)
    setErro(null)

    try {
      await mutation.mutateAsync(dadosGrupo)
      setGruposSalvos((prev) => new Set([...prev, grupo]))
      setValores((prev) => {
        const novo = { ...prev }
        for (const config of configsDoGrupo) {
          if (config.sensivel) {
            delete novo[config.chave]
          }
        }
        return novo
      })
      window.setTimeout(() => {
        setGruposSalvos((prev) => {
          const novo = new Set(prev)
          novo.delete(grupo)
          return novo
        })
      }, 3000)
    } finally {
      setGrupoSalvando(null)
    }
  }

  const totalPendentes = grupos
    ? Object.values(grupos).flat().filter((c) => !c.configurado).length
    : 0

  const totalConfigs = grupos
    ? Object.values(grupos).flat().length
    : 0

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[#C9B882]/70">
            admin
          </p>
          <h1 className="text-2xl font-semibold text-white">Configurações da Plataforma</h1>
          <p className="text-sm text-zinc-400">
            Gerencie credenciais, provedores de IA e prompts sem editar o servidor.
          </p>
        </div>

        {!isLoading && (
          <div className="flex-shrink-0 rounded-xl border border-[#1e1e20] bg-[#111113] px-4 py-3 text-center">
            <p className="font-mono text-xl font-semibold text-white">
              {totalConfigs - totalPendentes}
              <span className="text-zinc-600">/{totalConfigs}</span>
            </p>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              configuradas
            </p>
          </div>
        )}
      </div>

      {/* Aviso de erro global */}
      {erro && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {erro}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl border border-[#1e1e20] bg-[#0d0d0f]"
              aria-hidden="true"
            />
          ))}
        </div>
      )}

      {/* Grupos */}
      {grupos && (
        <div className="space-y-4">
          {ORDEM_GRUPOS.filter((g) => grupos[g] && (grupos[g]?.length ?? 0) > 0).map((grupo) => (
            <GrupoCard
              key={grupo}
              grupo={grupo}
              configs={grupos[grupo] ?? []}
              valores={valores}
              onChange={handleChange}
              onSalvar={handleSalvar}
              salvando={grupoSalvando === grupo}
              salvoSucesso={gruposSalvos.has(grupo)}
            />
          ))}
        </div>
      )}

      {/* Nota de segurança */}
      <p className="text-center font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-600">
        Valores sensíveis são criptografados no banco de dados e nunca exibidos após salvar.
      </p>
    </div>
  )
}
