import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Badge, Box, Button, Card, Flex, Heading, ScrollArea, Spinner, Table, Text,
} from '@radix-ui/themes'
import { PlusIcon } from '@radix-ui/react-icons'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { buscarAdminCrises, excluirCrise, adminKeys } from '../../services/admin'
import { AdminCriseForm } from '../../components/crises/AdminCriseForm'
import type { AdminCriseHistorica } from '../../types/admin'

function BadgeStatus({ emAndamento }: { emAndamento: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-xs uppercase tracking-[0.12em] ${
      emAndamento
        ? 'border border-amber-500/40 bg-amber-500/10 text-amber-400'
        : 'border border-zinc-600/40 bg-zinc-800/50 text-zinc-500'
    }`}>
      {emAndamento ? 'Em andamento' : 'Encerrada'}
    </span>
  )
}

type ModoModal = 'criar' | 'editar'

interface EstadoModal {
  aberto: boolean
  modo: ModoModal
  crise?: AdminCriseHistorica
}

export function AdminCrises() {
  const queryClient = useQueryClient()
  const prefersReduced = useReducedMotion()

  const [modal, setModal] = useState<EstadoModal>({ aberto: false, modo: 'criar' })

  const { data: crises = [], isLoading } = useQuery({
    queryKey: adminKeys.crises(),
    queryFn: buscarAdminCrises,
  })

  const mutacaoDeletar = useMutation({
    mutationFn: excluirCrise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.crises() })
    },
  })

  function abrirModalCriacao() {
    setModal({ aberto: true, modo: 'criar', crise: undefined })
  }

  function abrirModalEdicao(crise: AdminCriseHistorica) {
    setModal({ aberto: true, modo: 'editar', crise })
  }

  function fecharModal() {
    setModal((prev) => ({ ...prev, aberto: false }))
  }

  function handleDeletar(id: number, titulo: string) {
    if (!window.confirm(`Excluir a crise "${titulo}"? Esta ação não pode ser desfeita.`)) return
    mutacaoDeletar.mutate(id)
  }

  return (
    <main className="min-h-screen bg-[#0a0a0b] px-6 py-10 text-cyan-50">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <Flex justify="between" align="end" wrap="wrap" gap="4">
          <Box className="space-y-2">
            <Text size="2" className="uppercase tracking-[0.3em] text-cyan-300/70">Painel admin</Text>
            <Heading size="8">Linha do Tempo de Crises</Heading>
            <Text size="3" className="max-w-2xl text-cyan-100/65">
              Cadastro e gerenciamento das crises históricas exibidas na linha do tempo.
            </Text>
          </Box>
          <Flex align="center" gap="3">
            <Badge size="3" color="cyan" variant="soft">{crises.length} crises</Badge>
            <Button size="3" variant="solid" color="amber" onClick={abrirModalCriacao}>
              <PlusIcon /> Nova Crise
            </Button>
          </Flex>
        </Flex>

        {/* Tabela */}
        <Card size="4" className="border border-cyan-400/10 bg-slate-950/80 backdrop-blur">
          {isLoading ? (
            <Flex justify="center" py="8"><Spinner size="3" /></Flex>
          ) : (
            <ScrollArea type="auto" scrollbars="horizontal" className="w-full">
              <Table.Root className="min-w-[800px]">
                <Table.Header>
                  <Table.Row className="border-b border-cyan-400/10">
                    <Table.ColumnHeaderCell>Título</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Ano</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Período</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Categorias</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Ações</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {crises.length > 0 ? (
                    crises.map((crise) => (
                      <Table.Row key={crise.id} className="transition-colors hover:bg-cyan-400/5">
                        <Table.Cell className="max-w-[260px] font-medium text-cyan-50">
                          <span className="line-clamp-2">{crise.titulo}</span>
                          {crise.slug && (
                            <span className="block font-mono text-[11px] text-zinc-600">{crise.slug}</span>
                          )}
                        </Table.Cell>
                        <Table.Cell className="font-mono text-zinc-400">{crise.ano}</Table.Cell>
                        <Table.Cell className="font-mono text-xs text-zinc-400">
                          {crise.data_inicio}
                          {crise.data_fim ? ` → ${crise.data_fim}` : ' → hoje'}
                        </Table.Cell>
                        <Table.Cell><BadgeStatus emAndamento={crise.em_andamento} /></Table.Cell>
                        <Table.Cell>
                          <div className="flex flex-wrap gap-1">
                            {crise.categorias.slice(0, 2).map((cat) => (
                              <span key={cat} className="rounded-full border border-zinc-700 px-2 py-0.5 font-mono text-[10px] text-zinc-500">
                                {cat}
                              </span>
                            ))}
                            {crise.categorias.length > 2 && (
                              <span className="font-mono text-[10px] text-zinc-600">+{crise.categorias.length - 2}</span>
                            )}
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <Flex gap="2">
                            <Button size="1" variant="soft" color="gray"
                              onClick={() => abrirModalEdicao(crise)}>
                              Editar
                            </Button>
                            <Button size="1" variant="soft" color="ruby"
                              disabled={mutacaoDeletar.isPending}
                              onClick={() => handleDeletar(crise.id, crise.titulo)}>
                              Excluir
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
                            Nenhuma crise cadastrada. Clique em "Nova Crise" para começar.
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

      {/* Modal */}
      <AnimatePresence>
        {modal.aberto && (
          <>
            <motion.div key="overlay"
              className="fixed inset-0 z-40 bg-black/60"
              initial={prefersReduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: prefersReduced ? 0 : 0.2 }}
              onClick={fecharModal} aria-hidden="true" />

            <motion.div key="content"
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={prefersReduced ? false : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: prefersReduced ? 0 : 0.2, ease: 'easeOut' }}>
              <div className="w-full max-w-3xl rounded-xl border border-zinc-800 bg-[#111318] p-6 shadow-2xl">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#E8E4DC]">
                    {modal.modo === 'criar' ? 'Nova Crise Histórica' : 'Editar Crise Histórica'}
                  </h2>
                  <button type="button" onClick={fecharModal} aria-label="Fechar modal"
                    className="text-xl leading-none text-zinc-500 transition-colors hover:text-zinc-200">✕</button>
                </div>
                <div className="max-h-[76vh] overflow-y-auto pr-1">
                  <AdminCriseForm crise={modal.crise} onSuccess={fecharModal} onCancel={fecharModal} />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  )
}
