import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import {
  PersonIcon,
  FileTextIcon,
  PlusCircledIcon,
  BookmarkIcon,
  GlobeIcon,
  ActivityLogIcon,
  ExitIcon,
  ChevronRightIcon,
  GearIcon,
  IdCardIcon,
  ClockIcon,
  GlobeIcon as PaisesIcon,
  LockClosedIcon,
  MixIcon,
  LayersIcon,
  ChatBubbleIcon,
  FileIcon,
  CubeIcon,
  UploadIcon,
  HamburgerMenuIcon,
  Cross2Icon,
} from '@radix-ui/react-icons'

const itens = [
  { label: 'Usuários', rota: '/admin/usuarios', icone: IdCardIcon },
  { label: 'Assinantes', rota: '/admin/assinantes', icone: PersonIcon },
  { label: 'Importar Addons', rota: '/admin/assinantes/importar-addons', icone: UploadIcon },
  { label: 'Planos', rota: '/admin/planos', icone: LayersIcon },
  { label: 'Addons', rota: '/admin/produtos', icone: CubeIcon },
  { label: 'Suporte', rota: '/admin/suporte', icone: ChatBubbleIcon },
  { label: 'Biblioteca', rota: '/admin/biblioteca', icone: BookmarkIcon },
  { label: 'Novo Conteúdo', rota: '/admin/novo-conteudo', icone: PlusCircledIcon },
  { label: 'Eleições', rota: '/admin/eleicoes', icone: GlobeIcon },
  { label: 'Linha do Tempo', rota: '/admin/crises', icone: ClockIcon },
  { label: 'Países Base', rota: '/admin/paises', icone: PaisesIcon },
  { label: 'Fontes RSS', rota: '/admin/fontes', icone: MixIcon },
  { label: 'Sem Editorial', rota: '/admin/eventos-sem-editorial', icone: FileIcon },
  { label: 'B2B / Empresas', rota: '/admin/b2b', icone: FileTextIcon },
  { label: 'Webhook Eventos', rota: '/admin/webhook-eventos', icone: ActivityLogIcon },
  { label: 'Webhook Tokens', rota: '/admin/webhook-tokens', icone: LockClosedIcon },
  { label: 'Roles & Perms', rota: '/admin/roles-permissions', icone: LockClosedIcon },
  { label: 'Configurações', rota: '/admin/configuracoes', icone: GearIcon },
]

export function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [menuAberto, setMenuAberto] = useState(false)
  const prefersReduced = useReducedMotion()

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0b] text-zinc-100">
      {/* Header mobile — visível apenas em < lg */}
      <header className="lg:hidden sticky top-0 z-30 h-14 bg-[#0d0d0f] border-b border-[#1e1e20] flex items-center justify-between px-4 shrink-0">
        <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#C9B882]/60">
          terminal geopolitico
        </span>
        <button
          type="button"
          onClick={() => setMenuAberto((v) => !v)}
          aria-label="Menu"
          className="text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {menuAberto ? (
            <Cross2Icon className="h-5 w-5" />
          ) : (
            <HamburgerMenuIcon className="h-5 w-5" />
          )}
        </button>
      </header>

      {/* Drawer mobile + backdrop */}
      <AnimatePresence>
        {menuAberto && (
          <>
            <motion.div
              key="backdrop"
              className="lg:hidden fixed inset-0 z-40 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReduced ? 0 : 0.2 }}
              onClick={() => setMenuAberto(false)}
            />
            <motion.aside
              key="drawer"
              className="lg:hidden fixed top-0 left-0 z-50 h-full w-56 bg-[#0d0d0f] border-r border-[#1e1e20] overflow-y-auto flex flex-col"
              initial={{ x: prefersReduced ? 0 : -224 }}
              animate={{ x: 0 }}
              exit={{ x: prefersReduced ? 0 : -224 }}
              transition={{ type: 'tween', duration: prefersReduced ? 0 : 0.25, ease: 'easeOut' }}
            >
              <div className="px-5 py-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#C9B882]/60">
                  terminal geopolitico
                </p>
                <Link
                  to="/admin"
                  onClick={() => setMenuAberto(false)}
                  className="mt-0.5 block font-semibold text-[#C9B882] hover:text-[#C9B882]/80"
                >
                  Admin
                </Link>
              </div>

              <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3">
                {itens.map(({ label, rota, icone: Icone }) => {
                  const ativo = location.pathname === rota
                  return (
                    <Link
                      key={rota}
                      to={rota}
                      onClick={() => setMenuAberto(false)}
                      className={`group flex items-center gap-2.5 rounded-md px-3 py-2 font-mono text-xs uppercase tracking-[0.14em] transition-colors ${
                        ativo
                          ? 'bg-[#C9B882]/10 text-[#C9B882]'
                          : 'text-zinc-500 hover:bg-white/4 hover:text-zinc-200'
                      }`}
                    >
                      <Icone className="h-3.5 w-3.5 shrink-0" />
                      <span className="flex-1">{label}</span>
                      {ativo && <ChevronRightIcon className="h-3 w-3 opacity-60" />}
                    </Link>
                  )
                })}
              </nav>

              <div className="flex flex-col gap-2 border-t border-[#1e1e20] px-3 py-4">
                <Link
                  to="/dashboard/feed"
                  onClick={() => setMenuAberto(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 font-mono text-xs uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:bg-white/4 hover:text-zinc-200"
                >
                  <ChevronRightIcon className="h-3.5 w-3.5 rotate-180" />
                  Voltar ao app
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    setMenuAberto(false)
                    await logout()
                    navigate('/login', { replace: true })
                  }}
                  className="flex items-center gap-2 rounded-md px-3 py-2 font-mono text-xs uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:bg-white/4 hover:text-zinc-200"
                >
                  <ExitIcon className="h-3.5 w-3.5" />
                  Sair
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Layout principal: sidebar desktop + conteúdo */}
      <div className="flex flex-1">
        {/* Sidebar desktop — visível apenas em lg+ */}
        <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-[#1e1e20] bg-[#0d0d0f]">
          <div className="px-5 py-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#C9B882]/60">
              terminal geopolitico
            </p>
            <Link
              to="/admin"
              className="mt-0.5 block font-semibold text-[#C9B882] hover:text-[#C9B882]/80"
            >
              Admin
            </Link>
          </div>

          <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3">
            {itens.map(({ label, rota, icone: Icone }) => {
              const ativo = location.pathname === rota
              return (
                <Link
                  key={rota}
                  to={rota}
                  className={`group flex items-center gap-2.5 rounded-md px-3 py-2 font-mono text-xs uppercase tracking-[0.14em] transition-colors ${
                    ativo
                      ? 'bg-[#C9B882]/10 text-[#C9B882]'
                      : 'text-zinc-500 hover:bg-white/4 hover:text-zinc-200'
                  }`}
                >
                  <Icone className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1">{label}</span>
                  {ativo && <ChevronRightIcon className="h-3 w-3 opacity-60" />}
                </Link>
              )
            })}
          </nav>

          <div className="flex flex-col gap-2 border-t border-[#1e1e20] px-3 py-4">
            <Link
              to="/dashboard/feed"
              className="flex items-center gap-2 rounded-md px-3 py-2 font-mono text-xs uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:bg-white/4 hover:text-zinc-200"
            >
              <ChevronRightIcon className="h-3.5 w-3.5 rotate-180" />
              Voltar ao app
            </Link>
            <button
              type="button"
              onClick={async () => {
                await logout()
                navigate('/login', { replace: true })
              }}
              className="flex items-center gap-2 rounded-md px-3 py-2 font-mono text-xs uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:bg-white/4 hover:text-zinc-200"
            >
              <ExitIcon className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>
        </aside>

        {/* Conteúdo */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
