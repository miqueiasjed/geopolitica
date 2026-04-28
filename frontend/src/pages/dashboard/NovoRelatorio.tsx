import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { useGerarRelatorio } from '../../hooks/useGerarRelatorio'
import { ExportPdfButton } from '../../components/ExportPdfButton'

const SUGESTOES_TEMA = [
  'Risco energético para portfólios com exposição europeia',
  'Impacto da guerra no Oriente Médio nas cadeias de fertilizantes para o Brasil',
  'Eleições de 2026 nos EUA — cenários e implicações para emergentes',
  'Risco geopolítico no setor de semicondutores — tensão EUA-China',
  'Panorama de risco para o agronegócio brasileiro — próximos 90 dias',
]

export function NovoRelatorio() {
  const prefersReduced = useReducedMotion()
  const navigate = useNavigate()

  const {
    topico,
    setTopico,
    escopo,
    setEscopo,
    gerando,
    preview,
    relatorioId,
    erroLimite,
    gerar,
  } = useGerarRelatorio()

  const desabilitado = topico.trim() === '' || gerando || erroLimite

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReduced ? 0 : 0.3, ease: 'easeOut' }}
      className="mx-auto max-w-3xl space-y-8"
    >
      {/* Cabeçalho */}
      <div className="space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-widest text-[#C9B882]/70">
          Geopolítica para Investidores
        </p>
        <h1 className="font-serif text-xl font-semibold text-white">
          Relatório Personalizado por IA
        </h1>
      </div>

      {/* Formulário */}
      <div className="space-y-6 rounded-xl border border-zinc-800 bg-[#0f1117] p-6">
        {/* Campo de tema */}
        <div className="space-y-2">
          <label
            htmlFor="topico"
            className="block font-mono text-xs uppercase tracking-widest text-zinc-400"
          >
            Tema do relatório
          </label>
          <input
            id="topico"
            type="text"
            value={topico}
            onChange={(e) => setTopico(e.target.value)}
            placeholder="Ex: Impacto da tensão EUA-China nos mercados emergentes"
            className="w-full rounded-lg border border-zinc-800 bg-[#111113] px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[#C9B882]/40 focus:outline-none focus:ring-1 focus:ring-[#C9B882]/20 transition-colors"
            disabled={gerando}
            aria-label="Tema do relatório"
          />
        </div>

        {/* Sugestões de tema */}
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
            Sugestões
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGESTOES_TEMA.map((sugestao) => (
              <button
                key={sugestao}
                type="button"
                onClick={() => setTopico(sugestao)}
                disabled={gerando}
                className="rounded-full border border-zinc-800 bg-transparent px-3 py-1.5 text-left text-xs text-zinc-500 transition-colors hover:border-[#C9B882]/30 hover:bg-[#C9B882]/5 hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sugestao}
              </button>
            ))}
          </div>
        </div>

        {/* Campo de escopo adicional */}
        <div className="space-y-2">
          <label
            htmlFor="escopo"
            className="block font-mono text-xs uppercase tracking-widest text-zinc-400"
          >
            Escopo adicional{' '}
            <span className="normal-case tracking-normal text-zinc-600">(opcional)</span>
          </label>
          <textarea
            id="escopo"
            value={escopo}
            onChange={(e) => setEscopo(e.target.value)}
            rows={2}
            placeholder="Ex: Foco no impacto para exportadores de soja. Horizonte de 90 dias."
            className="w-full resize-none rounded-lg border border-zinc-800 bg-[#111113] px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[#C9B882]/40 focus:outline-none focus:ring-1 focus:ring-[#C9B882]/20 transition-colors"
            disabled={gerando}
            aria-label="Escopo adicional"
          />
        </div>

        {/* Botão principal */}
        <button
          type="button"
          onClick={() => void gerar()}
          disabled={desabilitado}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#C9B882]/40 bg-[#C9B882]/10 px-6 py-3 font-mono text-sm uppercase tracking-widest text-[#C9B882] transition-all hover:bg-[#C9B882]/20 disabled:cursor-not-allowed disabled:opacity-40"
          aria-busy={gerando}
        >
          {gerando ? (
            <>
              <span
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#C9B882]/30 border-t-[#C9B882]"
                aria-hidden="true"
              />
              Gerando relatório…
            </>
          ) : (
            'Gerar relatório →'
          )}
        </button>
      </div>

      {/* Aviso de limite atingido */}
      <AnimatePresence>
        {erroLimite && (
          <motion.div
            key="aviso-limite"
            initial={prefersReduced ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: prefersReduced ? 0 : 0.25, ease: 'easeOut' }}
            role="alert"
            className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400"
          >
            Limite de relatórios mensais atingido. Faça upgrade do seu plano.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview em streaming */}
      <AnimatePresence>
        {preview !== '' && (
          <motion.div
            key="preview"
            initial={prefersReduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.3, ease: 'easeOut' }}
            className="space-y-4"
          >
            <div className="rounded-xl border border-white/8 bg-[#0f1117] p-6">
              <div className="prose prose-invert max-w-none prose-headings:text-zinc-100 prose-p:text-zinc-300 prose-strong:text-zinc-100 prose-li:text-zinc-300 prose-a:text-[#C9B882]">
                <ReactMarkdown>{preview}</ReactMarkdown>
              </div>
            </div>

            {/* Ações pós-geração */}
            {relatorioId !== null && (
              <motion.div
                initial={prefersReduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: prefersReduced ? 0 : 0.3, ease: 'easeOut' }}
                className="flex flex-wrap items-center gap-3"
              >
                <ExportPdfButton tipo="report" id={relatorioId} label="Exportar PDF" />
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/relatorios')}
                  className="flex items-center gap-1.5 rounded-full border border-zinc-800 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
                >
                  Ver histórico
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
