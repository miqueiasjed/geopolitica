import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Badge,
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Heading,
  ScrollArea,
  Select,
  Separator,
  Spinner,
  Table,
  Text,
  TextField,
} from '@radix-ui/themes'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  Pencil1Icon,
  PlusIcon,
  ResetIcon,
  TrashIcon,
} from '@radix-ui/react-icons'
import { useEffect, useState } from 'react'
import {
  adminKeys,
  atualizarAdminUsuario,
  buscarAdminUsuario,
  buscarAdminUsuarios,
  criarAdminUsuario,
  excluirAdminUsuario,
} from '../../services/admin'
import type { AdminUsuario, AtualizarUsuarioPayload, CriarUsuarioPayload, RoleUsuario } from '../../types/admin'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { formatarDataCurta } from '../../utils/formatters'

const VALOR_TODOS = 'all'

const ROLES: { valor: RoleUsuario; label: string }[] = [
  { valor: 'admin', label: 'Admin' },
  { valor: 'assinante_essencial', label: 'Essencial' },
  { valor: 'assinante_pro', label: 'Pro' },
  { valor: 'assinante_reservado', label: 'Reservado' },
  { valor: 'company_admin', label: 'Empresa Admin' },
]

function badgeColorDaRole(role: string | null) {
  switch (role) {
    case 'admin':
      return 'ruby'
    case 'assinante_reservado':
      return 'purple'
    case 'assinante_pro':
      return 'cyan'
    case 'assinante_essencial':
      return 'amber'
    case 'company_admin':
      return 'blue'
    default:
      return 'gray'
  }
}

function labelDaRole(role: string | null) {
  return ROLES.find((r) => r.valor === role)?.label ?? role ?? '—'
}

const ROLES_ASSINANTE = ['assinante_essencial', 'assinante_pro', 'assinante_reservado']

function ModalCriacao({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const queryClient = useQueryClient()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [role, setRole] = useState<RoleUsuario>('assinante_essencial')
  const [expiraEm, setExpiraEm] = useState('')
  const [erro, setErro] = useState('')

  function resetar() {
    setNome('')
    setEmail('')
    setSenha('')
    setRole('assinante_essencial')
    setExpiraEm('')
    setErro('')
  }

  const mutacao = useMutation({
    mutationFn: (payload: CriarUsuarioPayload) => criarAdminUsuario(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all })
      resetar()
      onFechar()
    },
    onError: (err: { response?: { data?: { errors?: Record<string, string[]>; message?: string } } }) => {
      const erros = err.response?.data?.errors
      if (erros) {
        setErro(Object.values(erros).flat().join(' '))
      } else {
        setErro(err.response?.data?.message ?? 'Erro ao criar usuário.')
      }
    },
  })

  function salvar() {
    setErro('')
    const payload: CriarUsuarioPayload = { name: nome, email, password: senha, role }
    if (ROLES_ASSINANTE.includes(role) && expiraEm) {
      payload.expira_em = expiraEm
    }
    mutacao.mutate(payload)
  }

  const ehAssinante = ROLES_ASSINANTE.includes(role)

  return (
    <Dialog.Root
      open={aberto}
      onOpenChange={(v) => {
        if (!v) {
          resetar()
          onFechar()
        }
      }}
    >
      <Dialog.Content maxWidth="480px">
        <Dialog.Title>Novo usuário</Dialog.Title>
        <Dialog.Description size="2" mb="4" className="text-zinc-400">
          Crie um usuário manualmente e atribua um perfil de acesso.
        </Dialog.Description>

        <Flex direction="column" gap="4">
          <label className="space-y-1.5">
            <Text size="2" weight="medium">
              Nome
            </Text>
            <TextField.Root
              size="3"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome completo"
            />
          </label>

          <label className="space-y-1.5">
            <Text size="2" weight="medium">
              E-mail
            </Text>
            <TextField.Root
              size="3"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@dominio.com"
            />
          </label>

          <label className="space-y-1.5">
            <Text size="2" weight="medium">
              Senha
            </Text>
            <TextField.Root
              size="3"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </label>

          <label className="space-y-1.5">
            <Text size="2" weight="medium">
              Perfil (role)
            </Text>
            <Select.Root value={role} onValueChange={(v) => setRole(v as RoleUsuario)}>
              <Select.Trigger className="w-full" />
              <Select.Content>
                {ROLES.map((r) => (
                  <Select.Item key={r.valor} value={r.valor}>
                    {r.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </label>

          {ehAssinante && (
            <label className="space-y-1.5">
              <Text size="2" weight="medium">
                Expiração do plano
              </Text>
              <input
                type="date"
                value={expiraEm}
                onChange={(e) => setExpiraEm(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </label>
          )}

          {erro && (
            <Text size="2" color="ruby">
              {erro}
            </Text>
          )}
        </Flex>

        <Flex gap="3" mt="5" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Cancelar
            </Button>
          </Dialog.Close>
          <Button onClick={salvar} disabled={mutacao.isPending}>
            {mutacao.isPending ? <Spinner size="1" /> : null}
            Criar usuário
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )
}

function ModalEdicao({
  usuario,
  aberto,
  onFechar,
}: {
  usuario: AdminUsuario
  aberto: boolean
  onFechar: () => void
}) {
  const queryClient = useQueryClient()
  const [nome, setNome] = useState(usuario.name)
  const [email, setEmail] = useState(usuario.email)
  const [role, setRole] = useState<RoleUsuario | ''>(usuario.role ?? '')
  const [expiraEm, setExpiraEm] = useState('')
  const [erro, setErro] = useState('')

  const detalheQuery = useQuery({
    queryKey: adminKeys.usuario(usuario.id),
    queryFn: () => buscarAdminUsuario(usuario.id),
    enabled: aberto,
  })

  const detalhe = detalheQuery.data

  useEffect(() => {
    if (detalhe?.assinante?.expira_em) {
      setExpiraEm(detalhe.assinante.expira_em.slice(0, 10))
    }
  }, [detalhe])

  const mutacao = useMutation({
    mutationFn: (payload: AtualizarUsuarioPayload) => atualizarAdminUsuario(usuario.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all })
      onFechar()
    },
    onError: (err: { response?: { data?: { errors?: Record<string, string[]>; message?: string } } }) => {
      const erros = err.response?.data?.errors
      if (erros) {
        setErro(Object.values(erros).flat().join(' '))
      } else {
        setErro(err.response?.data?.message ?? 'Erro ao atualizar usuário.')
      }
    },
  })

  function salvar() {
    setErro('')
    const payload: AtualizarUsuarioPayload = {}

    if (nome !== usuario.name) payload.name = nome
    if (email !== usuario.email) payload.email = email
    if (role && role !== usuario.role) payload.role = role as RoleUsuario

    const roleEfetiva = role || usuario.role || ''
    if (ROLES_ASSINANTE.includes(roleEfetiva)) {
      const expiraEmInicial = detalhe?.assinante?.expira_em?.slice(0, 10) ?? ''
      if (expiraEm !== expiraEmInicial) {
        payload.expira_em = expiraEm || null
      }
    }

    if (Object.keys(payload).length === 0) {
      onFechar()
      return
    }

    mutacao.mutate(payload)
  }

  const roleEfetiva = role || usuario.role || ''
  const ehAssinante = ROLES_ASSINANTE.includes(roleEfetiva)

  return (
    <Dialog.Root open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <Dialog.Content maxWidth="480px">
        <Dialog.Title>Editar usuário</Dialog.Title>
        <Dialog.Description size="2" mb="4" className="text-zinc-400">
          ID #{usuario.id}
        </Dialog.Description>

        <Flex direction="column" gap="4">
          {detalheQuery.isLoading ? (
            <Flex justify="center" py="4">
              <Spinner size="2" />
            </Flex>
          ) : (
            <>
              {detalhe?.assinante && (
                <Card size="1" className="border border-cyan-400/10 bg-slate-900/60">
                  <Flex gap="3" wrap="wrap">
                    <Box>
                      <Text size="1" className="text-zinc-500">
                        Plano
                      </Text>
                      <Text size="2" weight="medium" className="block capitalize">
                        {detalhe.assinante.plano}
                      </Text>
                    </Box>
                    <Box>
                      <Text size="1" className="text-zinc-500">
                        Status
                      </Text>
                      <Text size="2" weight="medium" className="block capitalize">
                        {detalhe.assinante.status}
                      </Text>
                    </Box>
                    <Box>
                      <Text size="1" className="text-zinc-500">
                        Ativo
                      </Text>
                      <Badge size="1" color={detalhe.assinante.ativo ? 'green' : 'gray'} className="block">
                        {detalhe.assinante.ativo ? 'Sim' : 'Não'}
                      </Badge>
                    </Box>
                    {detalhe.assinante.expira_em && (
                      <Box>
                        <Text size="1" className="text-zinc-500">
                          Expira em
                        </Text>
                        <Text size="2" weight="medium" className="block">
                          {formatarDataCurta(detalhe.assinante.expira_em)}
                        </Text>
                      </Box>
                    )}
                  </Flex>
                </Card>
              )}

              <label className="space-y-1.5">
                <Text size="2" weight="medium">
                  Nome
                </Text>
                <TextField.Root
                  size="3"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome completo"
                />
              </label>

              <label className="space-y-1.5">
                <Text size="2" weight="medium">
                  E-mail
                </Text>
                <TextField.Root
                  size="3"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@dominio.com"
                />
              </label>

              <label className="space-y-1.5">
                <Text size="2" weight="medium">
                  Perfil (role)
                </Text>
                <Select.Root value={role} onValueChange={(v) => setRole(v as RoleUsuario)}>
                  <Select.Trigger className="w-full" />
                  <Select.Content>
                    {ROLES.map((r) => (
                      <Select.Item key={r.valor} value={r.valor}>
                        {r.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </label>

              {ehAssinante && (
                <label className="space-y-1.5">
                  <Text size="2" weight="medium">
                    Expiração do plano
                  </Text>
                  <input
                    type="date"
                    value={expiraEm}
                    onChange={(e) => setExpiraEm(e.target.value)}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </label>
              )}

              {erro && (
                <Text size="2" color="ruby">
                  {erro}
                </Text>
              )}
            </>
          )}
        </Flex>

        <Flex gap="3" mt="5" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Cancelar
            </Button>
          </Dialog.Close>
          <Button onClick={salvar} disabled={mutacao.isPending || detalheQuery.isLoading}>
            {mutacao.isPending ? <Spinner size="1" /> : null}
            Salvar
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )
}

function ModalExclusao({
  usuario,
  aberto,
  onFechar,
}: {
  usuario: AdminUsuario
  aberto: boolean
  onFechar: () => void
}) {
  const queryClient = useQueryClient()
  const [erro, setErro] = useState('')

  const mutacao = useMutation({
    mutationFn: () => excluirAdminUsuario(usuario.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all })
      onFechar()
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setErro(err.response?.data?.message ?? 'Erro ao excluir usuário.')
    },
  })

  return (
    <Dialog.Root open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <Dialog.Content maxWidth="420px">
        <Dialog.Title>Confirmar exclusão</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Tem certeza que deseja excluir{' '}
          <strong className="text-zinc-100">{usuario.name}</strong> ({usuario.email})? Esta ação não pode
          ser desfeita.
        </Dialog.Description>

        {erro && (
          <Text size="2" color="ruby" mb="3" className="block">
            {erro}
          </Text>
        )}

        <Flex gap="3" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Cancelar
            </Button>
          </Dialog.Close>
          <Button color="ruby" onClick={() => mutacao.mutate()} disabled={mutacao.isPending}>
            {mutacao.isPending ? <Spinner size="1" /> : null}
            Excluir
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )
}

export function AdminUsuarios() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState(VALOR_TODOS)
  const [page, setPage] = useState(1)
  const [criando, setCriando] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState<AdminUsuario | null>(null)
  const [usuarioExcluindo, setUsuarioExcluindo] = useState<AdminUsuario | null>(null)
  const searchDebounced = useDebouncedValue(search, 300)

  const query = useQuery({
    queryKey: adminKeys.usuarios({
      search: searchDebounced.trim() || undefined,
      role: role === VALOR_TODOS ? undefined : role,
      page,
    }),
    queryFn: () =>
      buscarAdminUsuarios({
        search: searchDebounced.trim() || undefined,
        role: role === VALOR_TODOS ? undefined : role,
        page,
      }),
    placeholderData: (anterior) => anterior,
  })

  const usuarios = query.data?.data ?? []
  const total = query.data?.total ?? 0
  const paginaAtual = query.data?.current_page ?? 1
  const ultimaPagina = query.data?.last_page ?? 1

  return (
    <main className="min-h-screen bg-[#0a0a0b] px-6 py-10 text-cyan-50">
      <div className="mx-auto max-w-7xl space-y-6">
        <Flex justify="between" align="end" wrap="wrap" gap="4">
          <Box className="space-y-2">
            <Text size="2" className="uppercase tracking-[0.3em] text-cyan-300/70">
              Painel admin
            </Text>
            <Heading size="8">Usuários</Heading>
            <Text size="3" className="max-w-2xl text-cyan-100/65">
              Gerencie todos os usuários da plataforma: edite nome, e-mail, perfil ou remova o acesso.
            </Text>
          </Box>

          <Flex gap="3" align="center">
            <Badge size="3" color="cyan" variant="soft">
              {total} registros
            </Badge>
            <Button size="2" onClick={() => setCriando(true)}>
              <PlusIcon />
              Novo usuário
            </Button>
          </Flex>
        </Flex>

        <Card size="4" className="border border-cyan-400/10 bg-slate-950/80 backdrop-blur">
          <Flex direction="column" gap="4">
            <Flex wrap="wrap" gap="3" align="end">
              <label className="min-w-[240px] flex-1 space-y-2">
                <Text size="2" weight="medium">
                  Buscar por nome ou e-mail
                </Text>
                <TextField.Root
                  size="3"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  placeholder="nome ou email@dominio.com"
                >
                  <TextField.Slot side="left">
                    <MagnifyingGlassIcon />
                  </TextField.Slot>
                </TextField.Root>
              </label>

              <label className="min-w-[180px] space-y-2">
                <Text size="2" weight="medium">
                  Perfil
                </Text>
                <Select.Root
                  value={role}
                  onValueChange={(v) => {
                    setRole(v)
                    setPage(1)
                  }}
                >
                  <Select.Trigger placeholder="Todos os perfis" />
                  <Select.Content>
                    <Select.Item value={VALOR_TODOS}>Todos os perfis</Select.Item>
                    {ROLES.map((r) => (
                      <Select.Item key={r.valor} value={r.valor}>
                        {r.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </label>

              <Button
                size="3"
                variant="soft"
                color="gray"
                onClick={() => {
                  setSearch('')
                  setRole(VALOR_TODOS)
                  setPage(1)
                }}
              >
                <ResetIcon />
                Limpar
              </Button>
            </Flex>

            <Separator size="4" />

            {query.isLoading ? (
              <Flex justify="center" py="8">
                <Spinner size="3" />
              </Flex>
            ) : query.isError ? (
              <Text color="ruby" size="3">
                Não foi possível carregar os usuários. Tente novamente.
              </Text>
            ) : (
              <ScrollArea type="auto" scrollbars="horizontal" className="w-full">
                <Table.Root className="min-w-[860px]">
                  <Table.Header>
                    <Table.Row className="border-b border-cyan-400/10">
                      <Table.ColumnHeaderCell>Nome</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>E-mail</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Perfil</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Criado em</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Ações</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {usuarios.length > 0 ? (
                      usuarios.map((usuario) => (
                        <Table.Row key={usuario.id} className="transition-colors hover:bg-cyan-400/5">
                          <Table.Cell className="font-medium text-cyan-50">{usuario.name}</Table.Cell>
                          <Table.Cell className="text-zinc-300">{usuario.email}</Table.Cell>
                          <Table.Cell>
                            <Badge color={badgeColorDaRole(usuario.role)} variant="soft">
                              {labelDaRole(usuario.role)}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell className="text-zinc-400">
                            {formatarDataCurta(usuario.created_at)}
                          </Table.Cell>
                          <Table.Cell>
                            <Flex gap="2">
                              <Button
                                size="1"
                                variant="ghost"
                                color="cyan"
                                onClick={() => setUsuarioEditando(usuario)}
                              >
                                <Pencil1Icon />
                                Editar
                              </Button>
                              <Button
                                size="1"
                                variant="ghost"
                                color="ruby"
                                onClick={() => setUsuarioExcluindo(usuario)}
                              >
                                <TrashIcon />
                                Excluir
                              </Button>
                            </Flex>
                          </Table.Cell>
                        </Table.Row>
                      ))
                    ) : (
                      <Table.Row>
                        <Table.Cell colSpan={5}>
                          <Box className="py-10 text-center">
                            <Text size="3" className="text-cyan-100/65">
                              Nenhum usuário encontrado com os filtros atuais.
                            </Text>
                          </Box>
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Body>
                </Table.Root>
              </ScrollArea>
            )}

            <Flex justify="between" align="center" wrap="wrap" gap="3">
              <Text size="2" className="text-cyan-100/60">
                Página {paginaAtual} de {ultimaPagina}
              </Text>

              <Flex gap="2">
                <Button
                  size="2"
                  variant="soft"
                  color="gray"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={paginaAtual <= 1}
                >
                  <ChevronLeftIcon />
                  Anterior
                </Button>
                <Button
                  size="2"
                  variant="soft"
                  color="gray"
                  onClick={() => setPage((p) => Math.min(ultimaPagina, p + 1))}
                  disabled={paginaAtual >= ultimaPagina}
                >
                  Próxima
                  <ChevronRightIcon />
                </Button>
              </Flex>
            </Flex>
          </Flex>
        </Card>
      </div>

      <ModalCriacao aberto={criando} onFechar={() => setCriando(false)} />

      {usuarioEditando && (
        <ModalEdicao
          usuario={usuarioEditando}
          aberto
          onFechar={() => setUsuarioEditando(null)}
        />
      )}

      {usuarioExcluindo && (
        <ModalExclusao
          usuario={usuarioExcluindo}
          aberto
          onFechar={() => setUsuarioExcluindo(null)}
        />
      )}
    </main>
  )
}
