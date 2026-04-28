import { Cross2Icon, Crosshair2Icon, ExitIcon, GlobeIcon, HamburgerMenuIcon, LightningBoltIcon } from '@radix-ui/react-icons'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AlertaBadge } from './alertas/AlertaBadge'
import { AlertaPanel } from './alertas/AlertaPanel'
import { useAuth } from '../hooks/useAuth'
import { useTenant } from '../contexts/TenantContext'
import { useAddonAccess } from '../hooks/useAddonAccess'

interface TopNavProps {
  lastUpdatedLabel: string
}

interface NavItem {
  to: string
  label: string
  isActive: (pathname: string) => boolean
  icon?: ReactNode
}

function formatPlano(plano?: string | null) {
  return plano ? plano.toUpperCase() : 'ACESSO'
}

const chatIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-3 w-3"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

export function TopNav({ lastUpdatedLabel }: TopNavProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { tenant, isB2B } = useTenant()
  const temAcessoEleitoral = useAddonAccess('elections')
  const temAcessoGuerra = useAddonAccess('war')
  const temAcessoRiskScore = ['pro', 'reservado', 'admin'].includes(
    user?.assinante?.plano ?? user?.role ?? '',
  )
  const [painelAberto, setPainelAberto] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)

  useEffect(() => {
    setMenuAberto(false)
  }, [location.pathname])

  const navItems: NavItem[] = [
    { to: '/dashboard/feed', label: 'Feed', isActive: (p) => p === '/dashboard/feed' },
    {
      to: '/dashboard/biblioteca',
      label: 'Biblioteca',
      isActive: (p) => p.startsWith('/dashboard/biblioteca'),
    },
    { to: '/dashboard/mapa', label: 'Mapa de Calor', isActive: (p) => p === '/dashboard/mapa' },
    {
      to: '/dashboard/timeline',
      label: 'Linha do Tempo',
      isActive: (p) => p === '/dashboard/timeline',
    },
    {
      to: '/dashboard/eleicoes',
      label: '📅 Radar de Eleições',
      isActive: (p) => p === '/dashboard/eleicoes',
    },
    ...(temAcessoEleitoral
      ? [
          {
            to: '/dashboard/monitor-eleitoral',
            label: 'Monitor Eleitoral',
            isActive: (p: string) => p === '/dashboard/monitor-eleitoral',
            icon: <LightningBoltIcon className="h-3 w-3" />,
          },
        ]
      : []),
    ...(temAcessoGuerra
      ? [
          {
            to: '/dashboard/monitor-guerra',
            label: 'Monitor de Guerra',
            isActive: (p: string) => p === '/dashboard/monitor-guerra',
            icon: <Crosshair2Icon className="h-3 w-3" />,
          },
        ]
      : []),
    {
      to: '/paises',
      label: 'Meus Países',
      isActive: (p) => p.startsWith('/paises'),
      icon: <GlobeIcon className="h-3 w-3" />,
    },
    {
      to: '/dashboard/chat',
      label: 'Chat',
      isActive: (p) => p === '/dashboard/chat',
      icon: chatIcon,
    },
    {
      to: '/dashboard/relatorios',
      label: 'Relatórios',
      isActive: (p) => p.startsWith('/dashboard/relatorios'),
    },
    ...(temAcessoRiskScore
      ? [
          {
            to: '/dashboard/risk-score',
            label: 'Risk Score',
            isActive: (p: string) => p === '/dashboard/risk-score',
          },
        ]
      : []),
    ...(isB2B && user?.role === 'company_admin'
      ? [
          {
            to: '/dashboard/equipe',
            label: 'Equipe',
            isActive: (p: string) => p === '/dashboard/equipe',
          },
        ]
      : []),
  ]

  const desktopLinkClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] transition-colors ${
      active
        ? 'border border-[#C9B882]/30 bg-[#C9B882]/10 text-[#C9B882]'
        : 'text-zinc-500 hover:text-zinc-200'
    }`

  const mobileLinkClass = (active: boolean) =>
    `flex items-center gap-2 border-b border-[#1e1e20] py-3.5 font-mono text-sm uppercase tracking-[0.18em] transition-colors ${
      active ? 'text-[#C9B882]' : 'text-zinc-400 hover:text-zinc-200'
    }`

  const brandEl = isB2B && tenant ? (
    <div className="flex flex-col gap-1">
      {tenant.logo_url ? (
        <img src={tenant.logo_url} alt={tenant.nome} className="h-8 w-auto object-contain" />
      ) : (
        <Link to="/dashboard/feed" className="text-lg font-semibold text-[#C9B882]">
          {tenant.nome}
        </Link>
      )}
      <span className="inline-flex w-fit items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-400">
        B2B
      </span>
    </div>
  ) : (
    <>
      <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[#C9B882]/75">
        terminal geopolitico
      </p>
      <Link to="/dashboard/feed" className="text-lg font-semibold text-[#C9B882]">
        Geopolítica para Investidores
      </Link>
    </>
  )

  const mobileBrandEl = isB2B && tenant ? (
    tenant.logo_url ? (
      <img src={tenant.logo_url} alt={tenant.nome} className="h-7 w-auto object-contain" />
    ) : (
      <Link to="/dashboard/feed" className="text-base font-semibold text-[#C9B882]">
        {tenant.nome}
      </Link>
    )
  ) : (
    <Link to="/dashboard/feed" className="text-base font-semibold text-[#C9B882]">
      Geopolítica
    </Link>
  )

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#1e1e20] bg-[#0a0a0b]/95 backdrop-blur">
        {/* ─── Desktop layout (lg+) ─── */}
        <div className="mx-auto hidden max-w-7xl px-4 py-4 sm:px-6 lg:block">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div>{brandEl}</div>
              <nav className="flex items-center gap-2" aria-label="Navegação principal">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={desktopLinkClass(item.isActive(location.pathname))}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex flex-shrink-0 items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-cyan-500/10 bg-cyan-500/5 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.18em] text-cyan-100/75">
                <span>{formatPlano(user?.assinante?.plano ?? user?.role)}</span>
              </div>
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                {lastUpdatedLabel}
              </div>
              <AlertaBadge onTogglePanel={() => setPainelAberto((prev) => !prev)} />
              <button
                type="button"
                onClick={async () => {
                  await logout()
                  navigate('/login', { replace: true })
                }}
                className="inline-flex items-center gap-2 rounded-full border border-white/8 px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-zinc-300 transition-colors hover:border-[#C9B882]/30 hover:text-[#C9B882]"
              >
                <ExitIcon />
                Sair
              </button>
            </div>
          </div>
        </div>

        {/* ─── Mobile header bar (< lg) ─── */}
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:hidden">
          <div>{mobileBrandEl}</div>
          <div className="flex items-center gap-2">
            <AlertaBadge onTogglePanel={() => setPainelAberto((prev) => !prev)} />
            <button
              type="button"
              onClick={() => setMenuAberto((prev) => !prev)}
              aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menuAberto}
              aria-controls="mobile-nav-menu"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/8 text-zinc-300 transition-colors hover:border-[#C9B882]/30 hover:text-[#C9B882]"
            >
              {menuAberto ? <Cross2Icon /> : <HamburgerMenuIcon />}
            </button>
          </div>
        </div>

        {/* ─── Mobile dropdown menu ─── */}
        {menuAberto && (
          <div
            id="mobile-nav-menu"
            className="border-t border-[#1e1e20] bg-[#0a0a0b] lg:hidden"
          >
            <nav className="flex flex-col px-4" aria-label="Menu de navegação mobile">
              {navItems.map((item) => {
                const active = item.isActive(location.pathname)
                return (
                  <Link key={item.to} to={item.to} className={mobileLinkClass(active)}>
                    {item.icon}
                    {item.label}
                    {active && (
                      <span
                        className="ml-auto h-1.5 w-1.5 rounded-full bg-[#C9B882]"
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                )
              })}
            </nav>

            <div className="flex items-center justify-between border-t border-[#1e1e20] px-4 py-4">
              <div className="flex items-center gap-2 rounded-full border border-cyan-500/10 bg-cyan-500/5 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.18em] text-cyan-100/75">
                <span>{formatPlano(user?.assinante?.plano ?? user?.role)}</span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await logout()
                  navigate('/login', { replace: true })
                }}
                className="inline-flex items-center gap-2 rounded-full border border-white/8 px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-zinc-300 transition-colors hover:border-[#C9B882]/30 hover:text-[#C9B882]"
              >
                <ExitIcon />
                Sair
              </button>
            </div>
          </div>
        )}
      </header>

      <AlertaPanel isOpen={painelAberto} onClose={() => setPainelAberto(false)} />
    </>
  )
}
