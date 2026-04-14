import { Table, Skeleton } from '@radix-ui/themes'
import { TrashIcon } from '@radix-ui/react-icons'
import type { MembroB2B, RoleB2B } from '../../types/b2b'

interface MembersListProps {
  membros: MembroB2B[]
  onRemover: (id: number) => void
  isLoading: boolean
}

function formatarData(iso: string): string {
  const d = new Date(iso)
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const ano = d.getFullYear()
  return `${dia}/${mes}/${ano}`
}

const roleBadgeConfig: Record<RoleB2B, { label: string; classes: string }> = {
  admin: {
    label: 'Admin',
    classes: 'bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/30',
  },
  leitor: {
    label: 'Leitor',
    classes: 'bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/30',
  },
}

interface MembroRowProps {
  membro: MembroB2B
  onRemover: (id: number) => void
}

function MembroRow({ membro, onRemover }: MembroRowProps) {
  const ativo = membro.aceito_em !== null
  const roleCfg = roleBadgeConfig[membro.role_b2b]
  const identificacao = membro.usuario?.name ?? membro.convite_email

  return (
    <Table.Row>
      <Table.Cell>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-zinc-200">{identificacao}</span>
          {membro.usuario?.name && (
            <span className="font-mono text-xs text-zinc-500">{membro.convite_email}</span>
          )}
        </div>
      </Table.Cell>

      <Table.Cell>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-xs uppercase tracking-[0.12em] ${roleCfg.classes}`}
        >
          {roleCfg.label}
        </span>
      </Table.Cell>

      <Table.Cell>
        {ativo ? (
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Ativo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Convite pendente
          </span>
        )}
      </Table.Cell>

      <Table.Cell>
        <span className="font-mono text-xs text-zinc-500">
          {ativo && membro.aceito_em ? formatarData(membro.aceito_em) : 'Aguardando...'}
        </span>
      </Table.Cell>

      <Table.Cell>
        <button
          type="button"
          aria-label={`Remover ${identificacao}`}
          onClick={() => onRemover(membro.id)}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-xs text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
        >
          <TrashIcon className="h-3.5 w-3.5" />
          Remover
        </button>
      </Table.Cell>
    </Table.Row>
  )
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <Table.Row key={i}>
          <Table.Cell>
            <Skeleton width="160px" height="16px" />
          </Table.Cell>
          <Table.Cell>
            <Skeleton width="64px" height="16px" />
          </Table.Cell>
          <Table.Cell>
            <Skeleton width="100px" height="16px" />
          </Table.Cell>
          <Table.Cell>
            <Skeleton width="80px" height="16px" />
          </Table.Cell>
          <Table.Cell>
            <Skeleton width="72px" height="16px" />
          </Table.Cell>
        </Table.Row>
      ))}
    </>
  )
}

export function MembersList({ membros, onRemover, isLoading }: MembersListProps) {
  return (
    <Table.Root variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Membro</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Role</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Entrada</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Ação</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {isLoading ? (
          <SkeletonRows />
        ) : membros.length === 0 ? (
          <Table.Row>
            <Table.Cell colSpan={5}>
              <p className="py-4 text-center font-mono text-sm text-zinc-500">
                Nenhum membro encontrado.
              </p>
            </Table.Cell>
          </Table.Row>
        ) : (
          membros.map((membro) => (
            <MembroRow key={membro.id} membro={membro} onRemover={onRemover} />
          ))
        )}
      </Table.Body>
    </Table.Root>
  )
}
