import { useQuery } from '@tanstack/react-query'
import {
  Badge,
  Box,
  Button,
  Card,
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
import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, ResetIcon } from '@radix-ui/react-icons'
import { useState } from 'react'
import { buscarAdminAssinantes, adminKeys } from '../../services/admin'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { formatarDataCurta } from '../../utils/formatters'

const VALOR_TODOS = 'all'

function badgeColorDoStatus(status: string) {
  const normalizado = status.toLowerCase()

  if (['ativo', 'active', 'paid', 'aprovado'].includes(normalizado)) {
    return 'green'
  }

  if (['pendente', 'pending', 'trial'].includes(normalizado)) {
    return 'amber'
  }

  if (['cancelado', 'canceled', 'expired', 'inativo'].includes(normalizado)) {
    return 'ruby'
  }

  return 'gray'
}

function badgeColorDoPlano(plano: string) {
  const normalizado = plano.toLowerCase()

  if (normalizado.includes('reservado')) {
    return 'purple'
  }

  if (normalizado.includes('pro')) {
    return 'cyan'
  }

  if (normalizado.includes('essencial')) {
    return 'amber'
  }

  return 'gray'
}

export function AdminAssinantes() {
  const [search, setSearch] = useState('')
  const [plano, setPlano] = useState(VALOR_TODOS)
  const [status, setStatus] = useState(VALOR_TODOS)
  const [page, setPage] = useState(1)
  const searchDebounced = useDebouncedValue(search, 300)

  const query = useQuery({
    queryKey: adminKeys.assinantes({
      search: searchDebounced.trim() || undefined,
      plano: plano === VALOR_TODOS ? undefined : plano,
      status: status === VALOR_TODOS ? undefined : status,
      page,
    }),
    queryFn: () =>
      buscarAdminAssinantes({
        search: searchDebounced.trim() || undefined,
        plano: plano === VALOR_TODOS ? undefined : plano,
        status: status === VALOR_TODOS ? undefined : status,
        page,
      }),
    placeholderData: (dadosAnteriores) => dadosAnteriores,
  })

  const assinantes = query.data?.data ?? []
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
            <Heading size="8">Assinantes</Heading>
            <Text size="3" className="max-w-2xl text-cyan-100/65">
              Lista de assinantes com busca em tempo real, filtros por plano e status, e paginação de 25 itens.
            </Text>
          </Box>

          <Badge size="3" color="cyan" variant="soft">
            {total} registros
          </Badge>
        </Flex>

        <Card size="4" className="border border-cyan-400/10 bg-slate-950/80 backdrop-blur">
          <Flex direction="column" gap="4">
            <Flex wrap="wrap" gap="3" align="end">
              <label className="min-w-[240px] flex-1 space-y-2">
                <Text size="2" weight="medium">
                  Buscar por e-mail
                </Text>
                <TextField.Root
                  size="3"
                  value={search}
                  onChange={(evento) => {
                    setSearch(evento.target.value)
                    setPage(1)
                  }}
                  placeholder="nome@dominio.com"
                >
                  <TextField.Slot side="left">
                    <MagnifyingGlassIcon />
                  </TextField.Slot>
                </TextField.Root>
              </label>

              <label className="min-w-[180px] space-y-2">
                <Text size="2" weight="medium">
                  Plano
                </Text>
                <Select.Root
                  value={plano}
                  onValueChange={(valor) => {
                    setPlano(valor)
                    setPage(1)
                  }}
                >
                  <Select.Trigger placeholder="Todos os planos" />
                  <Select.Content>
                    <Select.Item value={VALOR_TODOS}>Todos os planos</Select.Item>
                    <Select.Item value="essencial">Essencial</Select.Item>
                    <Select.Item value="pro">Pro</Select.Item>
                    <Select.Item value="reservado">Reservado</Select.Item>
                  </Select.Content>
                </Select.Root>
              </label>

              <label className="min-w-[180px] space-y-2">
                <Text size="2" weight="medium">
                  Status
                </Text>
                <Select.Root
                  value={status}
                  onValueChange={(valor) => {
                    setStatus(valor)
                    setPage(1)
                  }}
                >
                  <Select.Trigger placeholder="Todos os status" />
                  <Select.Content>
                    <Select.Item value={VALOR_TODOS}>Todos os status</Select.Item>
                    <Select.Item value="ativo">Ativo</Select.Item>
                    <Select.Item value="pendente">Pendente</Select.Item>
                    <Select.Item value="cancelado">Cancelado</Select.Item>
                    <Select.Item value="expirado">Expirado</Select.Item>
                  </Select.Content>
                </Select.Root>
              </label>

              <Button
                size="3"
                variant="soft"
                color="gray"
                onClick={() => {
                  setSearch('')
                  setPlano(VALOR_TODOS)
                  setStatus(VALOR_TODOS)
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
                Nao foi possivel carregar os assinantes. Tente novamente.
              </Text>
            ) : (
              <ScrollArea type="auto" scrollbars="horizontal" className="w-full">
                <Table.Root className="min-w-[980px]">
                  <Table.Header>
                    <Table.Row className="border-b border-cyan-400/10">
                      <Table.ColumnHeaderCell>E-mail</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Nome</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Plano</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Ativo</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Assinado em</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {assinantes.length > 0 ? (
                      assinantes.map((assinante) => (
                        <Table.Row key={assinante.id} className="transition-colors hover:bg-cyan-400/5">
                          <Table.Cell className="text-cyan-50">{assinante.email}</Table.Cell>
                          <Table.Cell>{assinante.name}</Table.Cell>
                          <Table.Cell>
                            <Badge color={badgeColorDoPlano(assinante.plano)} variant="soft">
                              {assinante.plano}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell>
                            <Badge color={badgeColorDoStatus(assinante.status)} variant="soft">
                              {assinante.status}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell>
                            <Badge color={assinante.ativo ? 'green' : 'gray'} variant="soft">
                              {assinante.ativo ? 'Sim' : 'Nao'}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell>{formatarDataCurta(assinante.assinado_em)}</Table.Cell>
                        </Table.Row>
                      ))
                    ) : (
                      <Table.Row>
                        <Table.Cell colSpan={6}>
                          <Box className="py-10 text-center">
                            <Text size="3" className="text-cyan-100/65">
                              Nenhum assinante encontrado com os filtros atuais.
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
                  onClick={() => setPage((atual) => Math.max(1, atual - 1))}
                  disabled={paginaAtual <= 1}
                >
                  <ChevronLeftIcon />
                  Anterior
                </Button>
                <Button
                  size="2"
                  variant="soft"
                  color="gray"
                  onClick={() => setPage((atual) => Math.min(ultimaPagina, atual + 1))}
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
    </main>
  )
}
