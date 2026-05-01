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
} from '../../services/admin'
import { formatarDataCurta } from '../../utils/formatters'
import type { CriarWebhookTokenPayload, FonteWebhook } from '../../types/admin'

const ESTADO_INICIAL: CriarWebhookTokenPayload = {
  fonte: 'lastlink',
  descricao: '',
  token: '',
}

export function AdminWebhookTokens() {
  const queryClient = useQueryClient()
  const [dialogAberto, setDialogAberto] = useState(false)
  const [form, setForm] = useState<CriarWebhookTokenPayload>(ESTADO_INICIAL)

  const query = useQuery({
    queryKey: adminKeys.webhookTokens(),
    queryFn: buscarWebhookTokens,
  })

  const mutacaoCriar = useMutation({
    mutationFn: criarWebhookToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.webhookTokens() })
      setDialogAberto(false)
      setForm(ESTADO_INICIAL)
    },
  })

  const mutacaoToggle = useMutation({
    mutationFn: toggleWebhookToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.webhookTokens() })
    },
  })

  const mutacaoExcluir = useMutation({
    mutationFn: excluirWebhookToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.webhookTokens() })
    },
  })

  const tokens = query.data ?? []

  return (
    <main className="min-h-screen bg-[#0a0a0b] px-6 py-10 text-cyan-50">
      <div className="mx-auto max-w-5xl space-y-6">
        <Flex justify="between" align="end" wrap="wrap" gap="4">
          <Box className="space-y-2">
            <Text size="2" className="uppercase tracking-[0.3em] text-cyan-300/70">
              Painel admin
            </Text>
            <Heading size="8">Tokens de Webhook</Heading>
            <Text size="3" className="max-w-2xl text-cyan-100/65">
              Gerencie os tokens de autenticação dos webhooks. Cada produto (Lastlink, Hotmart) pode ter
              múltiplos tokens ativos — um por webhook configurado na plataforma.
            </Text>
          </Box>

          <Dialog.Root open={dialogAberto} onOpenChange={setDialogAberto}>
            <Dialog.Trigger>
              <Button size="3">
                <PlusIcon />
                Novo token
              </Button>
            </Dialog.Trigger>
            <Dialog.Content maxWidth="480px">
              <Dialog.Title>Adicionar token de webhook</Dialog.Title>
              <Dialog.Description size="2" mb="4" className="text-cyan-100/60">
                Cole o token/secret exatamente como está configurado na plataforma de pagamentos.
              </Dialog.Description>

              <Flex direction="column" gap="4">
                <label className="space-y-2">
                  <Text size="2" weight="medium">
                    Plataforma
                  </Text>
                  <Select.Root
                    value={form.fonte}
                    onValueChange={(v) => setForm((f) => ({ ...f, fonte: v as FonteWebhook }))}
                  >
                    <Select.Trigger className="w-full" />
                    <Select.Content>
                      <Select.Item value="lastlink">Lastlink</Select.Item>
                      <Select.Item value="hotmart">Hotmart</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </label>

                <label className="space-y-2">
                  <Text size="2" weight="medium">
                    Descrição
                  </Text>
                  <TextField.Root
                    placeholder="ex: GPI - Produto Principal"
                    value={form.descricao}
                    onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                  />
                </label>

                <label className="space-y-2">
                  <Text size="2" weight="medium">
                    Token / Secret
                  </Text>
                  <TextField.Root
                    placeholder="Cole o token aqui"
                    value={form.token}
                    onChange={(e) => setForm((f) => ({ ...f, token: e.target.value }))}
                    className="font-mono"
                  />
                  <Text size="1" className="text-cyan-100/40">
                    Será armazenado criptografado. Apenas os primeiros e últimos 4 caracteres serão
                    exibidos.
                  </Text>
                </label>
              </Flex>

              <Flex gap="3" mt="5" justify="end">
                <Dialog.Close>
                  <Button variant="soft" color="gray">
                    Cancelar
                  </Button>
                </Dialog.Close>
                <Button
                  loading={mutacaoCriar.isPending}
                  disabled={!form.descricao.trim() || !form.token.trim()}
                  onClick={() => mutacaoCriar.mutate(form)}
                >
                  Salvar token
                </Button>
              </Flex>
            </Dialog.Content>
          </Dialog.Root>
        </Flex>

        <Card size="4" className="border border-cyan-400/10 bg-slate-950/80 backdrop-blur">
          {query.isLoading ? (
            <Flex justify="center" py="8">
              <Spinner size="3" />
            </Flex>
          ) : tokens.length === 0 ? (
            <Box className="py-12 text-center">
              <EyeNoneIcon className="mx-auto mb-3 h-8 w-8 text-cyan-100/20" />
              <Text size="3" className="text-cyan-100/50">
                Nenhum token cadastrado ainda.
              </Text>
              <Text size="2" className="mt-1 text-cyan-100/30">
                Adicione tokens para que os webhooks sejam autenticados.
              </Text>
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
                  <Table.ColumnHeaderCell width="80px" />
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {tokens.map((token) => (
                  <Table.Row key={token.id} className="transition-colors hover:bg-cyan-400/5">
                    <Table.Cell>
                      <Badge
                        color={token.fonte === 'lastlink' ? 'violet' : 'orange'}
                        variant="soft"
                        size="1"
                        className="uppercase"
                      >
                        {token.fonte}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2">{token.descricao}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2" className="font-mono text-cyan-100/70">
                        {token.token}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex align="center" gap="2">
                        <Switch
                          size="1"
                          checked={token.ativo}
                          onCheckedChange={() => mutacaoToggle.mutate(token.id)}
                          disabled={mutacaoToggle.isPending}
                        />
                        <Badge color={token.ativo ? 'green' : 'gray'} variant="soft" size="1">
                          {token.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </Flex>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2">{formatarDataCurta(token.created_at)}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <AlertDialog.Root>
                        <AlertDialog.Trigger>
                          <Button size="1" variant="ghost" color="red">
                            <TrashIcon />
                          </Button>
                        </AlertDialog.Trigger>
                        <AlertDialog.Content maxWidth="400px">
                          <AlertDialog.Title>Remover token</AlertDialog.Title>
                          <AlertDialog.Description size="2">
                            Tem certeza que deseja remover o token <strong>{token.descricao}</strong>?
                            Webhooks usando esse token passarão a retornar erro de autenticação.
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
                                onClick={() => mutacaoExcluir.mutate(token.id)}
                              >
                                Remover
                              </Button>
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
    </main>
  )
}
