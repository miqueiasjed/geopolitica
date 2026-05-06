import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { ExclamationTriangleIcon, ExitIcon, PersonIcon } from '@radix-ui/react-icons'

const STATUS_LABEL: Record<string, { texto: string; cor: string }> = {
  cancelado:   { texto: 'Cancelada',   cor: 'text-red-400 bg-red-500/10 border-red-500/20'    },
  expirado:    { texto: 'Expirada',    cor: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  reembolsado: { texto: 'Reembolsada', cor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  pendente:    { texto: 'Pendente',    cor: 'text-zinc-300 bg-zinc-700/30 border-zinc-600/30'  },
}

function formatarData(iso: string | null | undefined) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function AssinaturaInativa() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const assinante = user?.assinante
  const statusInfo = STATUS_LABEL[assinante?.status ?? ''] ?? {
    texto: 'Inativa',
    cor: 'text-zinc-400 bg-zinc-700/30 border-zinc-600/30',
  }
  const dataExpiracao = formatarData(assinante?.expira_em)

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a0b] px-6">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Marca */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.36em] text-[#C9B882]/50">
            Geopolítica para Investidores
          </p>
        </div>

        {/* Ícone */}
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-red-500/20 bg-red-500/8">
            <ExclamationTriangleIcon className="h-7 w-7 text-red-400" />
          </div>
        </div>

        {/* Título e mensagem */}
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Acesso suspenso
          </h1>
          <p className="text-sm leading-relaxed text-zinc-400">
            Sua assinatura está inativa e o acesso ao conteúdo foi suspenso.
            Entre em contato com o suporte para reativar seu plano.
          </p>
        </div>

        {/* Detalhes da assinatura */}
        <div className="rounded-xl border border-[#1e1e20] bg-[#0d0d0f] px-5 py-4 space-y-3 text-left">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-600">
            Detalhes da assinatura
          </p>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Plano</span>
              <span className="font-mono text-xs font-medium capitalize text-zinc-200">
                {assinante?.plano ?? '—'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Status</span>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium ${statusInfo.cor}`}
              >
                {statusInfo.texto}
              </span>
            </div>

            {dataExpiracao && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Expirou em</span>
                <span className="font-mono text-xs text-zinc-400">{dataExpiracao}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Conta</span>
              <span className="font-mono text-xs text-zinc-400 truncate max-w-[180px]">
                {user?.email ?? '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => navigate('/perfil')}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#C9B882]/25 bg-[#C9B882]/8 py-3 font-mono text-sm text-[#C9B882] transition-colors hover:bg-[#C9B882]/15"
          >
            <PersonIcon className="h-4 w-4" />
            Ver meu perfil
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700/50 py-3 font-mono text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
          >
            <ExitIcon className="h-4 w-4" />
            Sair da conta
          </button>
        </div>

        <p className="text-xs text-zinc-600">
          Precisa de ajuda?{' '}
          <a
            href="mailto:suporte@geopoliticainvestidores.com.br"
            className="text-zinc-400 underline underline-offset-2 hover:text-zinc-200 transition-colors"
          >
            Fale com o suporte
          </a>
        </p>
      </div>
    </main>
  )
}
