import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Badge,
  Box,
  Button,
  Callout,
  Card,
  Dialog,
  Flex,
  Heading,
  IconButton,
  Progress,
  ScrollArea,
  Select,
  Separator,
  Spinner,
  Table,
  Text,
  TextField,
  Tooltip,
} from '@radix-ui/themes'
import {
  CheckCircledIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EnvelopeClosedIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ResetIcon,
  UploadIcon,
} from '@radix-ui/react-icons'
import { useEffect, useRef, useState } from 'react'
import {
  adminKeys,
  buscarAdminAssinantes,
  buscarStatusImportacao,
  importarAssinantesLastlink,
  reenviarBoasVindasAssinante,
} from '../../services/admin'
import type { ImportacaoAssinantesStatus } from '../../types/admin'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { formatarDataCurta } from '../../utils/formatters'

const VALOR_TODOS = 'all'

function ModalImportacao({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [erro, setErro] = useState('')
  const [importacaoId, setImportacaoId] = useState<string | null>(null)
  const [status, setStatus] = useState<ImportacaoAssinantesStatus | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function limpar() {
    setArquivo(null)
    setErro('')
    setImportacaoId(null)
    setStatus(null)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  useEffect(() => {
    if (!aberto) limpar()
  }, [aberto])

  useEffect(() => {
    if (!importacaoId) return

    intervalRef.current = setInterval(async () => {
      try {
        const s = await buscarStatusImportacao(importacaoId)
        setStatus(s)
        if (s.concluido) {
          clearInterval(intervalRef.current!)
          queryClient.invalidateQueries({ queryKey: adminKeys.all })
        }
      } catch {
        clearInterval(intervalRef.current!)
      }
    }, 2000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [importacaoId, queryClient])

  const mutacao = useMutation({
    mutationFn: (file: File) => importarAssinantesLastlink(file),
    onSuccess: (data) => {
      setImportacaoId(data.importacao_id)
    },
    onError: (err: { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }) => {
      const erros = err.response?.data?.errors
      setErro(erros ? Object.values(erros).flat().join(' ') : (err.response?.data?.message ?? 'Erro ao enviar arquivo.'))
    },
  })

  const emProgresso = !!importacaoId && !status?.concluido
  const concluido = status?.concluido ?? false

  return (
    <Dialog.Root
      open={aberto}
      onOpenChange={(v) => {
        if (!v) { limpar(); onFechar() }
      }}
    >
      <Dialog.Content maxWidth="520px">
        <Dialog.Title>Importar assinantes da Lastlink</Dialog.Title>
        <Dialog.Description size="2" mb="4" className="text-zinc-400">
          Envie o CSV exportado do painel Lastlink. Colunas esperadas: email, nome, plano (ou offer code),
          status, data de expiração. Separador vírgula ou ponto-e-vírgula.
        </Dialog.Description>

        <Flex direction="column" gap="4">
          {!importacaoId && (
            <label className="space-y-1.5">
              <Text size="2" weight="medium">Arquivo CSV</Text>
              <div
                className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-zinc-600 bg-zinc-900/60 px-4 py-5 transition hover:border-cyan-500/60"
                onClick={() => inputRef.current?.click()}
              >
                <UploadIcon className="size-5 text-zinc-500" />
                <Text size="2" className="text-zinc-400">
                  {arquivo ? arquivo.name : 'Clique para selecionar o arquivo .csv'}
                </Text>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  setErro('')
                  setArquivo(e.target.files?.[0] ?? null)
                }}
              />
            </label>
          )}

          {emProgresso && (
            <Flex direction="column" gap="2">
              <Flex justify="between">
                <Text size="2" className="text-zinc-400">Processando…</Text>
                <Text size="2" weight="medium">{status?.percentual ?? 0}%</Text>
              </Flex>
              <Progress value={status?.percentual ?? 0} />
              <Text size="1" className="text-zinc-500">
                {status?.processados ?? 0} de {status?.total ?? 0} registros
              </Text>
            </Flex>
          )}

          {concluido && status && (
            <Flex direction="column" gap="3">
              <Callout.Root color="green" size="1">
                <Callout.Icon><CheckCircledIcon /></Callout.Icon>
                <Callout.Text>
                  Importação concluída — {status.sucesso} importados com sucesso
                  {status.erros_count > 0 ? `, ${status.erros_count} com erro` : ''}.
                </Callout.Text>
              </Callout.Root>
              {status.erros.length > 0 && (
                <Box className="max-h-40 overflow-y-auto rounded border border-red-500/20 bg-red-950/20 p-3">
                  <Text size="1" weight="medium" className="mb-2 block text-red-400">Erros (amostra):</Text>
                  {status.erros.map((e, i) => (
                    <Text key={i} size="1" className="block text-red-300/80">{e}</Text>
                  ))}
                </Box>
              )}
            </Flex>
          )}

          {erro && (
            <Callout.Root color="ruby" size="1">
              <Callout.Icon><ExclamationTriangleIcon /></Callout.Icon>
              <Callout.Text>{erro}</Callout.Text>
            </Callout.Root>
          )}
        </Flex>

        <Flex gap="3" mt="5" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              {concluido ? 'Fechar' : 'Cancelar'}
            </Button>
          </Dialog.Close>
          {!importacaoId && (
            <Button
              onClick={() => arquivo && mutacao.mutate(arquivo)}
              disabled={!arquivo || mutacao.isPending}
            >
              {mutacao.isPending ? <Spinner size="1" /> : <UploadIcon />}
              Importar
            </Button>
          )}
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )
}

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
  const [importando, setImportando] = useState(false)
  const [reenvioFeedback, setReenvioFeedback] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)
  const [reenvioEmAndamento, setReenvioEmAndamento] = useState<number | null>(null)
  const searchDebounced = useDebouncedValue(search, 300)

  const mutacaoReenvio = useMutation({
    mutationFn: (id: number) => reenviarBoasVindasAssinante(id),
    onMutate: (id) => setReenvioEmAndamento(id),
    onSuccess: (data) => {
      setReenvioFeedback({ tipo: 'sucesso', mensagem: data.message })
      setReenvioEmAndamento(null)
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setReenvioFeedback({ tipo: 'erro', mensagem: err.response?.data?.message ?? 'Erro ao reenviar e-mail.' })
      setReenvioEmAndamento(null)
    },
  })

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

          <Flex gap="3" align="center">
            <Badge size="3" color="cyan" variant="soft">
              {total} registros
            </Badge>
            <Button size="2" variant="soft" onClick={() => setImportando(true)}>
              <UploadIcon />
              Importar CSV
            </Button>
          </Flex>
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

            {reenvioFeedback && (
              <Callout.Root color={reenvioFeedback.tipo === 'sucesso' ? 'green' : 'ruby'} size="1">
                <Callout.Icon>
                  {reenvioFeedback.tipo === 'sucesso' ? <CheckCircledIcon /> : <ExclamationTriangleIcon />}
                </Callout.Icon>
                <Callout.Text>{reenvioFeedback.mensagem}</Callout.Text>
                <Button
                  variant="ghost"
                  size="1"
                  color={reenvioFeedback.tipo === 'sucesso' ? 'green' : 'ruby'}
                  ml="auto"
                  onClick={() => setReenvioFeedback(null)}
                >
                  Fechar
                </Button>
              </Callout.Root>
            )}

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
                      <Table.ColumnHeaderCell>Ações</Table.ColumnHeaderCell>
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
                          <Table.Cell>
                            <Tooltip content="Reenviar e-mail de boas-vindas">
                              <IconButton
                                size="1"
                                variant="ghost"
                                color="cyan"
                                disabled={reenvioEmAndamento === assinante.id}
                                onClick={() => {
                                  setReenvioFeedback(null)
                                  mutacaoReenvio.mutate(assinante.id)
                                }}
                              >
                                {reenvioEmAndamento === assinante.id ? (
                                  <Spinner size="1" />
                                ) : (
                                  <EnvelopeClosedIcon />
                                )}
                              </IconButton>
                            </Tooltip>
                          </Table.Cell>
                        </Table.Row>
                      ))
                    ) : (
                      <Table.Row>
                        <Table.Cell colSpan={7}>
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

      <ModalImportacao aberto={importando} onFechar={() => setImportando(false)} />
    </main>
  )
}
