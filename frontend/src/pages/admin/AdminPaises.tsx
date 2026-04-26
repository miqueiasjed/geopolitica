import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Badge, Box, Button, Card, Flex, Heading, ScrollArea, Spinner, Table, Text,
} from '@radix-ui/themes'
import { PlusIcon } from '@radix-ui/react-icons'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { buscarAdminPaises, excluirPais, adminKeys } from '../../services/admin'
import { AdminPaisForm } from '../../components/paises/AdminPaisForm'
import type { AdminPerfilPais } from '../../types/admin'

type ModoModal = 'criar' | 'editar'

interface EstadoModal {
  aberto: boolean
  modo: ModoModal
  pais?: AdminPerfilPais
}

export function AdminPaises() {
  const queryClient = useQueryClient()
  const prefersReduced = useReducedMotion()

  const [modal, setModal] = useState<EstadoModal>({ aberto: false, modo: 'criar' })
  const [filtroRegiao, setFiltroRegiao] = useState('')

  const { data: paises = [], isLoading } = useQuery({
    queryKey: adminKeys.paises(),
    queryFn: buscarAdminPaises,
  })

  const mutacaoDeletar = useMutation({
    mutationFn: excluirPais,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.paises() })
    },
  })

  const paisesFiltrados = filtroRegiao
    ? paises.filter((p) => p.regiao_geopolitica === filtroRegiao)
    : paises

  const regioes = [...new Set(paises.map((p) => p.regiao_geopolitica).filter(Boolean))] as string[]

  function fecharModal() {
    setModal((prev) => ({ ...prev, aberto: false }))
  }

  function handleDeletar(codigo: string, nome: string) {
    if (!window.confirm(`Excluir o país "${nome}" (${codigo})? Esta ação remove o país para todos os usuários.`)) return
    mutacaoDeletar.mutate(codigo)
  }

  return (
    <main className="min-h-screen bg-[#0a0a0b] px-6 py-10 text-cyan-50">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <Flex justify="between" align="end" wrap="wrap" gap="4">
          <Box className="space-y-2">
            <Text size="2" className="uppercase tracking-[0.3em] text-cyan-300/70">Painel admin</Text>
            <Heading size="8">Países Base</Heading>
            <Text size="3" className="max-w-2xl text-cyan-100/65">
              Países disponíveis para os usuários adicionarem em "Meus Países". O contexto e análise de liderança
              podem ser deixados em branco — a IA gera automaticamente quando o usuário acessa.
            </Text>
          </Box>
          <Flex align="center" gap="3">
            <Badge size="3" color="cyan" variant="soft">{paisesFiltrados.length} países</Badge>
            <Button size="3" variant="solid" color="amber"
              onClick={() => setModal({ aberto: true, modo: 'criar', pais: undefined })}>
              <PlusIcon /> Novo País
            </Button>
          </Flex>
        </Flex>

        {/* Filtro */}
        {regioes.length > 0 && (
          <Flex align="center" gap="3">
            <Text size="2" className="text-zinc-400">Filtrar por região:</Text>
            <select value={filtroRegiao} onChange={(e) => setFiltroRegiao(e.target.value)}
              className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-xs text-zinc-300 focus:border-[#C9B882] focus:outline-none"
              aria-label="Filtrar por região">
              <option value="">Todas as regiões</option>
              {regioes.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Flex>
        )}

        {/* Tabela */}
        <Card size="4" className="border border-cyan-400/10 bg-slate-950/80 backdrop-blur">
          {isLoading ? (
            <Flex justify="center" py="8"><Spinner size="3" /></Flex>
          ) : (
            <ScrollArea type="auto" scrollbars="horizontal" className="w-full">
              <Table.Root className="min-w-[700px]">
                <Table.Header>
                  <Table.Row className="border-b border-cyan-400/10">
                    <Table.ColumnHeaderCell>País</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Região</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Termos de Busca</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Perfil IA</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Ações</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {paisesFiltrados.length > 0 ? (
                    paisesFiltrados.map((pais) => (
                      <Table.Row key={pais.codigo_pais} className="transition-colors hover:bg-cyan-400/5">
                        <Table.Cell>
                          <div className="flex items-center gap-2">
                            {pais.bandeira_emoji && <span className="text-xl">{pais.bandeira_emoji}</span>}
                            <div>
                              <span className="font-medium text-cyan-50">{pais.nome_pt}</span>
                              <span className="ml-2 font-mono text-xs text-zinc-500">({pais.codigo_pais})</span>
                            </div>
                          </div>
                        </Table.Cell>
                        <Table.Cell className="text-sm text-zinc-400">
                          {pais.regiao_geopolitica ?? <span className="text-zinc-600">—</span>}
                        </Table.Cell>
                        <Table.Cell>
                          <div className="flex flex-wrap gap-1">
                            {(pais.termos_busca ?? []).slice(0, 3).map((t) => (
                              <span key={t} className="rounded border border-zinc-700 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">{t}</span>
                            ))}
                            {(pais.termos_busca ?? []).length > 3 && (
                              <span className="font-mono text-[10px] text-zinc-600">+{pais.termos_busca.length - 3}</span>
                            )}
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          {pais.gerado_em ? (
                            <span className="inline-flex items-center rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 font-mono text-[10px] text-green-400">
                              Gerado
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800/50 px-2 py-0.5 font-mono text-[10px] text-zinc-500">
                              Pendente IA
                            </span>
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          <Flex gap="2">
                            <Button size="1" variant="soft" color="gray"
                              onClick={() => setModal({ aberto: true, modo: 'editar', pais })}>
                              Editar
                            </Button>
                            <Button size="1" variant="soft" color="ruby"
                              disabled={mutacaoDeletar.isPending}
                              onClick={() => handleDeletar(pais.codigo_pais, pais.nome_pt)}>
                              Excluir
                            </Button>
                          </Flex>
                        </Table.Cell>
                      </Table.Row>
                    ))
                  ) : (
                    <Table.Row>
                      <Table.Cell colSpan={5}>
                        <Box className="py-10 text-center">
                          <Text size="3" className="text-cyan-100/65">
                            Nenhum país cadastrado. Clique em "Novo País" para começar.
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
              <div className="w-full max-w-2xl rounded-xl border border-zinc-800 bg-[#111318] p-6 shadow-2xl">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#E8E4DC]">
                    {modal.modo === 'criar' ? 'Novo País' : `Editar — ${modal.pais?.nome_pt}`}
                  </h2>
                  <button type="button" onClick={fecharModal} aria-label="Fechar modal"
                    className="text-xl leading-none text-zinc-500 transition-colors hover:text-zinc-200">✕</button>
                </div>
                <div className="max-h-[76vh] overflow-y-auto pr-1">
                  <AdminPaisForm pais={modal.pais} onSuccess={fecharModal} onCancel={fecharModal} />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  )
}
