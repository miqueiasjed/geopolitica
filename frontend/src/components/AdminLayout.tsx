import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
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
} from '@radix-ui/react-icons'

const itens = [
  { label: 'Usuários', rota: '/admin/usuarios', icone: IdCardIcon },
  { label: 'Assinantes', rota: '/admin/assinantes', icone: PersonIcon },
  { label: 'Planos', rota: '/admin/planos', icone: LayersIcon },
  { label: 'Suporte', rota: '/admin/suporte', icone: ChatBubbleIcon },
  { label: 'Biblioteca', rota: '/admin/biblioteca', icone: BookmarkIcon },
  { label: 'Novo Conteúdo', rota: '/admin/novo-conteudo', icone: PlusCircledIcon },
  { label: 'Eleições', rota: '/admin/eleicoes', icone: GlobeIcon },
  { label: 'Linha do Tempo', rota: '/admin/crises', icone: ClockIcon },
  { label: 'Países Base', rota: '/admin/paises', icone: PaisesIcon },
  { label: 'Fontes RSS', rota: '/admin/fontes', icone: MixIcon },
  { label: 'B2B / Empresas', rota: '/admin/b2b', icone: FileTextIcon },
  { label: 'Webhook Eventos', rota: '/admin/webhook-eventos', icone: ActivityLogIcon },
  { label: 'Webhook Tokens', rota: '/admin/webhook-tokens', icone: LockClosedIcon },
  { label: 'Configurações', rota: '/admin/configuracoes', icone: GearIcon },
]

export function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  return (
    <div className="flex min-h-screen bg-[#0a0a0b] text-zinc-100">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-[#1e1e20] bg-[#0d0d0f]">
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

        <nav className="flex flex-1 flex-col gap-0.5 px-3">
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
  )
}
