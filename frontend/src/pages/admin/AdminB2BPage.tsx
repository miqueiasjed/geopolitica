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
import { ExternalLinkIcon, PlusIcon } from '@radix-ui/react-icons'
import { useState } from 'react'
import {
  adminKeys,
  criarLicencaB2B,
  fetchAdminB2BEmpresas,
  renovarLicencaB2B,
} from '../../services/admin'
import type { CriarLicencaPayload, EmpresaB2B, RenovarLicencaPayload } from '../../types/b2b'
import { formatarDataCurta } from '../../utils/formatters'

type Meses = 6 | 12 | 24

function diasAteExpiracao(expiraEm: string): number {
  const agora = new Date()
  const expiracao = new Date(expiraEm)
  return Math.ceil((expiracao.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))
}

function BadgeExpiracao({ expiraEm }: { expiraEm: string }) {
  const dias = diasAteExpiracao(expiraEm)
  const cor = dias < 30 ? 'ruby' : 'green'
  return (
    <Badge color={cor} variant="soft">
      {formatarDataCurta(expiraEm)}
      {dias < 30 && ` (${dias}d)`}
    </Badge>
  )
}

interface ModalNovaLicencaProps {
  aberto: boolean
  onFechar: () => void
}

function ModalNovaLicenca({ aberto, onFechar }: ModalNovaLicencaProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<CriarLicencaPayload>({
    nome: '',
    subdominio: '',
    max_usuarios: 5,
    email_admin: '',
    meses: 12,
  })

  const mutation = useMutation({
    mutationFn: criarLicencaB2B,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.b2bEmpresas() })
      onFechar()
      setForm({ nome: '', subdominio: '', max_usuarios: 5, email_admin: '', meses: 12 })
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate(form)
  }

  return (
    <Dialog.Root open={aberto} onOpenChange={(open) => !open && onFechar()}>
      <Dialog.Content maxWidth="480px">
        <Dialog.Title>Nova Licença B2B</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="4">
          Crie uma nova licença corporativa e convide o administrador da empresa.
        </Dialog.Description>

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            <label className="space-y-1">
              <Text size="2" weight="medium">
                Nome da empresa
              </Text>
              <TextField.Root
                size="3"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Acme Corp"
                required
              />
            </label>

            <label className="space-y-1">
              <Text size="2" weight="medium">
                Subdomínio
              </Text>
              <TextField.Root
                size="3"
                value={form.subdominio}
                onChange={(e) => setForm((f) => ({ ...f, subdominio: e.target.value }))}
                placeholder="acme"
                required
              />
              <Text size="1" color="gray">
                Ex: acme → acme.geopolitica.app
              </Text>
            </label>

            <label className="space-y-1">
              <Text size="2" weight="medium">
                Máx. usuários
              </Text>
              <TextField.Root
                size="3"
                type="number"
                min={1}
                value={String(form.max_usuarios)}
                onChange={(e) => setForm((f) => ({ ...f, max_usuarios: Number(e.target.value) }))}
                required
              />
            </label>

            <label className="space-y-1">
              <Text size="2" weight="medium">
                E-mail do admin
              </Text>
              <TextField.Root
                size="3"
                type="email"
                value={form.email_admin}
                onChange={(e) => setForm((f) => ({ ...f, email_admin: e.target.value }))}
                placeholder="admin@empresa.com"
                required
              />
            </label>

            <label className="space-y-1">
              <Text size="2" weight="medium">
                Duração
              </Text>
              <Select.Root
                value={String(form.meses)}
                onValueChange={(v) => setForm((f) => ({ ...f, meses: Number(v) as Meses }))}
              >
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="6">6 meses</Select.Item>
                  <Select.Item value="12">12 meses</Select.Item>
                  <Select.Item value="24">24 meses</Select.Item>
                </Select.Content>
              </Select.Root>
            </label>

            {mutation.isError && (
              <Text color="ruby" size="2">
                Erro ao criar licença. Verifique os dados e tente novamente.
              </Text>
            )}

            <Separator size="4" />

            <Flex gap="3" justify="end">
              <Dialog.Close>
                <Button type="button" variant="soft" color="gray" onClick={onFechar}>
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <Spinner size="1" /> : <PlusIcon />}
                Criar licença
              </Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  )
}

interface ModalRenovarProps {
  empresa: EmpresaB2B | null
  onFechar: () => void
}

function ModalRenovar({ empresa, onFechar }: ModalRenovarProps) {
  const queryClient = useQueryClient()
  const [meses, setMeses] = useState<Meses>(12)

  const mutation = useMutation({
    mutationFn: (payload: RenovarLicencaPayload) => renovarLicencaB2B(empresa!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.b2bEmpresas() })
      onFechar()
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate({ meses })
  }

  return (
    <Dialog.Root open={!!empresa} onOpenChange={(open) => !open && onFechar()}>
      <Dialog.Content maxWidth="400px">
        <Dialog.Title>Renovar Licença</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="4">
          Renovando licença de <strong>{empresa?.nome}</strong>.
        </Dialog.Description>

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            <label className="space-y-1">
              <Text size="2" weight="medium">
                Período de renovação
              </Text>
              <Select.Root value={String(meses)} onValueChange={(v) => setMeses(Number(v) as Meses)}>
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="6">6 meses</Select.Item>
                  <Select.Item value="12">12 meses</Select.Item>
                  <Select.Item value="24">24 meses</Select.Item>
                </Select.Content>
              </Select.Root>
            </label>

            {mutation.isError && (
              <Text color="ruby" size="2">
                Erro ao renovar. Tente novamente.
              </Text>
            )}

            <Separator size="4" />

            <Flex gap="3" justify="end">
              <Dialog.Close>
                <Button type="button" variant="soft" color="gray" onClick={onFechar}>
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button type="submit" color="cyan" disabled={mutation.isPending}>
                {mutation.isPending ? <Spinner size="1" /> : null}
                Confirmar renovação
              </Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  )
}

export function AdminB2BPage() {
  const [modalNovaLicenca, setModalNovaLicenca] = useState(false)
  const [empresaRenovar, setEmpresaRenovar] = useState<EmpresaB2B | null>(null)

  const query = useQuery({
    queryKey: adminKeys.b2bEmpresas(),
    queryFn: fetchAdminB2BEmpresas,
  })

  const empresas = query.data ?? []

  return (
    <main className="min-h-screen bg-[#0a0a0b] px-6 py-10 text-cyan-50">
      <div className="mx-auto max-w-7xl space-y-6">
        <Flex justify="between" align="end" wrap="wrap" gap="4">
          <Box className="space-y-2">
            <Text size="2" className="uppercase tracking-[0.3em] text-cyan-300/70">
              Painel admin
            </Text>
            <Heading size="8">Licenças B2B</Heading>
            <Text size="3" className="max-w-2xl text-cyan-100/65">
              Gerencie empresas parceiras, licenças corporativas e membros vinculados.
            </Text>
          </Box>

          <Flex gap="3" align="center">
            <Badge size="3" color="cyan" variant="soft">
              {empresas.length} empresa{empresas.length !== 1 ? 's' : ''}
            </Badge>
            <Button size="3" onClick={() => setModalNovaLicenca(true)}>
              <PlusIcon />
              Nova Licença
            </Button>
          </Flex>
        </Flex>

        <Card size="4" className="border border-cyan-400/10 bg-slate-950/80 backdrop-blur">
          {query.isLoading ? (
            <Flex justify="center" py="8">
              <Spinner size="3" />
            </Flex>
          ) : query.isError ? (
            <Text color="ruby" size="3">
              Não foi possível carregar as empresas. Tente novamente.
            </Text>
          ) : (
            <ScrollArea type="auto" scrollbars="horizontal" className="w-full">
              <Table.Root className="min-w-[900px]">
                <Table.Header>
                  <Table.Row className="border-b border-cyan-400/10">
                    <Table.ColumnHeaderCell>Empresa</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Subdomínio</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Membros</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Expira em</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Ações</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {empresas.length > 0 ? (
                    empresas.map((empresa) => (
                      <Table.Row key={empresa.id} className="transition-colors hover:bg-cyan-400/5">
                        <Table.Cell className="font-medium text-cyan-50">{empresa.nome}</Table.Cell>
                        <Table.Cell>
                          <a
                            href={`https://${empresa.subdominio}.geopolitica.app`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-cyan-400 underline-offset-2 hover:underline"
                          >
                            {empresa.subdominio}
                            <ExternalLinkIcon />
                          </a>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="2">
                            {empresa.membros_ativos}/{empresa.max_usuarios}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <BadgeExpiracao expiraEm={empresa.expira_em} />
                        </Table.Cell>
                        <Table.Cell>
                          <Badge color={empresa.ativo ? 'green' : 'gray'} variant="soft">
                            {empresa.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Flex gap="2">
                            <Button
                              size="1"
                              variant="soft"
                              color="cyan"
                              onClick={() => setEmpresaRenovar(empresa)}
                            >
                              Renovar
                            </Button>
                          </Flex>
                        </Table.Cell>
                      </Table.Row>
                    ))
                  ) : (
                    <Table.Row>
                      <Table.Cell colSpan={6}>
                        <Box className="py-10 text-center">
                          <Text size="3" className="text-cyan-100/65">
                            Nenhuma empresa cadastrada ainda.
                          </Text>
                        </Box>
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table.Root>
            </ScrollArea>
          )}
        </Card>
      </div>

      <ModalNovaLicenca aberto={modalNovaLicenca} onFechar={() => setModalNovaLicenca(false)} />
      <ModalRenovar empresa={empresaRenovar} onFechar={() => setEmpresaRenovar(null)} />
    </main>
  )
}
