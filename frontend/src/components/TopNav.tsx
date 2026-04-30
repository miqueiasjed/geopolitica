import {
  BarChartIcon,
  CalendarIcon,
  ChatBubbleIcon,
  Cross2Icon,
  Crosshair2Icon,
  DashboardIcon,
  ExitIcon,
  FileTextIcon,
  GlobeIcon,
  HamburgerMenuIcon,
  LightningBoltIcon,
  LockClosedIcon,
  PersonIcon,
  ReaderIcon,
} from '@radix-ui/react-icons'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
import { useState } from 'react'
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
  eyebrow?: string
  locked?: boolean
  isActive: (pathname: string) => boolean
  icon: ReactNode
}

function formatPlano(plano?: string | null) {
  return plano ? plano.toUpperCase() : 'ACESSO'
}

const sidebarVariants: Variants = {
  hidden: { x: -24, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
}

const mobilePanelVariants: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18, ease: 'easeIn' } },
}

export function TopNav({ lastUpdatedLabel }: TopNavProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const prefersReduced = useReducedMotion()
  const { logout, user } = useAuth()
  const { tenant, isB2B } = useTenant()
  const temAcessoEleitoral = useAddonAccess('elections')
  const temAcessoGuerra = useAddonAccess('war')
  const temAcessoRiskScore = ['pro', 'reservado', 'admin'].includes(
    user?.assinante?.plano ?? user?.role ?? '',
  )
  const [painelAberto, setPainelAberto] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)

  const navItems: NavItem[] = [
    {
      to: '/dashboard/feed',
      label: 'Feed',
      eyebrow: 'Tempo real',
      isActive: (p) => p === '/dashboard/feed',
      icon: <DashboardIcon />,
    },
    {
      to: '/dashboard/biblioteca',
      label: 'Biblioteca',
      eyebrow: 'Análises',
      isActive: (p) => p.startsWith('/dashboard/biblioteca'),
      icon: <ReaderIcon />,
    },
    {
      to: '/dashboard/mapa',
      label: 'Mapa de Calor',
      eyebrow: 'Visual',
      isActive: (p) => p === '/dashboard/mapa',
      icon: <GlobeIcon />,
    },
    {
      to: '/dashboard/timeline',
      label: 'Linha do Tempo',
      eyebrow: 'Contexto',
      isActive: (p) => p === '/dashboard/timeline',
      icon: <BarChartIcon />,
    },
    {
      to: '/dashboard/eleicoes',
      label: 'Radar de Eleições',
      eyebrow: 'Calendário',
      isActive: (p) => p === '/dashboard/eleicoes',
      icon: <CalendarIcon />,
    },
    {
      to: '/dashboard/monitor-eleitoral',
      label: 'Monitor Eleitoral',
      eyebrow: temAcessoEleitoral ? 'Addon' : 'Exclusivo',
      locked: !temAcessoEleitoral,
      isActive: (p: string) => p === '/dashboard/monitor-eleitoral',
      icon: <LightningBoltIcon />,
    },
    {
      to: '/dashboard/monitor-guerra',
      label: 'Monitor de Guerra',
      eyebrow: temAcessoGuerra ? 'Addon' : 'Exclusivo',
      locked: !temAcessoGuerra,
      isActive: (p: string) => p === '/dashboard/monitor-guerra',
      icon: <Crosshair2Icon />,
    },
    {
      to: '/paises',
      label: 'Meus Países',
      eyebrow: 'Portfólio',
      isActive: (p) => p.startsWith('/paises'),
      icon: <GlobeIcon />,
    },
    {
      to: '/dashboard/chat',
      label: 'Chat',
      eyebrow: 'IA',
      isActive: (p) => p === '/dashboard/chat',
      icon: <ChatBubbleIcon />,
    },
    {
      to: '/dashboard/relatorios',
      label: 'Relatórios',
      eyebrow: 'PDF',
      isActive: (p) => p.startsWith('/dashboard/relatorios'),
      icon: <FileTextIcon />,
    },
    {
      to: '/dashboard/risk-score',
      label: 'Risk Score',
      eyebrow: temAcessoRiskScore ? 'Mercados' : 'Pro+',
      locked: !temAcessoRiskScore,
      isActive: (p: string) => p === '/dashboard/risk-score',
      icon: <BarChartIcon />,
    },
    ...(isB2B && user?.role === 'company_admin'
      ? [
          {
            to: '/dashboard/equipe',
            label: 'Equipe',
            eyebrow: 'B2B',
            isActive: (p: string) => p === '/dashboard/equipe',
            icon: <PersonIcon />,
          },
        ]
      : []),
  ]

  const brandEl = isB2B && tenant ? (
    <div className="min-w-0">
      {tenant.logo_url ? (
        <img src={tenant.logo_url} alt={tenant.nome} className="max-h-10 w-auto object-contain" />
      ) : (
        <Link to="/dashboard/feed" className="block truncate text-lg font-black text-white">
          {tenant.nome}
        </Link>
      )}
      <span className="mt-2 inline-flex w-fit items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-200">
        B2B
      </span>
    </div>
  ) : (
    <Link to="/dashboard/feed" className="group block">
      <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-[#BFFF3C]/75">
        terminal geopolitico
      </p>
      <p className="mt-1 max-w-[13rem] text-xl font-black leading-tight text-white transition-colors group-hover:text-[#D7FF69]">
        Geopolítica para Investidores
      </p>
    </Link>
  )

  const navLinkClass = (active: boolean, locked?: boolean) =>
    `group relative flex items-center gap-3 rounded-md border px-3 py-3 transition-all duration-200 ${
      locked
        ? 'border-transparent text-zinc-600 hover:border-white/8 hover:bg-white/[0.02] hover:text-zinc-500'
        : active
          ? 'border-[#BFFF3C]/35 bg-[#BFFF3C]/10 text-white shadow-[0_0_24px_rgba(191,255,60,0.08)]'
          : 'border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-zinc-100'
    }`

  const iconClass = (active: boolean, locked?: boolean) =>
    `flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors ${
      locked
        ? 'border-white/5 bg-white/[0.02] text-zinc-700'
        : active
          ? 'border-[#BFFF3C]/35 bg-[#BFFF3C]/10 text-[#D7FF69]'
          : 'border-white/8 bg-white/[0.03] text-zinc-500 group-hover:text-[#D7FF69]'
    }`

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const navContent = (
    <nav className="space-y-1.5" aria-label="Navegação principal">
      {navItems.map((item) => {
        const active = item.isActive(location.pathname)
        return (
          <Link
            key={item.to}
            to={item.to}
            className={navLinkClass(active, item.locked)}
            onClick={() => setMenuAberto(false)}
          >
            <span className={iconClass(active, item.locked)} aria-hidden="true">
              {item.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">{item.label}</span>
              {item.eyebrow && (
                <span className="block truncate font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500 group-hover:text-zinc-400">
                  {item.eyebrow}
                </span>
              )}
            </span>
            {item.locked ? (
              <span className="flex-shrink-0 text-zinc-700" aria-label="Acesso bloqueado">
                <LockClosedIcon />
              </span>
            ) : active ? (
              <span
                className="absolute right-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#BFFF3C]"
                aria-hidden="true"
              />
            ) : null}
          </Link>
        )
      })}
    </nav>
  )

  const utilityContent = (
    <div className="space-y-3">
      <div className="rounded-md border border-[#BFFF3C]/15 bg-[#BFFF3C]/[0.06] p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            Plano
          </span>
          <span className="rounded-full border border-[#BFFF3C]/25 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#D7FF69]">
            {formatPlano(user?.assinante?.plano ?? user?.role)}
          </span>
        </div>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          {lastUpdatedLabel}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <AlertaBadge onTogglePanel={() => setPainelAberto((prev) => !prev)} />
        <button
          type="button"
          onClick={handleLogout}
          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-white/8 bg-white/[0.03] font-mono text-xs uppercase tracking-[0.16em] text-zinc-300 transition-colors hover:border-[#BFFF3C]/30 hover:text-[#D7FF69]"
        >
          <ExitIcon />
          Sair
        </button>
      </div>
    </div>
  )

  return (
    <>
      <motion.aside
        className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-[#BFFF3C]/10 bg-[#070808]/95 px-4 py-5 shadow-[18px_0_60px_rgba(0,0,0,0.32)] backdrop-blur-xl lg:flex lg:flex-col"
        variants={prefersReduced ? undefined : sidebarVariants}
        initial={prefersReduced ? false : 'hidden'}
        animate={prefersReduced ? undefined : 'visible'}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(191,255,60,0.08),transparent_28%),radial-gradient(circle_at_20%_0%,rgba(255,91,32,0.13),transparent_24%)]" />
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <div className="mb-8">{brandEl}</div>
          <div className="min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-hide">{navContent}</div>
          <div className="mt-5 border-t border-white/8 pt-4">{utilityContent}</div>
        </div>
      </motion.aside>

      <header className="sticky top-0 z-40 border-b border-[#BFFF3C]/10 bg-[#070808]/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <Link to="/dashboard/feed" className="block truncate text-base font-black text-white">
              {isB2B && tenant ? tenant.nome : 'Geopolítica'}
            </Link>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#BFFF3C]/75">
              terminal geopolitico
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AlertaBadge onTogglePanel={() => setPainelAberto((prev) => !prev)} />
            <button
              type="button"
              onClick={() => setMenuAberto((prev) => !prev)}
              aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menuAberto}
              aria-controls="mobile-nav-menu"
              className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-zinc-200 transition-colors hover:border-[#BFFF3C]/35 hover:text-[#D7FF69]"
            >
              {menuAberto ? <Cross2Icon /> : <HamburgerMenuIcon />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuAberto && (
            <motion.div
              id="mobile-nav-menu"
              className="mt-4 max-h-[calc(100vh-5rem)] overflow-y-auto border-t border-white/8 pt-4 scrollbar-hide"
              variants={prefersReduced ? undefined : mobilePanelVariants}
              initial={prefersReduced ? false : 'hidden'}
              animate={prefersReduced ? undefined : 'visible'}
              exit={prefersReduced ? undefined : 'exit'}
            >
              {navContent}
              <div className="mt-4 border-t border-white/8 pt-4">{utilityContent}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AlertaPanel isOpen={painelAberto} onClose={() => setPainelAberto(false)} />
    </>
  )
}
