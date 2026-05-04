import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Badge,
  Box,
  Button,
  Callout,
  Card,
  Checkbox,
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
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  adminKeys,
  buscarAdminAssinantes,
  buscarPlanosAtivos,
  buscarStatusImportacao,
  importarAssinantesLastlink,
  reenviarBoasVindasAssinante,
} from '../../services/admin'
import type { ImportacaoAssinantesPayload, ImportacaoAssinantesStatus, LinhaImportacaoAssinante } from '../../types/admin'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { formatarDataCurta } from '../../utils/formatters'

const VALOR_TODOS = 'all'
const SENHA_PADRAO = '12345678'

const CHAVES_IMPORTACAO = {
  email: ['email', 'e-mail', 'mail', 'e_mail', 'e-mail do membro', 'email do membro'],
  nome: ['nome', 'name', 'nome completo', 'customer name', 'nome/razão social do membro', 'nome/razao social do membro'],
  plano: ['plano', 'plan', 'offer', 'offer_code', 'nome da oferta', 'produto', 'produto principal'],
  status: ['status', 'status da venda', 'subscription_status', 'order_status'],
  expira_em: ['expira_em', 'data da expiração', 'data da expiracao', 'data de expiração', 'valid_until', 'expires_at'],
  assinado_em: ['assinado_em', 'data da venda', 'data de assinatura', 'created_at'],
}

function normalizarChave(chave: string) {
  return chave.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
}

function valorDaLinha(linha: Record<string, unknown>, chaves: string[]) {
  const normalizada = Object.fromEntries(
    Object.entries(linha).map(([chave, valor]) => [normalizarChave(chave), valor]),
  )

  for (const chave of chaves) {
    const valor = normalizada[normalizarChave(chave)]

    if (valor !== undefined && valor !== null && String(valor).trim() !== '') {
      return String(valor).trim()
    }
  }

  return ''
}

function resolverPlanoInicial(valor: string) {
  const normalizado = normalizarChave(valor)

  if (['essencial', 'pro', 'reservado'].includes(normalizado)) return normalizado
  if (normalizado.includes('reservado')) return 'reservado'
  if (/\bpro\b/.test(normalizado)) return 'pro'
  if (normalizado.includes('essencial') || normalizado.includes('essential')) return 'essencial'

  return ''
}

function normalizarData(valor: string) {
  if (!valor) return ''

  const iso = valor.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return iso[0]

  const br = valor.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
  if (br) {
    const [, dia, mes, anoRaw] = br
    const ano = anoRaw.length === 2 ? `20${anoRaw}` : anoRaw
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
  }

  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? '' : data.toISOString().slice(0, 10)
}

function montarLinhaImportacao(linha: Record<string, unknown>, planoPadrao: string): LinhaImportacaoAssinante {
  const planoRaw = valorDaLinha(linha, CHAVES_IMPORTACAO.plano)
  const statusRaw = valorDaLinha(linha, CHAVES_IMPORTACAO.status)

  return {
    email: valorDaLinha(linha, CHAVES_IMPORTACAO.email),
    nome: valorDaLinha(linha, CHAVES_IMPORTACAO.nome),
    plano: resolverPlanoInicial(planoRaw) || planoPadrao,
    status: statusRaw || 'ativo',
    expira_em: normalizarData(valorDaLinha(linha, CHAVES_IMPORTACAO.expira_em)),
    assinado_em: normalizarData(valorDaLinha(linha, CHAVES_IMPORTACAO.assinado_em)),
    origem: linha,
  }
}

function linhasDaMatriz(matriz: unknown[][], planoPadrao: string) {
  const [cabecalhosRaw, ...linhasRaw] = matriz
  const cabecalhos = (cabecalhosRaw ?? []).map((valor) => String(valor ?? '').trim())

  return linhasRaw
    .map((valores) =>
      Object.fromEntries(
        cabecalhos.map((cabecalho, indice) => [cabecalho || `coluna_${indice + 1}`, valores[indice] ?? '']),
      ),
    )
    .map((linha) => montarLinhaImportacao(linha, planoPadrao))
    .filter((linha) => linha.email || linha.nome)
}

function parseCsv(texto: string) {
  const primeiraLinha = texto.split(/\r?\n/).find((linha) => linha.trim()) ?? ''
  const separador = (primeiraLinha.match(/;/g)?.length ?? 0) > (primeiraLinha.match(/,/g)?.length ?? 0) ? ';' : ','
  const linhas: string[][] = []
  let campo = ''
  let linha: string[] = []
  let entreAspas = false

  for (let indice = 0; indice < texto.length; indice += 1) {
    const char = texto[indice]
    const proximo = texto[indice + 1]

    if (char === '"' && entreAspas && proximo === '"') {
      campo += '"'
      indice += 1
    } else if (char === '"') {
      entreAspas = !entreAspas
    } else if (char === separador && !entreAspas) {
      linha.push(campo)
      campo = ''
    } else if ((char === '\n' || char === '\r') && !entreAspas) {
      if (char === '\r' && proximo === '\n') indice += 1
      linha.push(campo)
      if (linha.some((valor) => valor.trim())) linhas.push(linha)
      linha = []
      campo = ''
    } else {
      campo += char
    }
  }

  linha.push(campo)
  if (linha.some((valor) => valor.trim())) linhas.push(linha)

  return linhas
}

function ModalImportacao({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [linhas, setLinhas] = useState<LinhaImportacaoAssinante[]>([])
  const [planoPadrao, setPlanoPadrao] = useState('')
  const [senhaPadrao, setSenhaPadrao] = useState(SENHA_PADRAO)
  const [enviarEmail, setEnviarEmail] = useState(true)
  const [erro, setErro] = useState('')
  const [importacaoId, setImportacaoId] = useState<string | null>(null)
  const [status, setStatus] = useState<ImportacaoAssinantesStatus | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const planosQuery = useQuery({ queryKey: adminKeys.planosAtivos(), queryFn: buscarPlanosAtivos })

  function limpar() {
    setArquivo(null)
    setLinhas([])
    setPlanoPadrao('')
    setSenhaPadrao(SENHA_PADRAO)
    setEnviarEmail(true)
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
    mutationFn: (payload: ImportacaoAssinantesPayload) => importarAssinantesLastlink(payload),
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
  const linhasValidas = useMemo(
    () => linhas.filter((linha) => linha.email.trim() && linha.plano?.trim()),
    [linhas],
  )
  const temLinhasInvalidas = linhasValidas.length !== linhas.length

  async function carregarArquivo(file: File) {
    setErro('')
    setArquivo(file)

    try {
      const extensao = file.name.split('.').pop()?.toLowerCase()
      const matriz = extensao === 'csv'
        ? parseCsv(await file.text())
        : await import('read-excel-file/browser').then((modulo) => modulo.readSheet(file))
      const linhasMapeadas = linhasDaMatriz(matriz, planoPadrao)

      if (linhasMapeadas.length === 0) {
        setErro('Nenhum assinante encontrado no arquivo.')
        setLinhas([])
        return
      }

      setLinhas(linhasMapeadas)
    } catch {
      setErro('Não foi possível ler o arquivo. Envie um .xlsx ou .csv exportado da Lastlink.')
      setLinhas([])
    }
  }

  function atualizarLinha(indice: number, campo: keyof LinhaImportacaoAssinante, valor: string) {
    setLinhas((atuais) => atuais.map((linha, i) => (i === indice ? { ...linha, [campo]: valor } : linha)))
  }

  function aplicarPlanoEmTodas() {
    if (!planoPadrao) return
    setLinhas((atuais) => atuais.map((linha) => ({ ...linha, plano: planoPadrao })))
  }

  function iniciarImportacao() {
    if (linhasValidas.length === 0) {
      setErro('Informe pelo menos uma linha com e-mail e plano.')
      return
    }

    if (senhaPadrao.trim().length < 8) {
      setErro('A senha padrão precisa ter pelo menos 8 caracteres.')
      return
    }

    mutacao.mutate({
      plano_padrao: planoPadrao || undefined,
      senha_padrao: senhaPadrao.trim(),
      enviar_email: enviarEmail,
      linhas: linhasValidas,
    })
  }

  return (
    <Dialog.Root
      open={aberto}
      onOpenChange={(v) => {
        if (!v) { limpar(); onFechar() }
      }}
    >
      <Dialog.Content maxWidth="960px">
        <Dialog.Title>Importar assinantes da Lastlink</Dialog.Title>
        <Dialog.Description size="2" mb="4" className="text-zinc-400">
          Envie o XLSX ou CSV exportado da Lastlink, revise os campos, escolha o plano e enfileire a importação.
        </Dialog.Description>

        <Flex direction="column" gap="4">
          {!importacaoId && (
            <>
              <Flex gap="3" wrap="wrap" align="end">
                <label className="min-w-[180px] flex-1 space-y-2">
                  <Text size="2" weight="medium">Plano padrão</Text>
                  <Select.Root value={planoPadrao || VALOR_TODOS} onValueChange={(valor) => setPlanoPadrao(valor === VALOR_TODOS ? '' : valor)}>
                    <Select.Trigger placeholder="Escolha um plano" />
                    <Select.Content>
                      <Select.Item value={VALOR_TODOS}>Sem plano padrão</Select.Item>
                      {(planosQuery.data ?? []).map((plano) => (
                        <Select.Item key={plano.slug} value={plano.slug}>{plano.nome}</Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </label>

                <label className="min-w-[160px] flex-1 space-y-2">
                  <Text size="2" weight="medium">Senha padrão</Text>
                  <TextField.Root
                    type="text"
                    value={senhaPadrao}
                    onChange={(evento) => setSenhaPadrao(evento.target.value)}
                  />
                </label>

                <Button type="button" variant="soft" disabled={!planoPadrao || linhas.length === 0} onClick={aplicarPlanoEmTodas}>
                  Aplicar plano
                </Button>
              </Flex>

              <label className="flex items-center gap-2">
                <Checkbox checked={enviarEmail} onCheckedChange={(valor) => setEnviarEmail(valor === true)} />
                <Text size="2" className="text-zinc-300">Enviar e-mail de boas-vindas com a senha padrão</Text>
              </label>

              <label className="space-y-1.5">
                <Text size="2" weight="medium">Arquivo XLSX ou CSV</Text>
                <div
                  className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-zinc-600 bg-zinc-900/60 px-4 py-5 transition hover:border-cyan-500/60"
                  onClick={() => inputRef.current?.click()}
                >
                  <UploadIcon className="size-5 text-zinc-500" />
                  <Text size="2" className="text-zinc-400">
                    {arquivo ? arquivo.name : 'Clique para selecionar o arquivo .xlsx ou .csv'}
                  </Text>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void carregarArquivo(file)
                  }}
                />
              </label>

              {linhas.length > 0 && (
                <Flex direction="column" gap="2">
                  <Flex justify="between" align="center">
                    <Text size="2" className="text-zinc-400">
                      {linhasValidas.length} de {linhas.length} linhas prontas para importar
                    </Text>
                    {temLinhasInvalidas && (
                      <Text size="1" color="amber">Linhas sem e-mail ou plano serão ignoradas.</Text>
                    )}
                  </Flex>

                  <ScrollArea type="auto" scrollbars="both" className="max-h-[360px] rounded-md border border-zinc-800">
                    <Table.Root className="min-w-[980px]">
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeaderCell>E-mail</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>Nome</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>Plano</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>Expira em</Table.ColumnHeaderCell>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {linhas.map((linha, indice) => (
                          <Table.Row key={`${linha.email}-${indice}`}>
                            <Table.Cell>
                              <TextField.Root value={linha.email} onChange={(e) => atualizarLinha(indice, 'email', e.target.value)} />
                            </Table.Cell>
                            <Table.Cell>
                              <TextField.Root value={linha.nome ?? ''} onChange={(e) => atualizarLinha(indice, 'nome', e.target.value)} />
                            </Table.Cell>
                            <Table.Cell>
                              <Select.Root value={linha.plano || VALOR_TODOS} onValueChange={(valor) => atualizarLinha(indice, 'plano', valor === VALOR_TODOS ? '' : valor)}>
                                <Select.Trigger />
                                <Select.Content>
                                  <Select.Item value={VALOR_TODOS}>Escolher</Select.Item>
                                  {(planosQuery.data ?? []).map((plano) => (
                                    <Select.Item key={plano.slug} value={plano.slug}>{plano.nome}</Select.Item>
                                  ))}
                                </Select.Content>
                              </Select.Root>
                            </Table.Cell>
                            <Table.Cell>
                              <TextField.Root value={linha.status ?? ''} onChange={(e) => atualizarLinha(indice, 'status', e.target.value)} />
                            </Table.Cell>
                            <Table.Cell>
                              <TextField.Root type="date" value={linha.expira_em ?? ''} onChange={(e) => atualizarLinha(indice, 'expira_em', e.target.value)} />
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  </ScrollArea>
                </Flex>
              )}
            </>
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
              onClick={iniciarImportacao}
              disabled={linhasValidas.length === 0 || mutacao.isPending}
            >
              {mutacao.isPending ? <Spinner size="1" /> : <UploadIcon />}
              Enfileirar importação
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
              Importar assinantes
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
