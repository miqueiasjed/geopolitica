import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { DownloadIcon, UploadIcon } from '@radix-ui/react-icons'
import { adminProdutos } from '../../services/adminProdutos'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ErroImportacao = { linha: number; motivo: string }

type RelatorioFinal = { importados: number; criados: number; erros: ErroImportacao[] }

type Progresso = {
  status: 'processando' | 'concluido' | 'erro'
  total: number
  processados: number
  importados: number
  criados: number
  erros: ErroImportacao[]
  mensagem?: string
}

// ─── Parser CSV inline ────────────────────────────────────────────────────────

function parseCsvPreview(texto: string): { cabecalhos: string[]; linhas: string[][] } {
  const todasLinhas = texto.split(/\r?\n/).filter((l) => l.trim())
  if (todasLinhas.length === 0) return { cabecalhos: [], linhas: [] }

  const primeiraLinha = todasLinhas[0]
  const sep = (primeiraLinha.match(/;/g)?.length ?? 0) > (primeiraLinha.match(/,/g)?.length ?? 0) ? ';' : ','

  const dividir = (linha: string): string[] => linha.split(sep).map((c) => c.replace(/^"|"$/g, '').trim())

  const cabecalhos = dividir(primeiraLinha)
  const linhas = todasLinhas.slice(1, 6).map(dividir)

  return { cabecalhos, linhas }
}

// ─── Helpers de download ──────────────────────────────────────────────────────

function baixarBlob(blob: Blob, nomeArquivo: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  a.click()
  URL.revokeObjectURL(url)
}

function baixarTemplate() {
  const blob = new Blob(['email,addon_key,status,fonte,iniciado_em,expira_em\n'], { type: 'text/csv' })
  baixarBlob(blob, 'template_addons.csv')
}

// ─── Componente de preview CSV ────────────────────────────────────────────────

function PreviewCsv({ arquivo }: { arquivo: File }) {
  const [dados, setDados] = useState<{ cabecalhos: string[]; linhas: string[][] } | null>(null)
  const [carregado, setCarregado] = useState(false)

  if (!carregado) {
    const extensao = arquivo.name.split('.').pop()?.toLowerCase()
    if (extensao !== 'csv') {
      return (
        <p className="font-mono text-[11px] text-zinc-500 italic">
          Prévia disponível apenas para arquivos CSV.
        </p>
      )
    }
    arquivo.text().then((texto) => {
      setDados(parseCsvPreview(texto))
      setCarregado(true)
    })
    return null
  }

  if (!dados || dados.cabecalhos.length === 0) return null

  return (
    <div className="overflow-x-auto rounded-lg border border-[#2a2a2e]">
      <table className="w-full min-w-[400px] text-left">
        <thead>
          <tr className="border-b border-[#2a2a2e] bg-[#111113]">
            {dados.cabecalhos.map((col, i) => (
              <th
                key={i}
                className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dados.linhas.map((linha, i) => (
            <tr key={i} className="border-b border-[#1e1e20] last:border-0">
              {linha.map((cel, j) => (
                <td key={j} className="px-3 py-2 font-mono text-xs text-zinc-300">
                  {cel}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Card de progresso em tempo real ─────────────────────────────────────────

function CardProgresso({ progresso, prefersReduced }: { progresso: Progresso; prefersReduced: boolean | null }) {
  const pct = progresso.total > 0 ? Math.round((progresso.processados / progresso.total) * 100) : 0

  if (progresso.status === 'erro') {
    return (
      <motion.div
        initial={prefersReduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReduced ? 0 : 0.25 }}
        className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3"
      >
        <p className="font-mono text-sm text-red-400">{progresso.mensagem ?? 'Erro ao processar importação.'}</p>
      </motion.div>
    )
  }

  if (progresso.status === 'concluido') {
    return (
      <motion.div
        initial={prefersReduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReduced ? 0 : 0.25 }}
        className="space-y-3"
      >
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 space-y-1">
          <p className="font-mono text-sm text-green-400">
            ✓ {progresso.importados} registro{progresso.importados !== 1 ? 's' : ''} processado{progresso.importados !== 1 ? 's' : ''} com sucesso
          </p>
          {progresso.criados > 0 && (
            <p className="font-mono text-xs text-green-300/70">
              {progresso.criados} usuário{progresso.criados !== 1 ? 's' : ''} novo{progresso.criados !== 1 ? 's' : ''} criado{progresso.criados !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {progresso.erros.length > 0 && (
          <div className="space-y-2">
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
              <p className="font-mono text-sm text-amber-400">
                ⚠ {progresso.erros.length} erro{progresso.erros.length !== 1 ? 's' : ''} encontrado{progresso.erros.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="max-h-48 overflow-y-auto rounded-lg border border-[#2a2a2e]">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#2a2a2e] bg-[#111113]">
                    <th className="w-20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">Linha</th>
                    <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {progresso.erros.map((erro, i) => (
                    <tr key={i} className="border-b border-[#1e1e20] last:border-0">
                      <td className="px-3 py-2 font-mono text-xs text-zinc-400">{erro.linha}</td>
                      <td className="px-3 py-2 font-mono text-xs text-red-400">{erro.motivo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    )
  }

  // processando
  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReduced ? 0 : 0.25 }}
      className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <p className="font-mono text-sm text-blue-300">Processando importação…</p>
        <p className="font-mono text-xs text-blue-400/70">{pct}%</p>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-500/10">
        <motion.div
          className="h-full rounded-full bg-blue-500/60"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      <div className="flex items-center justify-between font-mono text-[11px] text-zinc-500">
        <span>{progresso.processados} de {progresso.total} linhas analisadas</span>
        {progresso.importados > 0 && (
          <span className="text-green-400/70">{progresso.importados} ok</span>
        )}
        {progresso.erros.length > 0 && (
          <span className="text-amber-400/70">{progresso.erros.length} erro{progresso.erros.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      <p className="font-mono text-[10px] text-zinc-600">Você pode sair desta página. A importação continuará em segundo plano.</p>
    </motion.div>
  )
}

// ─── Card de relatório (importação síncrona pequena) ─────────────────────────

function CardRelatorio({ relatorio, prefersReduced }: { relatorio: RelatorioFinal; prefersReduced: boolean | null }) {
  const { importados, criados, erros } = relatorio

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReduced ? 0 : 0.25 }}
      className="space-y-3"
    >
      <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 space-y-1">
        <p className="font-mono text-sm text-green-400">
          ✓ {importados} registro{importados !== 1 ? 's' : ''} processado{importados !== 1 ? 's' : ''} com sucesso
        </p>
        {criados > 0 && (
          <p className="font-mono text-xs text-green-300/70">
            {criados} usuário{criados !== 1 ? 's' : ''} novo{criados !== 1 ? 's' : ''} criado{criados !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {erros.length > 0 && (
        <div className="space-y-2">
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <p className="font-mono text-sm text-amber-400">
              ⚠ {erros.length} erro{erros.length !== 1 ? 's' : ''} encontrado{erros.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="max-h-48 overflow-y-auto rounded-lg border border-[#2a2a2e]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#2a2a2e] bg-[#111113]">
                  <th className="w-20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">Linha</th>
                  <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {erros.map((erro, i) => (
                  <tr key={i} className="border-b border-[#1e1e20] last:border-0">
                    <td className="px-3 py-2 font-mono text-xs text-zinc-400">{erro.linha}</td>
                    <td className="px-3 py-2 font-mono text-xs text-red-400">{erro.motivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function AdminImportarAddons() {
  const prefersReduced = useReducedMotion()
  const inputRef = useRef<HTMLInputElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [arquivo, setArquivo] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [relatorio, setRelatorio] = useState<RelatorioFinal | null>(null)
  const [progresso, setProgresso] = useState<Progresso | null>(null)
  const [erroRede, setErroRede] = useState<string | null>(null)
  const [planoPadrao, setPlanoPadrao] = useState('monitor_guerra')

  function pararPolling() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => () => pararPolling(), [])

  function iniciarPolling(jobId: string) {
    pararPolling()

    async function verificar() {
      try {
        const dados = await adminProdutos.statusImportacaoAddons(jobId)

        if (dados.status === 'nao_encontrado') return

        setProgresso({
          status: dados.status as Progresso['status'],
          total: dados.total ?? 0,
          processados: dados.processados ?? 0,
          importados: dados.importados ?? 0,
          criados: dados.criados ?? 0,
          erros: dados.erros ?? [],
          mensagem: dados.mensagem,
        })

        if (dados.status === 'concluido' || dados.status === 'erro') {
          pararPolling()
        }
      } catch {
        // ignora erros de rede transitórios no polling
      }
    }

    verificar()
    intervalRef.current = setInterval(verificar, 2500)
  }

  const mutacaoExportar = useMutation({
    mutationFn: () => adminProdutos.exportarAddons(),
    onSuccess: (blob) => baixarBlob(blob, 'addons_ativos.csv'),
  })

  const mutacaoImportar = useMutation({
    mutationFn: (file: File) => adminProdutos.importarAddons(file, planoPadrao || undefined),
    onSuccess: (data) => {
      setErroRede(null)

      if ('job_id' in data) {
        iniciarPolling(data.job_id)
      } else {
        setRelatorio(data)
      }
    },
    onError: (err: { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string }) => {
      const errosValidacao = err.response?.data?.errors
      const primeiroErro = errosValidacao ? Object.values(errosValidacao).flat()[0] : undefined
      setErroRede(primeiroErro ?? err.response?.data?.message ?? err.message ?? 'Erro ao importar o arquivo.')
      setRelatorio(null)
      setProgresso(null)
    },
  })

  function selecionarArquivo(file: File) {
    setArquivo(file)
    setRelatorio(null)
    setProgresso(null)
    setErroRede(null)
    pararPolling()
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) selecionarArquivo(file)
  }

  function handleImportar() {
    if (!arquivo) return
    setRelatorio(null)
    setProgresso(null)
    mutacaoImportar.mutate(arquivo)
  }

  const importando = mutacaoImportar.isPending
  const emFila = progresso !== null && progresso.status === 'processando'

  return (
    <motion.main
      className="min-h-screen bg-[#0a0a0b] px-6 py-10 text-zinc-100"
      initial={prefersReduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReduced ? 0 : 0.3 }}
    >
      <div className="mx-auto max-w-2xl space-y-8">

        {/* Header */}
        <div className="space-y-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#C9B882]">
            admin
          </span>
          <h1 className="text-2xl font-semibold text-zinc-100">Importar Addons</h1>
          <p className="text-sm text-zinc-500">
            Envie um CSV ou XLSX para atribuir addons em massa a assinantes existentes.
          </p>
        </div>

        {/* Ações de suporte */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={baixarTemplate}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#C9B882]/30 bg-[#C9B882]/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#C9B882] hover:bg-[#C9B882]/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
            Baixar Template
          </button>

          <button
            type="button"
            onClick={() => mutacaoExportar.mutate()}
            disabled={mutacaoExportar.isPending}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#C9B882]/30 bg-[#C9B882]/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#C9B882] hover:bg-[#C9B882]/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
            {mutacaoExportar.isPending ? 'Exportando…' : 'Exportar addons atuais'}
          </button>
        </div>

        {/* Card de upload */}
        <div className="rounded-xl border border-[#1e1e20] bg-[#0d0d0f] p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">
              Arquivo
            </label>

            <div
              role="button"
              tabIndex={0}
              aria-label="Selecionar arquivo para importação"
              onClick={() => !importando && inputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!importando) inputRef.current?.click() } }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={[
                'flex min-h-[120px] w-full cursor-pointer select-none flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-8 transition-colors',
                importando ? 'cursor-not-allowed opacity-50' : '',
                dragging
                  ? 'border-[#C9B882]/60 bg-[#C9B882]/5'
                  : arquivo
                    ? 'border-[#C9B882]/30 bg-[#C9B882]/5'
                    : 'border-[#2a2a2e] hover:border-[#C9B882]/30',
              ].join(' ')}
            >
              <UploadIcon className="h-6 w-6 text-zinc-500" />
              {arquivo ? (
                <span className="font-mono text-sm text-zinc-200">{arquivo.name}</span>
              ) : (
                <span className="font-mono text-sm text-zinc-500">
                  Clique ou arraste um <span className="text-zinc-300">.csv</span> ou{' '}
                  <span className="text-zinc-300">.xlsx</span>
                </span>
              )}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              disabled={importando}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) selecionarArquivo(file)
              }}
            />
          </div>

          {/* Plano para novos usuários */}
          <div className="space-y-1.5">
            <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">
              Plano para novos usuários
            </label>
            <input
              type="text"
              value={planoPadrao}
              onChange={(e) => setPlanoPadrao(e.target.value)}
              placeholder="monitor_guerra"
              disabled={importando}
              className="w-full rounded-lg border border-[#2a2a2e] bg-[#111113] px-3 py-2 font-mono text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#C9B882]/40 focus:outline-none disabled:opacity-50"
            />
            <p className="font-mono text-[10px] text-zinc-600">
              Slug do plano a atribuir a usuários que ainda não têm cadastro.
            </p>
          </div>

          {/* Preview */}
          <AnimatePresence>
            {arquivo && (
              <motion.div
                key="preview"
                initial={prefersReduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: prefersReduced ? 0 : 0.2 }}
                className="space-y-2"
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                  Prévia — 5 primeiras linhas
                </p>
                <PreviewCsv arquivo={arquivo} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botão importar */}
          <button
            type="button"
            onClick={handleImportar}
            disabled={!arquivo || importando || emFila}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-[#C9B882]/30 bg-[#C9B882]/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#C9B882] hover:bg-[#C9B882]/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {importando ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border border-[#C9B882]/40 border-t-[#C9B882]" />
                Enviando…
              </>
            ) : (
              <>
                <UploadIcon className="h-3.5 w-3.5" />
                Importar
              </>
            )}
          </button>
        </div>

        {/* Erro de rede */}
        <AnimatePresence>
          {erroRede && (
            <motion.div
              key="erro-rede"
              initial={prefersReduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReduced ? 0 : 0.25 }}
              className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3"
            >
              <p className="font-mono text-sm text-red-400">{erroRede}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progresso em tempo real (fila) */}
        <AnimatePresence>
          {progresso && (
            <CardProgresso
              key="progresso"
              progresso={progresso}
              prefersReduced={prefersReduced}
            />
          )}
        </AnimatePresence>

        {/* Relatório síncrono (arquivos pequenos ≤50 linhas) */}
        <AnimatePresence>
          {relatorio && (
            <CardRelatorio
              key="relatorio"
              relatorio={relatorio}
              prefersReduced={prefersReduced}
            />
          )}
        </AnimatePresence>

      </div>
    </motion.main>
  )
}
