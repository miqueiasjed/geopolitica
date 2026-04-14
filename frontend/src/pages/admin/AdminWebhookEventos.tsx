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
} from '@radix-ui/themes'
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ResetIcon } from '@radix-ui/react-icons'
import { useState } from 'react'
import { adminKeys, buscarAdminWebhookEventos } from '../../services/admin'
import { formatarDataCurta, formatarJsonPretty } from '../../utils/formatters'

const VALOR_TODOS = 'all'

function badgeColorDoProcessamento(processado: boolean) {
  return processado ? 'green' : 'amber'
}

export function AdminWebhookEventos() {
  const [type, setType] = useState(VALOR_TODOS)
  const [processado, setProcessado] = useState(VALOR_TODOS)
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const query = useQuery({
    queryKey: adminKeys.webhookEventos({
      type: type === VALOR_TODOS ? undefined : type,
      processado: processado === VALOR_TODOS ? undefined : processado,
      page,
    }),
    queryFn: () =>
      buscarAdminWebhookEventos({
        type: type === VALOR_TODOS ? undefined : type,
        processado: processado === VALOR_TODOS ? undefined : processado,
        page,
      }),
    placeholderData: (dadosAnteriores) => dadosAnteriores,
  })

  const eventos = query.data?.data ?? []
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
            <Heading size="8">Eventos do webhook</Heading>
            <Text size="3" className="max-w-2xl text-cyan-100/65">
              Monitoramento dos eventos recebidos, com filtros por tipo e status de processamento.
            </Text>
          </Box>

          <Badge size="3" color="cyan" variant="soft">
            {total} eventos
          </Badge>
        </Flex>

        <Card size="4" className="border border-cyan-400/10 bg-slate-950/80 backdrop-blur">
          <Flex direction="column" gap="4">
            <Flex wrap="wrap" gap="3" align="end">
              <label className="min-w-[220px] space-y-2">
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
                    <Select.Item value="PURCHASE_APPROVED">PURCHASE_APPROVED</Select.Item>
                    <Select.Item value="PURCHASE_COMPLETE">PURCHASE_COMPLETE</Select.Item>
                    <Select.Item value="PURCHASE_CANCELED">PURCHASE_CANCELED</Select.Item>
                    <Select.Item value="PURCHASE_REFUNDED">PURCHASE_REFUNDED</Select.Item>
                    <Select.Item value="PURCHASE_CHARGEBACK">PURCHASE_CHARGEBACK</Select.Item>
                    <Select.Item value="PURCHASE_EXPIRED">PURCHASE_EXPIRED</Select.Item>
                    <Select.Item value="SWITCH_PLAN">SWITCH_PLAN</Select.Item>
                  </Select.Content>
                </Select.Root>
              </label>

              <label className="min-w-[220px] space-y-2">
                <Text size="2" weight="medium">
                  Processamento
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

              <Button
                size="3"
                variant="soft"
                color="gray"
                onClick={() => {
                  setType(VALOR_TODOS)
                  setProcessado(VALOR_TODOS)
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
                Nao foi possivel carregar os eventos do webhook. Tente novamente.
              </Text>
            ) : (
              <ScrollArea type="auto" scrollbars="horizontal" className="w-full">
                <Table.Root className="min-w-[920px]">
                  <Table.Header>
                    <Table.Row className="border-b border-cyan-400/10">
                      <Table.ColumnHeaderCell>Tipo</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>E-mail</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Processado</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Criado em</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {eventos.length > 0 ? (
                      eventos.flatMap((evento) => {
                        const expandido = expandedId === evento.id

                        return [
                          <Table.Row
                            key={evento.id}
                            className="cursor-pointer transition-colors hover:bg-cyan-400/5"
                            aria-expanded={expandido}
                            tabIndex={0}
                            onClick={() => setExpandedId((atual) => (atual === evento.id ? null : evento.id))}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                setExpandedId((atual) => (atual === evento.id ? null : evento.id))
                              }
                            }}
                          >
                            <Table.Cell className="font-medium">
                              <Flex align="center" gap="2">
                                <ChevronDownIcon
                                  className={`transition-transform ${expandido ? 'rotate-180' : 'rotate-0'}`}
                                />
                                <Text>{evento.event_type}</Text>
                              </Flex>
                            </Table.Cell>
                            <Table.Cell>{evento.email ?? 'Sem e-mail'}</Table.Cell>
                            <Table.Cell>
                              <Badge color={badgeColorDoProcessamento(evento.processado)} variant="soft">
                                {evento.processado ? 'Processado' : 'Pendente'}
                              </Badge>
                            </Table.Cell>
                            <Table.Cell>{formatarDataCurta(evento.created_at)}</Table.Cell>
                          </Table.Row>,
                          expandido ? (
                            <Table.Row key={`${evento.id}-payload`} className="bg-cyan-400/5">
                              <Table.Cell colSpan={4}>
                                <Box className="space-y-3 py-2">
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
                              </Table.Cell>
                            </Table.Row>
                          ) : null,
                        ]
                      })
                    ) : (
                      <Table.Row>
                        <Table.Cell colSpan={4}>
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
