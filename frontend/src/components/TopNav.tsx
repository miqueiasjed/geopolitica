import { ExitIcon } from '@radix-ui/react-icons'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface TopNavProps {
  lastUpdatedLabel: string
}

function formatPlano(plano?: string | null) {
  return plano ? plano.toUpperCase() : 'ACESSO'
}

export function TopNav({ lastUpdatedLabel }: TopNavProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-[#1e1e20] bg-[#0a0a0b]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[#C9B882]/75">terminal geopolitico</p>
            <Link to="/dashboard/feed" className="text-lg font-semibold text-[#C9B882]">
              Geopolítica para Investidores
            </Link>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              to="/dashboard/feed"
              className={`rounded-full px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] transition-colors ${
                location.pathname === '/dashboard/feed'
                  ? 'border border-[#C9B882]/30 bg-[#C9B882]/10 text-[#C9B882]'
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              Feed
            </Link>
            <Link
              to="/dashboard/biblioteca"
              className={`rounded-full px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] transition-colors ${
                location.pathname.startsWith('/dashboard/biblioteca')
                  ? 'border border-[#C9B882]/30 bg-[#C9B882]/10 text-[#C9B882]'
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              Biblioteca
            </Link>
            <Link
              to="/dashboard/mapa"
              className={`rounded-full px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] transition-colors ${
                location.pathname === '/dashboard/mapa'
                  ? 'border border-[#C9B882]/30 bg-[#C9B882]/10 text-[#C9B882]'
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              Mapa de Calor
            </Link>
            <Link
              to="/dashboard/timeline"
              className={`rounded-full px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] transition-colors ${
                location.pathname === '/dashboard/timeline'
                  ? 'border border-[#C9B882]/30 bg-[#C9B882]/10 text-[#C9B882]'
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              Linha do Tempo
            </Link>
            <Link
              to="/dashboard/eleicoes"
              className={`rounded-full px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] transition-colors ${
                location.pathname === '/dashboard/eleicoes'
                  ? 'border border-[#C9B882]/30 bg-[#C9B882]/10 text-[#C9B882]'
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              📅 Radar de Eleições
            </Link>
          </nav>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 self-start rounded-full border border-cyan-500/10 bg-cyan-500/5 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.18em] text-cyan-100/75">
            <span>{formatPlano(user?.assinante?.plano ?? user?.role)}</span>
          </div>

          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">{lastUpdatedLabel}</div>

          <button
            type="button"
            onClick={async () => {
              await logout()
              navigate('/login', { replace: true })
            }}
            className="inline-flex items-center gap-2 self-start rounded-full border border-white/8 px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-zinc-300 transition-colors hover:border-[#C9B882]/30 hover:text-[#C9B882]"
          >
            <ExitIcon />
            Sair
          </button>
        </div>
      </div>
    </header>
  )
}
