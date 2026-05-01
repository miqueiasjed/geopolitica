import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertDialog,
  Badge,
  Box,
  Button,
  Card,
  Callout,
  Checkbox,
  Flex,
  Heading,
  ScrollArea,
  Select,
  Separator,
  Spinner,
  Table,
  Text,
} from '@radix-ui/themes'
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  ReloadIcon,
  ResetIcon,
  TrashIcon,
} from '@radix-ui/react-icons'
import { useState } from 'react'
import {
  adminKeys,
  buscarAdminWebhookEventos,
  excluirWebhookEventos,
  reprocessarWebhookEvento,
} from '../../services/admin'
import { formatarDataCurta, formatarJsonPretty } from '../../utils/formatters'
import type { AdminWebhookEvento } from '../../types/admin'

const VALOR_TODOS = 'all'

const TIPOS_HOTMART = [
  'PURCHASE_APPROVED',
  'PURCHASE_COMPLETE',
  'PURCHASE_CANCELED',
  'PURCHASE_REFUNDED',
  'PURCHASE_CHARGEBACK',
  'PURCHASE_EXPIRED',
  'SWITCH_PLAN',
]

const TIPOS_LASTLINK = [
  'LASTLINK_APPROVED',
  'LASTLINK_COMPLETE',
  'LASTLINK_PAID',
  'LASTLINK_ORDER_CONFIRMED',
  'LASTLINK_PURCHASE_ORDER_CONFIRMED',
  'LASTLINK_CANCELLED',
  'LASTLINK_CANCELED',
  'LASTLINK_SUBSCRIPTION_CANCELED',
  'LASTLINK_REFUNDED',
  'LASTLINK_PURCHASE_REFUNDED',
  'LASTLINK_CHARGEBACK',
]

function badgeFonte(fonte: string) {
  return fonte === 'lastlink' ? 'violet' : 'orange'
}

function badgeProcessamento(processado: boolean, erro: string | null) {
  if (erro) return 'red'
  return processado ? 'green' : 'amber'
}

function labelProcessamento(processado: boolean, erro: string | null) {
  if (erro) return 'Erro'
  return processado ? 'Processado' : 'Pendente'
}

function DetalheEvento({
  evento,
  onReprocessar,
  reprocessando,
}: {
  evento: AdminWebhookEvento
  onReprocessar: () => void
  reprocessando: boolean
}) {
  return (
    <Box className="space-y-4 py-2">
      <Flex gap="6" wrap="wrap" align="start" justify="between">
        <Flex gap="6" wrap="wrap">
          {evento.processado_em && (
            <Box className="space-y-1">
              <Text size="1" className="uppercase tracking-[0.24em] text-cyan-100/45">
                Processado em
              </Text>
              <Text size="2">{formatarDataCurta(evento.processado_em)}</Text>
            </Box>
          )}
          {evento.hotmart_subscriber_code && (
            <Box className="space-y-1">
              <Text size="1" className="uppercase tracking-[0.24em] text-cyan-100/45">
                Subscriber Code
              </Text>
              <Text size="2" className="font-mono">
                {evento.hotmart_subscriber_code}
              </Text>
            </Box>
          )}
          {evento.log_acao && (
            <Box className="space-y-1">
              <Text size="1" className="uppercase tracking-[0.24em] text-cyan-100/45">
                Ação executada
              </Text>
              <Text size="2">{evento.log_acao}</Text>
            </Box>
          )}
        </Flex>

        <Button
          size="2"
          variant="soft"
          color="cyan"
          loading={reprocessando}
          onClick={onReprocessar}
        >
          <ReloadIcon />
          Reprocessar
        </Button>
      </Flex>

      {evento.erro && (
        <Callout.Root color="red" size="1">
          <Callout.Icon>
            <ExclamationTriangleIcon />
          </Callout.Icon>
          <Callout.Text className="font-mono text-sm">{evento.erro}</Callout.Text>
        </Callout.Root>
      )}

      <Box className="space-y-2">
        <Text size="2" className="uppercase tracking-[0.24em] text-cyan-100/45">
          Payload JSON
        </Text>
        <Card size="2" className="border border-cyan-400/10 bg-slate-950/90">
          <ScrollArea type="auto" scrollbars="both" className="max-h-[360px]">
            <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[12px] leading-6 text-cyan-50">
              {formatarJsonPretty(evento.payload)}
            </pre>
          </ScrollArea>
        </Card>
      </Box>
    </Box>
  )
}

export function AdminWebhookEventos() {
  const queryClient = useQueryClient()

  const [fonte, setFonte] = useState(VALOR_TODOS)
  const [type, setType] = useState(VALOR_TODOS)
  const [processado, setProcessado] = useState(VALOR_TODOS)
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set())

  const query = useQuery({
    queryKey: adminKeys.webhookEventos({
      fonte: fonte === VALOR_TODOS ? undefined : fonte,
      type: type === VALOR_TODOS ? undefined : type,
      processado: processado === VALOR_TODOS ? undefined : processado,
      page,
    }),
    queryFn: () =>
      buscarAdminWebhookEventos({
        fonte: fonte === VALOR_TODOS ? undefined : fonte,
        type: type === VALOR_TODOS ? undefined : type,
        processado: processado === VALOR_TODOS ? undefined : processado,
        page,
      }),
    placeholderData: (dadosAnteriores) => dadosAnteriores,
  })

  const mutacaoExcluir = useMutation({
    mutationFn: excluirWebhookEventos,
    onSuccess: () => {
      setSelecionados(new Set())
      queryClient.invalidateQueries({ queryKey: adminKeys.all })
    },
  })

  const mutacaoReprocessar = useMutation({
    mutationFn: reprocessarWebhookEvento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all })
    },
  })

  const eventos = query.data?.data ?? []
  const total = query.data?.total ?? 0
  const paginaAtual = query.data?.current_page ?? 1
  const ultimaPagina = query.data?.last_page ?? 1

  const idsDaPagina = eventos.map((e) => e.id)
  const todosSelecionados = idsDaPagina.length > 0 && idsDaPagina.every((id) => selecionados.has(id))
  const algunsSelecionados = idsDaPagina.some((id) => selecionados.has(id)) && !todosSelecionados

  function toggleTodos() {
    setSelecionados((prev) => {
      const next = new Set(prev)
      if (todosSelecionados) {
        idsDaPagina.forEach((id) => next.delete(id))
      } else {
        idsDaPagina.forEach((id) => next.add(id))
      }
      return next
    })
  }

  function toggleEvento(id: number) {
    setSelecionados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function limparFiltros() {
    setFonte(VALOR_TODOS)
    setType(VALOR_TODOS)
    setProcessado(VALOR_TODOS)
    setPage(1)
  }

  function toggleExpanded(id: number) {
    setExpandedId((atual) => (atual === id ? null : id))
  }

  const qtdSelecionados = selecionados.size

  return (
    <main className="min-h-screen bg-[#0a0a0b] px-6 py-10 text-cyan-50">
      <div className="mx-auto max-w-7xl space-y-6">
        <Flex justify="between" align="end" wrap="wrap" gap="4">
          <Box className="space-y-2">
            <Text size="2" className="uppercase tracking-[0.3em] text-cyan-300/70">
              Painel admin
            </Text>
            <Heading size="8">Logs de Webhook</Heading>
            <Text size="3" className="max-w-2xl text-cyan-100/65">
              Registro de todos os eventos recebidos via webhook (Lastlink e Hotmart), com payload
              completo, status de processamento e erros.
            </Text>
          </Box>

          <Badge size="3" color="cyan" variant="soft">
            {total} eventos
          </Badge>
        </Flex>

        <Card size="4" className="border border-cyan-400/10 bg-slate-950/80 backdrop-blur">
          <Flex direction="column" gap="4">
            <Flex wrap="wrap" gap="3" align="end" justify="between">
              <Flex wrap="wrap" gap="3" align="end">
                <label className="min-w-[180px] space-y-2">
                  <Text size="2" weight="medium">
                    Origem
                  </Text>
                  <Select.Root
                    value={fonte}
                    onValueChange={(valor) => {
                      setFonte(valor)
                      setType(VALOR_TODOS)
                      setPage(1)
                    }}
                  >
                    <Select.Trigger placeholder="Todas as origens" />
                    <Select.Content>
                      <Select.Item value={VALOR_TODOS}>Todas as origens</Select.Item>
                      <Select.Item value="lastlink">Lastlink</Select.Item>
                      <Select.Item value="hotmart">Hotmart</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </label>

                <label className="min-w-[240px] space-y-2">
                  <Text size="2" weight="medium">
                    Tipo do evento
                  </Text>
                  <Select.Root
                    value={type}
                    onValueChange={(valor) => {
                      setType(valor)
                      setPage(1)
                    }}
                  >
                    <Select.Trigger placeholder="Todos os tipos" />
                    <Select.Content>
                      <Select.Item value={VALOR_TODOS}>Todos os tipos</Select.Item>
                      {(fonte === VALOR_TODOS || fonte === 'hotmart') && (
                        <Select.Group>
                          <Select.Label>Hotmart</Select.Label>
                          {TIPOS_HOTMART.map((t) => (
                            <Select.Item key={t} value={t}>
                              {t}
                            </Select.Item>
                          ))}
                        </Select.Group>
                      )}
                      {(fonte === VALOR_TODOS || fonte === 'lastlink') && (
                        <Select.Group>
                          <Select.Label>Lastlink</Select.Label>
                          {TIPOS_LASTLINK.map((t) => (
                            <Select.Item key={t} value={t}>
                              {t}
                            </Select.Item>
                          ))}
                        </Select.Group>
                      )}
                    </Select.Content>
                  </Select.Root>
                </label>

                <label className="min-w-[180px] space-y-2">
                  <Text size="2" weight="medium">
                    Status
                  </Text>
                  <Select.Root
                    value={processado}
                    onValueChange={(valor) => {
                      setProcessado(valor)
                      setPage(1)
                    }}
                  >
                    <Select.Trigger placeholder="Todos os status" />
                    <Select.Content>
                      <Select.Item value={VALOR_TODOS}>Todos</Select.Item>
                      <Select.Item value="true">Processados</Select.Item>
                      <Select.Item value="false">Pendentes</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </label>

                <Button size="3" variant="soft" color="gray" onClick={limparFiltros}>
                  <ResetIcon />
                  Limpar
                </Button>
              </Flex>

              {qtdSelecionados > 0 && (
                <AlertDialog.Root>
                  <AlertDialog.Trigger>
                    <Button size="3" color="red" variant="soft">
                      <TrashIcon />
                      Excluir {qtdSelecionados} {qtdSelecionados === 1 ? 'evento' : 'eventos'}
                    </Button>
                  </AlertDialog.Trigger>
                  <AlertDialog.Content maxWidth="420px">
                    <AlertDialog.Title>Excluir eventos</AlertDialog.Title>
                    <AlertDialog.Description size="2">
                      Tem certeza que deseja excluir {qtdSelecionados}{' '}
                      {qtdSelecionados === 1 ? 'evento selecionado' : 'eventos selecionados'}? Essa
                      ação não pode ser desfeita.
                    </AlertDialog.Description>
                    <Flex gap="3" mt="4" justify="end">
                      <AlertDialog.Cancel>
                        <Button variant="soft" color="gray">
                          Cancelar
                        </Button>
                      </AlertDialog.Cancel>
                      <AlertDialog.Action>
                        <Button
                          color="red"
                          loading={mutacaoExcluir.isPending}
                          onClick={() => mutacaoExcluir.mutate([...selecionados])}
                        >
                          Excluir
                        </Button>
                      </AlertDialog.Action>
                    </Flex>
                  </AlertDialog.Content>
                </AlertDialog.Root>
              )}
            </Flex>

            <Separator size="4" />

            {query.isLoading ? (
              <Flex justify="center" py="8">
                <Spinner size="3" />
              </Flex>
            ) : query.isError ? (
              <Text color="ruby" size="3">
                Não foi possível carregar os eventos do webhook. Tente novamente.
              </Text>
            ) : (
              <ScrollArea type="auto" scrollbars="horizontal" className="w-full">
                <Table.Root className="min-w-[1020px]">
                  <Table.Header>
                    <Table.Row className="border-b border-cyan-400/10">
                      <Table.ColumnHeaderCell width="40px">
                        <Checkbox
                          checked={todosSelecionados ? true : algunsSelecionados ? 'indeterminate' : false}
                          onCheckedChange={toggleTodos}
                          aria-label="Selecionar todos"
                        />
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Origem</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Tipo</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>E-mail</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Recebido em</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {eventos.length > 0 ? (
                      eventos.flatMap((evento) => {
                        const expandido = expandedId === evento.id
                        const selecionado = selecionados.has(evento.id)

                        return [
                          <Table.Row
                            key={evento.id}
                            className={`transition-colors hover:bg-cyan-400/5 ${selecionado ? 'bg-cyan-400/5' : ''}`}
                          >
                            <Table.Cell
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                checked={selecionado}
                                onCheckedChange={() => toggleEvento(evento.id)}
                                aria-label={`Selecionar evento ${evento.id}`}
                              />
                            </Table.Cell>
                            <Table.Cell>
                              <Badge
                                color={badgeFonte(evento.fonte)}
                                variant="soft"
                                size="1"
                                className="uppercase"
                              >
                                {evento.fonte}
                              </Badge>
                            </Table.Cell>
                            <Table.Cell
                              className="cursor-pointer"
                              onClick={() => toggleExpanded(evento.id)}
                            >
                              <Flex align="center" gap="2">
                                <ChevronDownIcon
                                  className={`shrink-0 transition-transform ${expandido ? 'rotate-180' : 'rotate-0'}`}
                                />
                                <Text size="2" weight="medium">
                                  {evento.event_type}
                                </Text>
                              </Flex>
                            </Table.Cell>
                            <Table.Cell>
                              <Text size="2">{evento.email ?? '—'}</Text>
                            </Table.Cell>
                            <Table.Cell>
                              <Badge
                                color={badgeProcessamento(evento.processado, evento.erro)}
                                variant="soft"
                              >
                                {labelProcessamento(evento.processado, evento.erro)}
                              </Badge>
                            </Table.Cell>
                            <Table.Cell>
                              <Text size="2">{formatarDataCurta(evento.created_at)}</Text>
                            </Table.Cell>
                          </Table.Row>,
                          expandido ? (
                            <Table.Row key={`${evento.id}-detalhe`} className="bg-cyan-400/5">
                              <Table.Cell colSpan={6}>
                                <DetalheEvento
                                  evento={evento}
                                  onReprocessar={() => mutacaoReprocessar.mutate(evento.id)}
                                  reprocessando={
                                    mutacaoReprocessar.isPending &&
                                    mutacaoReprocessar.variables === evento.id
                                  }
                                />
                              </Table.Cell>
                            </Table.Row>
                          ) : null,
                        ]
                      })
                    ) : (
                      <Table.Row>
                        <Table.Cell colSpan={6}>
                          <Box className="py-10 text-center">
                            <Text size="3" className="text-cyan-100/65">
                              Nenhum evento encontrado com os filtros atuais.
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
                {qtdSelecionados > 0
                  ? `${qtdSelecionados} selecionado${qtdSelecionados > 1 ? 's' : ''} · `
                  : ''}
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
