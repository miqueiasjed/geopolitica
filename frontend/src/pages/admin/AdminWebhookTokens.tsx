import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertDialog,
  Badge,
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Heading,
  Select,
  Separator,
  Spinner,
  Switch,
  Table,
  Text,
  TextField,
} from '@radix-ui/themes'
import { EyeNoneIcon, PlusIcon, TrashIcon } from '@radix-ui/react-icons'
import { useState } from 'react'
import {
  adminKeys,
  buscarWebhookTokens,
  criarWebhookToken,
  excluirWebhookToken,
  toggleWebhookToken,
  buscarWebhookOfferPlanos,
  criarWebhookOfferPlano,
  excluirWebhookOfferPlano,
  buscarPlanosAtivos,
} from '../../services/admin'
import { formatarDataCurta } from '../../utils/formatters'
import type {
  CriarWebhookTokenPayload,
  CriarWebhookOfferPlanoPayload,
  FonteWebhook,
} from '../../types/admin'

const TOKEN_INICIAL: CriarWebhookTokenPayload = { fonte: 'lastlink', descricao: '', token: '' }
const OFFER_INICIAL: CriarWebhookOfferPlanoPayload = {
  fonte: 'lastlink',
  offer_id: '',
  descricao: '',
  plano: '',
}

function corFonte(f: string): 'violet' | 'orange' {
  return f === 'lastlink' ? 'violet' : 'orange'
}

function corPlano(p: string): 'cyan' | 'blue' | 'gold' | 'gray' {
  const map: Record<string, 'cyan' | 'blue' | 'gold'> = { essencial: 'cyan', pro: 'blue', reservado: 'gold' }
  return map[p] ?? 'gray'
}

export function AdminWebhookTokens() {
  const queryClient = useQueryClient()

  const [tokenDialog, setTokenDialog] = useState(false)
  const [tokenForm, setTokenForm] = useState<CriarWebhookTokenPayload>(TOKEN_INICIAL)

  const [offerDialog, setOfferDialog] = useState(false)
  const [offerForm, setOfferForm] = useState<CriarWebhookOfferPlanoPayload>(OFFER_INICIAL)

  const tokensQuery = useQuery({ queryKey: adminKeys.webhookTokens(), queryFn: buscarWebhookTokens })
  const offersQuery = useQuery({
    queryKey: adminKeys.webhookOfferPlanos(),
    queryFn: buscarWebhookOfferPlanos,
  })
  const planosQuery = useQuery({ queryKey: adminKeys.planosAtivos(), queryFn: buscarPlanosAtivos })

  const criarToken = useMutation({
    mutationFn: criarWebhookToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.webhookTokens() })
      setTokenDialog(false)
      setTokenForm(TOKEN_INICIAL)
    },
  })

  const toggleToken = useMutation({
    mutationFn: toggleWebhookToken,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.webhookTokens() }),
  })

  const excluirToken = useMutation({
    mutationFn: excluirWebhookToken,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.webhookTokens() }),
  })

  const criarOffer = useMutation({
    mutationFn: criarWebhookOfferPlano,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.webhookOfferPlanos() })
      setOfferDialog(false)
      setOfferForm(OFFER_INICIAL)
    },
  })

  const excluirOffer = useMutation({
    mutationFn: excluirWebhookOfferPlano,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.webhookOfferPlanos() }),
  })

  const tokens = tokensQuery.data ?? []
  const offers = offersQuery.data ?? []

  return (
    <main className="min-h-screen bg-[#0a0a0b] px-6 py-10 text-cyan-50">
      <div className="mx-auto max-w-5xl space-y-10">

        {/* ── Tokens ── */}
        <div className="space-y-6">
          <Flex justify="between" align="end" wrap="wrap" gap="4">
            <Box className="space-y-2">
              <Text size="2" className="uppercase tracking-[0.3em] text-cyan-300/70">
                Painel admin
              </Text>
              <Heading size="8">Tokens de Webhook</Heading>
              <Text size="3" className="max-w-2xl text-cyan-100/65">
                Cada produto pode ter seu próprio token — cadastre um por webhook configurado na
                plataforma.
              </Text>
            </Box>

            <Dialog.Root open={tokenDialog} onOpenChange={setTokenDialog}>
              <Dialog.Trigger>
                <Button size="3">
                  <PlusIcon />
                  Novo token
                </Button>
              </Dialog.Trigger>
              <Dialog.Content maxWidth="480px">
                <Dialog.Title>Adicionar token de webhook</Dialog.Title>
                <Dialog.Description size="2" mb="4" className="text-cyan-100/60">
                  Cole o token/secret exatamente como está na plataforma de pagamentos.
                </Dialog.Description>
                <Flex direction="column" gap="4">
                  <label className="space-y-2">
                    <Text size="2" weight="medium">Plataforma</Text>
                    <Select.Root
                      value={tokenForm.fonte}
                      onValueChange={(v) => setTokenForm((f) => ({ ...f, fonte: v as FonteWebhook }))}
                    >
                      <Select.Trigger className="w-full" />
                      <Select.Content>
                        <Select.Item value="lastlink">Lastlink</Select.Item>
                        <Select.Item value="hotmart">Hotmart</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  </label>
                  <label className="space-y-2">
                    <Text size="2" weight="medium">Descrição</Text>
                    <TextField.Root
                      placeholder="ex: GPI - Produto Principal"
                      value={tokenForm.descricao}
                      onChange={(e) => setTokenForm((f) => ({ ...f, descricao: e.target.value }))}
                    />
                  </label>
                  <label className="space-y-2">
                    <Text size="2" weight="medium">Token / Secret</Text>
                    <TextField.Root
                      placeholder="Cole o token aqui"
                      value={tokenForm.token}
                      onChange={(e) => setTokenForm((f) => ({ ...f, token: e.target.value }))}
                      className="font-mono"
                    />
                    <Text size="1" className="text-cyan-100/40">
                      Armazenado criptografado. Exibido mascarado.
                    </Text>
                  </label>
                </Flex>
                <Flex gap="3" mt="5" justify="end">
                  <Dialog.Close>
                    <Button variant="soft" color="gray">Cancelar</Button>
                  </Dialog.Close>
                  <Button
                    loading={criarToken.isPending}
                    disabled={!tokenForm.descricao.trim() || !tokenForm.token.trim()}
                    onClick={() => criarToken.mutate(tokenForm)}
                  >
                    Salvar token
                  </Button>
                </Flex>
              </Dialog.Content>
            </Dialog.Root>
          </Flex>

          <Card size="4" className="border border-cyan-400/10 bg-slate-950/80 backdrop-blur">
            {tokensQuery.isLoading ? (
              <Flex justify="center" py="8"><Spinner size="3" /></Flex>
            ) : tokens.length === 0 ? (
              <Box className="py-10 text-center">
                <EyeNoneIcon className="mx-auto mb-3 h-7 w-7 text-cyan-100/20" />
                <Text size="3" className="text-cyan-100/50">Nenhum token cadastrado.</Text>
              </Box>
            ) : (
              <Table.Root>
                <Table.Header>
                  <Table.Row className="border-b border-cyan-400/10">
                    <Table.ColumnHeaderCell>Plataforma</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Descrição</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Token</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Criado em</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell width="48px" />
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {tokens.map((t) => (
                    <Table.Row key={t.id} className="hover:bg-cyan-400/5">
                      <Table.Cell>
                        <Badge color={corFonte(t.fonte)} variant="soft" size="1" className="uppercase">{t.fonte}</Badge>
                      </Table.Cell>
                      <Table.Cell><Text size="2">{t.descricao}</Text></Table.Cell>
                      <Table.Cell>
                        <Text size="2" className="font-mono text-cyan-100/70">{t.token}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Flex align="center" gap="2">
                          <Switch size="1" checked={t.ativo} onCheckedChange={() => toggleToken.mutate(t.id)} />
                          <Badge color={t.ativo ? 'green' : 'gray'} variant="soft" size="1">
                            {t.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </Flex>
                      </Table.Cell>
                      <Table.Cell><Text size="2">{formatarDataCurta(t.created_at)}</Text></Table.Cell>
                      <Table.Cell>
                        <AlertDialog.Root>
                          <AlertDialog.Trigger>
                            <Button size="1" variant="ghost" color="red"><TrashIcon /></Button>
                          </AlertDialog.Trigger>
                          <AlertDialog.Content maxWidth="400px">
                            <AlertDialog.Title>Remover token</AlertDialog.Title>
                            <AlertDialog.Description size="2">
                              Webhooks usando <strong>{t.descricao}</strong> passarão a falhar na autenticação.
                            </AlertDialog.Description>
                            <Flex gap="3" mt="4" justify="end">
                              <AlertDialog.Cancel><Button variant="soft" color="gray">Cancelar</Button></AlertDialog.Cancel>
                              <AlertDialog.Action>
                                <Button color="red" loading={excluirToken.isPending} onClick={() => excluirToken.mutate(t.id)}>Remover</Button>
                              </AlertDialog.Action>
                            </Flex>
                          </AlertDialog.Content>
                        </AlertDialog.Root>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            )}
          </Card>
        </div>

        <Separator size="4" />

        {/* ── Offer → Plano ── */}
        <div className="space-y-6">
          <Flex justify="between" align="end" wrap="wrap" gap="4">
            <Box className="space-y-2">
              <Heading size="6">Mapeamento Offer → Plano</Heading>
              <Text size="3" className="max-w-2xl text-cyan-100/65">
                Relaciona o ID da oferta (da plataforma) com um plano do sistema. Use quando o nome
                do produto não contém "essencial", "pro" ou "reservado".
              </Text>
            </Box>

            <Dialog.Root open={offerDialog} onOpenChange={setOfferDialog}>
              <Dialog.Trigger>
                <Button size="3" variant="soft">
                  <PlusIcon />
                  Novo mapeamento
                </Button>
              </Dialog.Trigger>
              <Dialog.Content maxWidth="480px">
                <Dialog.Title>Mapear offer para plano</Dialog.Title>
                <Dialog.Description size="2" mb="4" className="text-cyan-100/60">
                  Copie o Offer ID do payload do webhook (campo <code>Data.Offer.Id</code>).
                </Dialog.Description>
                <Flex direction="column" gap="4">
                  <label className="space-y-2">
                    <Text size="2" weight="medium">Plataforma</Text>
                    <Select.Root
                      value={offerForm.fonte}
                      onValueChange={(v) => setOfferForm((f) => ({ ...f, fonte: v as FonteWebhook }))}
                    >
                      <Select.Trigger className="w-full" />
                      <Select.Content>
                        <Select.Item value="lastlink">Lastlink</Select.Item>
                        <Select.Item value="hotmart">Hotmart</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  </label>
                  <label className="space-y-2">
                    <Text size="2" weight="medium">Offer ID</Text>
                    <TextField.Root
                      placeholder="ex: eb2e1a0b-7b22-4cee-8370-92fb312da449"
                      value={offerForm.offer_id}
                      onChange={(e) => setOfferForm((f) => ({ ...f, offer_id: e.target.value }))}
                      className="font-mono"
                    />
                  </label>
                  <label className="space-y-2">
                    <Text size="2" weight="medium">Descrição do produto</Text>
                    <TextField.Root
                      placeholder="ex: Geopolítica para investidores"
                      value={offerForm.descricao}
                      onChange={(e) => setOfferForm((f) => ({ ...f, descricao: e.target.value }))}
                    />
                  </label>
                  <label className="space-y-2">
                    <Text size="2" weight="medium">Plano</Text>
                    <Select.Root
                      value={offerForm.plano}
                      onValueChange={(v) => setOfferForm((f) => ({ ...f, plano: v }))}
                    >
                      <Select.Trigger className="w-full" />
                      <Select.Content>
                        {(planosQuery.data ?? []).map((p) => (
                          <Select.Item key={p.slug} value={p.slug}>{p.nome}</Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  </label>
                </Flex>
                <Flex gap="3" mt="5" justify="end">
                  <Dialog.Close>
                    <Button variant="soft" color="gray">Cancelar</Button>
                  </Dialog.Close>
                  <Button
                    loading={criarOffer.isPending}
                    disabled={!offerForm.offer_id.trim() || !offerForm.descricao.trim()}
                    onClick={() => criarOffer.mutate(offerForm)}
                  >
                    Salvar mapeamento
                  </Button>
                </Flex>
              </Dialog.Content>
            </Dialog.Root>
          </Flex>

          <Card size="4" className="border border-cyan-400/10 bg-slate-950/80 backdrop-blur">
            {offersQuery.isLoading ? (
              <Flex justify="center" py="8"><Spinner size="3" /></Flex>
            ) : offers.length === 0 ? (
              <Box className="py-10 text-center">
                <EyeNoneIcon className="mx-auto mb-3 h-7 w-7 text-cyan-100/20" />
                <Text size="3" className="text-cyan-100/50">Nenhum mapeamento cadastrado.</Text>
              </Box>
            ) : (
              <Table.Root>
                <Table.Header>
                  <Table.Row className="border-b border-cyan-400/10">
                    <Table.ColumnHeaderCell>Plataforma</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Offer ID</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Produto</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Plano</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Criado em</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell width="48px" />
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {offers.map((o) => (
                    <Table.Row key={o.id} className="hover:bg-cyan-400/5">
                      <Table.Cell>
                        <Badge color={corFonte(o.fonte)} variant="soft" size="1" className="uppercase">{o.fonte}</Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2" className="font-mono text-cyan-100/70">{o.offer_id}</Text>
                      </Table.Cell>
                      <Table.Cell><Text size="2">{o.descricao}</Text></Table.Cell>
                      <Table.Cell>
                        <Badge color={corPlano(o.plano)} variant="soft" size="1" className="capitalize">{o.plano}</Badge>
                      </Table.Cell>
                      <Table.Cell><Text size="2">{formatarDataCurta(o.created_at)}</Text></Table.Cell>
                      <Table.Cell>
                        <AlertDialog.Root>
                          <AlertDialog.Trigger>
                            <Button size="1" variant="ghost" color="red"><TrashIcon /></Button>
                          </AlertDialog.Trigger>
                          <AlertDialog.Content maxWidth="400px">
                            <AlertDialog.Title>Remover mapeamento</AlertDialog.Title>
                            <AlertDialog.Description size="2">
                              Webhooks com offer <strong>{o.offer_id}</strong> não terão plano identificado.
                            </AlertDialog.Description>
                            <Flex gap="3" mt="4" justify="end">
                              <AlertDialog.Cancel><Button variant="soft" color="gray">Cancelar</Button></AlertDialog.Cancel>
                              <AlertDialog.Action>
                                <Button color="red" loading={excluirOffer.isPending} onClick={() => excluirOffer.mutate(o.id)}>Remover</Button>
                              </AlertDialog.Action>
                            </Flex>
                          </AlertDialog.Content>
                        </AlertDialog.Root>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            )}
          </Card>
        </div>

      </div>
    </main>
  )
}
