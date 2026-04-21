import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { PlusIcon } from '@radix-ui/react-icons'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import api from '../../lib/axios'
import { useEleicoes, eleicoesKeys } from '../../hooks/useEleicoes'
import { AdminEleicaoForm } from '../../components/eleicoes/AdminEleicaoForm'
import { formatarDataCurta } from '../../utils/formatters'
import type { EleicaoDetalhe, RelevanciaEleicao } from '../../types/eleicao'
import { CORES_RELEVANCIA } from '../../types/eleicao'

const ANO_ATUAL = new Date().getFullYear()
const ANOS = [2024, 2025, 2026, 2027, 2028]

const LABEL_RELEVANCIA: Record<RelevanciaEleicao, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
}

function BadgeRelevancia({ relevancia }: { relevancia: RelevanciaEleicao }) {
  const cor = CORES_RELEVANCIA[relevancia]
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-xs uppercase tracking-[0.12em]"
      style={{
        color: cor,
        backgroundColor: `${cor}1A`,
        border: `1px solid ${cor}4D`,
      }}
    >
      {LABEL_RELEVANCIA[relevancia]}
    </span>
  )
}

async function fetchEleicaoDetalhe(id: number): Promise<EleicaoDetalhe> {
  const res = await api.get<{ data: EleicaoDetalhe }>(`/eleicoes/${id}`)
  return res.data.data
}

async function deletarEleicao(id: number): Promise<void> {
  await api.delete(`/admin/eleicoes/${id}`)
}

type ModoModal = 'criar' | 'editar'

interface EstadoModal {
  aberto: boolean
  modo: ModoModal
  eleicaoDetalhe?: EleicaoDetalhe
}

export function AdminEleicoes() {
  const queryClient = useQueryClient()
  const prefersReduced = useReducedMotion()

  const [ano, setAno] = useState(ANO_ATUAL)
  const [modal, setModal] = useState<EstadoModal>({ aberto: false, modo: 'criar' })
  const [carregandoEdicao, setCarregandoEdicao] = useState<number | null>(null)

  const { eleicoes, isLoading } = useEleicoes({ ano })

  const mutacaoDeletar = useMutation({
    mutationFn: deletarEleicao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eleicoesKeys.all })
    },
  })

  function abrirModalCriacao() {
    setModal({ aberto: true, modo: 'criar', eleicaoDetalhe: undefined })
  }

  async function abrirModalEdicao(id: number) {
    setCarregandoEdicao(id)
    try {
      const detalhe = await fetchEleicaoDetalhe(id)
      setModal({ aberto: true, modo: 'editar', eleicaoDetalhe: detalhe })
    } finally {
      setCarregandoEdicao(null)
    }
  }

  function fecharModal() {
    setModal((prev) => ({ ...prev, aberto: false }))
  }

  function handleSucesso() {
    fecharModal()
  }

  function handleDeletar(id: number, pais: string) {
    const confirmado = window.confirm(
      `Deseja excluir a eleição de "${pais}"? Esta ação não pode ser desfeita.`,
    )
    if (!confirmado) return
    mutacaoDeletar.mutate(id)
  }

  return (
    <main className="min-h-screen bg-[#0a0a0b] px-6 py-10 text-cyan-50">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <Flex justify="between" align="end" wrap="wrap" gap="4">
          <Box className="space-y-2">
            <Text size="2" className="uppercase tracking-[0.3em] text-cyan-300/70">
              Painel admin
            </Text>
            <Heading size="8">Gerenciar Eleições</Heading>
            <Text size="3" className="max-w-2xl text-cyan-100/65">
              Cadastro e gerenciamento das eleições globais monitoradas.
            </Text>
          </Box>

          <Flex align="center" gap="3">
            <Badge size="3" color="cyan" variant="soft">
              {eleicoes.length} registros
            </Badge>
            <Button size="3" variant="solid" color="amber" onClick={abrirModalCriacao}>
              <PlusIcon />
              Nova Eleição
            </Button>
          </Flex>
        </Flex>

        {/* Filtro de ano */}
        <Flex align="center" gap="3">
          <Text size="2" className="text-zinc-400">
            Filtrar por ano:
          </Text>
          <select
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
            className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-xs text-zinc-300 focus:border-[#C9B882] focus:outline-none"
            aria-label="Filtrar por ano"
          >
            {ANOS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </Flex>

        {/* Tabela */}
        <Card size="4" className="border border-cyan-400/10 bg-slate-950/80 backdrop-blur">
          {isLoading ? (
            <Flex justify="center" py="8">
              <Spinner size="3" />
            </Flex>
          ) : (
            <ScrollArea type="auto" scrollbars="horizontal" className="w-full">
              <Table.Root className="min-w-[700px]">
                <Table.Header>
                  <Table.Row className="border-b border-cyan-400/10">
                    <Table.ColumnHeaderCell>País</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Data</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Tipo</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Relevância</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Ações</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {eleicoes.length > 0 ? (
                    eleicoes.map((eleicao) => (
                      <Table.Row
                        key={eleicao.id}
                        className="transition-colors hover:bg-cyan-400/5"
                      >
                        <Table.Cell className="font-medium text-cyan-50">
                          {eleicao.pais}
                          <span className="ml-2 font-mono text-xs text-zinc-500">
                            ({eleicao.codigo_pais})
                          </span>
                        </Table.Cell>
                        <Table.Cell>
                          {formatarDataCurta(eleicao.data_eleicao + 'T12:00:00')}
                        </Table.Cell>
                        <Table.Cell>{eleicao.tipo_eleicao}</Table.Cell>
                        <Table.Cell>
                          <BadgeRelevancia relevancia={eleicao.relevancia} />
                        </Table.Cell>
                        <Table.Cell>
                          <Flex gap="2">
                            <Button
                              size="1"
                              variant="soft"
                              color="gray"
                              disabled={carregandoEdicao === eleicao.id}
                              onClick={() => abrirModalEdicao(eleicao.id)}
                            >
                              {carregandoEdicao === eleicao.id ? 'Carregando...' : 'Editar'}
                            </Button>
                            <Button
                              size="1"
                              variant="soft"
                              color="ruby"
                              disabled={mutacaoDeletar.isPending}
                              onClick={() => handleDeletar(eleicao.id, eleicao.pais)}
                            >
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
                            Nenhuma eleição cadastrada para {ano}.
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

      {/* Modal com formulário */}
      <AnimatePresence>
        {modal.aberto && (
          <>
            {/* Overlay */}
            <motion.div
              key="modal-overlay"
              className="fixed inset-0 z-40 bg-black/60"
              initial={prefersReduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReduced ? 0 : 0.2 }}
              onClick={fecharModal}
              aria-hidden="true"
            />

            {/* Conteúdo do modal */}
            <motion.div
              key="modal-content"
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={prefersReduced ? false : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: prefersReduced ? 0 : 0.2, ease: 'easeOut' }}
            >
              <div className="w-full max-w-2xl rounded-xl border border-zinc-800 bg-[#111318] p-6 shadow-2xl">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#E8E4DC]">
                    {modal.modo === 'criar' ? 'Nova Eleição' : 'Editar Eleição'}
                  </h2>
                  <button
                    type="button"
                    onClick={fecharModal}
                    aria-label="Fechar modal"
                    className="text-zinc-500 transition-colors hover:text-zinc-200 text-xl leading-none"
                  >
                    ✕
                  </button>
                </div>
                <div className="max-h-[70vh] overflow-y-auto pr-1">
                  <AdminEleicaoForm
                    eleicao={modal.eleicaoDetalhe}
                    onSuccess={handleSucesso}
                    onCancel={fecharModal}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  )
}
