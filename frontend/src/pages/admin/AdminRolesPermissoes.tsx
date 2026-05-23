import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PlusIcon,
  Cross2Icon,
  TrashIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  LockClosedIcon,
  PersonIcon,
} from '@radix-ui/react-icons'
import {
  fetchRoles,
  fetchPermissions,
  criarRole,
  deletarRole,
  syncPermissoes,
  criarPermission,
  deletarPermission,
  adminRolesKeys,
} from '../../services/adminRolesPermissoes'
import type { Role, Permission } from '../../services/adminRolesPermissoes'

// ─── Constantes ───────────────────────────────────────────────────────────────

const INPUT_SM =
  'rounded border border-zinc-700 bg-[#0d0d0f] px-2 py-1 font-mono text-xs text-zinc-200 outline-none focus:border-[#C9B882]/50'

type Aba = 'roles' | 'permissoes'

// ─── Painel de permissões de uma role ─────────────────────────────────────────

function PainelPermissoesRole({ role }: { role: Role }) {
  const queryClient = useQueryClient()

  const { data: todasPermissions = [] } = useQuery({
    queryKey: adminRolesKeys.permissions(),
    queryFn: fetchPermissions,
    staleTime: 30_000,
  })

  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set(role.permissions))
  const [alterado, setAlterado] = useState(false)

  const mutation = useMutation({
    mutationFn: () => syncPermissoes(role.id, Array.from(selecionadas)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminRolesKeys.roles() })
      queryClient.invalidateQueries({ queryKey: adminRolesKeys.permissions() })
      setAlterado(false)
    },
  })

  function toggle(name: string) {
    setSelecionadas((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
    setAlterado(true)
  }

  if (todasPermissions.length === 0) {
    return (
      <p className="font-mono text-[11px] text-zinc-600 px-1 py-2">
        Nenhuma permissão cadastrada no sistema.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {todasPermissions.map((p) => {
          const ativa = selecionadas.has(p.name)
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.name)}
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[11px] transition-colors border ${
                ativa
                  ? 'border-[#C9B882]/40 bg-[#C9B882]/10 text-[#C9B882]'
                  : 'border-zinc-700/50 bg-transparent text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
              }`}
            >
              {p.name}
            </button>
          )
        })}
      </div>
      {alterado && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
            className="inline-flex items-center gap-1 rounded border border-[#C9B882]/30 bg-[#C9B882]/10 px-3 py-1.5 font-mono text-[10px] text-[#C9B882] hover:bg-[#C9B882]/20 disabled:opacity-50"
          >
            {mutation.isPending ? 'Salvando…' : 'Salvar alterações'}
          </button>
          <button
            type="button"
            onClick={() => {
              setSelecionadas(new Set(role.permissions))
              setAlterado(false)
            }}
            className="font-mono text-[10px] text-zinc-600 hover:text-zinc-400"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Card de role ─────────────────────────────────────────────────────────────

function CardRole({ role }: { role: Role }) {
  const [expandido, setExpandido] = useState(false)
  const queryClient = useQueryClient()
  const [confirmando, setConfirmando] = useState(false)

  const mutation = useMutation({
    mutationFn: () => deletarRole(role.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminRolesKeys.roles() })
      queryClient.invalidateQueries({ queryKey: adminRolesKeys.permissions() })
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      alert(msg ?? 'Erro ao excluir role.')
      setConfirmando(false)
    },
  })

  const temUsuarios = role.users_count > 0

  return (
    <div className="rounded-xl border border-[#1e1e20] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-[#0d0d0f] hover:bg-[#111115] transition-colors">
        <button
          type="button"
          onClick={() => setExpandido((v) => !v)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
        >
          {expandido ? (
            <ChevronDownIcon className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
          ) : (
            <ChevronRightIcon className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-mono text-sm text-zinc-200">{role.name}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-zinc-500">
              <PersonIcon className="h-3 w-3" />
              {role.users_count}
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-zinc-500">
              <LockClosedIcon className="h-3 w-3" />
              {role.permissions_count}
            </span>
          </div>
        </button>

        <div className="shrink-0">
          {confirmando ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-zinc-500">Confirmar?</span>
              <button
                type="button"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate()}
                className="font-mono text-[10px] text-red-400 hover:text-red-300 disabled:opacity-50"
              >
                {mutation.isPending ? '…' : 'Sim'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                className="font-mono text-[10px] text-zinc-600 hover:text-zinc-400"
              >
                Não
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={temUsuarios}
              title={temUsuarios ? `${role.users_count} usuário(s) atribuído(s)` : 'Excluir role'}
              onClick={() => setConfirmando(true)}
              className="rounded p-1 text-zinc-700 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {expandido && (
        <div className="border-t border-[#1e1e20] px-4 py-3 bg-[#09090a]">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600 mb-2">
            Permissões atribuídas
          </p>
          <PainelPermissoesRole role={role} />
        </div>
      )}
    </div>
  )
}

// ─── Aba de Roles ─────────────────────────────────────────────────────────────

function AbaRoles() {
  const queryClient = useQueryClient()
  const [novaRole, setNovaRole] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  const { data: roles = [], isLoading } = useQuery({
    queryKey: adminRolesKeys.roles(),
    queryFn: fetchRoles,
    staleTime: 30_000,
  })

  const mutation = useMutation({
    mutationFn: () => criarRole(novaRole.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminRolesKeys.roles() })
      setNovaRole('')
      setErro(null)
    },
    onError: (e: unknown) => {
      setErro(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Erro ao criar role.',
      )
    },
  })

  return (
    <div className="space-y-5">
      {/* Formulário de criação */}
      <div className="rounded-xl border border-[#1e1e20] bg-[#0d0d0f] p-4 space-y-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Nova role</p>
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <input
              type="text"
              value={novaRole}
              onChange={(e) => {
                setNovaRole(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                setErro(null)
              }}
              placeholder="ex: editor_conteudo"
              className={INPUT_SM + ' w-full'}
            />
            <p className="font-mono text-[10px] text-zinc-700">Minúsculas, números e _</p>
          </div>
          <button
            type="button"
            disabled={!novaRole.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="inline-flex items-center gap-1.5 rounded border border-[#C9B882]/30 bg-[#C9B882]/10 px-3 py-1.5 font-mono text-[11px] text-[#C9B882] hover:bg-[#C9B882]/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <PlusIcon className="h-3 w-3" />
            {mutation.isPending ? '…' : 'Criar'}
          </button>
        </div>
        {erro && (
          <p className="font-mono text-[11px] text-red-400">{erro}</p>
        )}
      </div>

      {/* Lista de roles */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl border border-[#1e1e20] bg-[#0d0d0f]" />
          ))}
        </div>
      ) : roles.length === 0 ? (
        <p className="font-mono text-sm text-zinc-600">Nenhuma role cadastrada.</p>
      ) : (
        <div className="space-y-2">
          {roles.map((role) => (
            <CardRole key={role.id} role={role} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Card de permissão ────────────────────────────────────────────────────────

function CardPermission({ permission }: { permission: Permission }) {
  const queryClient = useQueryClient()
  const [confirmando, setConfirmando] = useState(false)

  const mutation = useMutation({
    mutationFn: () => deletarPermission(permission.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminRolesKeys.permissions() })
      queryClient.invalidateQueries({ queryKey: adminRolesKeys.roles() })
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      alert(msg ?? 'Erro ao excluir permissão.')
      setConfirmando(false)
    },
  })

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#111113] last:border-0 group hover:bg-[#111115] transition-colors">
      <div className="flex-1 min-w-0">
        <p className="font-mono text-sm text-zinc-200">{permission.name}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {permission.roles.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {permission.roles.map((r) => (
              <span
                key={r}
                className="inline-flex items-center rounded-full bg-zinc-800/60 px-2 py-0.5 font-mono text-[10px] text-zinc-400"
              >
                {r}
              </span>
            ))}
          </div>
        ) : (
          <span className="font-mono text-[10px] text-zinc-700">sem roles</span>
        )}
        {confirmando ? (
          <div className="flex items-center gap-2 ml-2">
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
              className="font-mono text-[10px] text-red-400 hover:text-red-300 disabled:opacity-50"
            >
              {mutation.isPending ? '…' : 'Sim'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="font-mono text-[10px] text-zinc-600 hover:text-zinc-400"
            >
              Não
            </button>
          </div>
        ) : (
          <button
            type="button"
            title="Excluir permissão"
            onClick={() => setConfirmando(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5 text-zinc-700 hover:text-red-400"
          >
            <Cross2Icon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Aba de Permissões ────────────────────────────────────────────────────────

function AbaPermissoes() {
  const queryClient = useQueryClient()
  const [novaPermissao, setNovaPermissao] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: adminRolesKeys.permissions(),
    queryFn: fetchPermissions,
    staleTime: 30_000,
  })

  const mutation = useMutation({
    mutationFn: () => criarPermission(novaPermissao.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminRolesKeys.permissions() })
      setNovaPermissao('')
      setErro(null)
    },
    onError: (e: unknown) => {
      setErro(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Erro ao criar permissão.',
      )
    },
  })

  return (
    <div className="space-y-5">
      {/* Formulário de criação */}
      <div className="rounded-xl border border-[#1e1e20] bg-[#0d0d0f] p-4 space-y-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Nova permissão</p>
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <input
              type="text"
              value={novaPermissao}
              onChange={(e) => {
                setNovaPermissao(e.target.value.toLowerCase().replace(/[^a-z0-9_\-.]/g, ''))
                setErro(null)
              }}
              placeholder="ex: conteudo.publicar"
              className={INPUT_SM + ' w-full'}
            />
            <p className="font-mono text-[10px] text-zinc-700">Minúsculas, números, _, - e .</p>
          </div>
          <button
            type="button"
            disabled={!novaPermissao.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="inline-flex items-center gap-1.5 rounded border border-[#C9B882]/30 bg-[#C9B882]/10 px-3 py-1.5 font-mono text-[11px] text-[#C9B882] hover:bg-[#C9B882]/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <PlusIcon className="h-3 w-3" />
            {mutation.isPending ? '…' : 'Criar'}
          </button>
        </div>
        {erro && (
          <p className="font-mono text-[11px] text-red-400">{erro}</p>
        )}
      </div>

      {/* Lista de permissões */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-xl border border-[#1e1e20] bg-[#0d0d0f]" />
          ))}
        </div>
      ) : permissions.length === 0 ? (
        <p className="font-mono text-sm text-zinc-600">Nenhuma permissão cadastrada.</p>
      ) : (
        <div className="rounded-xl border border-[#1e1e20] overflow-hidden">
          {permissions.map((p) => (
            <CardPermission key={p.id} permission={p} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function AdminRolesPermissoes() {
  const [aba, setAba] = useState<Aba>('roles')

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[#C9B882]/70">admin</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Roles &amp; Permissões</h1>
        <p className="text-sm text-zinc-400">
          Gerencie os perfis de acesso e as permissões granulares do sistema.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1e1e20]">
        {(['roles', 'permissoes'] as Aba[]).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAba(a)}
            className={`px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] border-b-2 transition-colors -mb-px ${
              aba === a
                ? 'border-[#C9B882] text-[#C9B882]'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {a === 'roles' ? 'Roles' : 'Permissões'}
          </button>
        ))}
      </div>

      {aba === 'roles' ? <AbaRoles /> : <AbaPermissoes />}
    </div>
  )
}
