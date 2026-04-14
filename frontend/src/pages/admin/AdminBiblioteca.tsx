import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Heading,
  ScrollArea,
  Spinner,
  Table,
  Text,
} from '@radix-ui/themes'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@radix-ui/react-icons'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminKeys, despublicarConteudo, fetchConteudosAdmin } from '../../services/admin'
import { formatarDataCurta } from '../../utils/formatters'
import type { TipoConteudo, PlanoMinimo } from '../../types/biblioteca'
import type { StatusConteudo } from '../../types/admin'

const badgeTipo: Record<TipoConteudo, string> = {
  briefing: 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40',
  mapa: 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/40',
  tese: 'bg-[#C9B882]/20 text-[#C9B882] ring-1 ring-[#C9B882]/40',
}

const labelTipo: Record<TipoConteudo, string> = {
  briefing: 'Briefing',
  mapa: 'Mapa',
  tese: 'A Tese',
}

const labelPlano: Record<PlanoMinimo, string> = {
  essencial: 'Essencial',
  pro: 'Pro',
  reservado: 'Reservado',
}

function BadgeTipo({ tipo }: { tipo: TipoConteudo }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeTipo[tipo]}`}
    >
      {labelTipo[tipo]}
    </span>
  )
}

function BadgeStatus({ status }: { status: StatusConteudo }) {
  if (status === 'publicado') {
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-500/20 text-green-400 ring-1 ring-green-500/40">
        Publicado
      </span>
    )
  }

  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-zinc-700 text-zinc-400">
      Rascunho
    </span>
  )
}

export function AdminBiblioteca() {
  const [page, setPage] = useState(1)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: adminKeys.conteudos(page),
    queryFn: () => fetchConteudosAdmin(page),
    placeholderData: (dadosAnteriores) => dadosAnteriores,
  })

  const mutationDespublicar = useMutation({
    mutationFn: despublicarConteudo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.conteudos(page) })
    },
  })

  const conteudos = query.data?.data ?? []
  const total = query.data?.total ?? 0
  const paginaAtual = query.data?.current_page ?? 1
  const ultimaPagina = query.data?.last_page ?? 1

  function handleDespublicar(id: number, titulo: string) {
    const confirmado = window.confirm(`Deseja despublicar o conteúdo "${titulo}"? Esta ação não pode ser desfeita.`)
    if (!confirmado) return
    mutationDespublicar.mutate(id)
  }

  return (
    <main className="min-h-screen bg-[#0a0a0b] px-6 py-10 text-cyan-50">
      <div className="mx-auto max-w-7xl space-y-6">
        <Flex justify="between" align="end" wrap="wrap" gap="4">
          <Box className="space-y-2">
            <Text size="2" className="uppercase tracking-[0.3em] text-cyan-300/70">
              Painel admin
            </Text>
            <Heading size="8">Biblioteca</Heading>
            <Text size="3" className="max-w-2xl text-cyan-100/65">
              Todos os conteúdos cadastrados, incluindo publicados e rascunhos.
            </Text>
          </Box>

          <Flex align="center" gap="3">
            <Badge size="3" color="cyan" variant="soft">
              {total} registros
            </Badge>
            <Button
              size="3"
              variant="solid"
              color="amber"
              onClick={() => navigate('/admin/novo-conteudo')}
            >
              <PlusIcon />
              Novo conteúdo
            </Button>
          </Flex>
        </Flex>

        <Card size="4" className="border border-cyan-400/10 bg-slate-950/80 backdrop-blur">
          <Flex direction="column" gap="4">
            {query.isLoading ? (
              <Flex justify="center" py="8">
                <Spinner size="3" />
              </Flex>
            ) : query.isError ? (
              <Text color="ruby" size="3">
                Não foi possível carregar os conteúdos. Tente novamente.
              </Text>
            ) : (
              <ScrollArea type="auto" scrollbars="horizontal" className="w-full">
                <Table.Root className="min-w-[860px]">
                  <Table.Header>
                    <Table.Row className="border-b border-cyan-400/10">
                      <Table.ColumnHeaderCell>Tipo</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Título</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Plano mínimo</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Data publicação</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Ações</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {conteudos.length > 0 ? (
                      conteudos.map((conteudo) => (
                        <Table.Row key={conteudo.id} className="transition-colors hover:bg-cyan-400/5">
                          <Table.Cell>
                            <BadgeTipo tipo={conteudo.tipo} />
                          </Table.Cell>
                          <Table.Cell className="max-w-[280px] truncate text-cyan-50">
                            {conteudo.titulo}
                          </Table.Cell>
                          <Table.Cell>{labelPlano[conteudo.plano_minimo]}</Table.Cell>
                          <Table.Cell>
                            <BadgeStatus status={conteudo.status} />
                          </Table.Cell>
                          <Table.Cell>{formatarDataCurta(conteudo.publicado_em)}</Table.Cell>
                          <Table.Cell>
                            <Flex gap="2">
                              <Button
                                size="1"
                                variant="soft"
                                color="ruby"
                                disabled={mutationDespublicar.isPending}
                                onClick={() => handleDespublicar(conteudo.id, conteudo.titulo)}
                              >
                                Despublicar
                              </Button>
                              <Button
                                size="1"
                                variant="soft"
                                color="gray"
                                disabled
                                title="Em breve"
                              >
                                Editar
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
                              Nenhum conteúdo cadastrado ainda.
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
                  Próximo
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
