import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'framer-motion'
import api from '../../lib/axios'
import { useAuth } from '../../hooks/useAuth'
import { ScoreGauge } from '../../components/ScoreGauge'
import { ExportPdfButton } from '../../components/ExportPdfButton'

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface Ativo {
  ticker: string
  peso: number // 0-100 (percentual na UI)
}

interface RiskScoreResult {
  total: number
  breakdown: { energia: number; alimentos: number; cambio: number; militar: number }
  alertas: Array<{ title: string; level: string }>
  top_riscos: string[]
  calculado_em: string
}

interface CarteiraResponse {
  carteira: {
    nome: string
    ativos: Array<{ ticker: string; peso: number }>
    ultimo_score: RiskScoreResult | null
  } | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function corScore(total: number): string {
  if (total >= 70) return '#EF4444'
  if (total >= 40) return '#FACC15'
  return '#4ade80'
}

function nivelAlerta(level: string): string {
  const l = level.toLowerCase()
  if (l === 'alto' || l === 'high') return '#EF4444'
  if (l === 'médio' || l === 'medio' || l === 'medium') return '#FACC15'
  return '#4ade80'
}

// ─── Gate de plano (inline, pois AddonGate só aceita 'elections' | 'war') ───

function RiskScoreGate() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[#BFFF3C]/60">
          acesso exclusivo
        </p>
        <h2 className="font-serif text-3xl font-bold text-white">Risk Score de Portfólio</h2>
        <p className="text-sm leading-6 text-zinc-400">
          Calcule a exposição geopolítica da sua carteira com base nos eventos ativos. Disponível
          para assinantes Pro e Reservado.
        </p>
        <div className="w-full rounded-xl border border-[#BFFF3C]/30 bg-zinc-900/60 px-6 py-5">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Acesso</p>
          <p className="mt-1 text-2xl font-bold text-[#BFFF3C]">Disponível no plano Pro</p>
        </div>
        <a
          href={import.meta.env.VITE_UPGRADE_PRO_URL || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center rounded-lg bg-[#BFFF3C] px-6 py-3 text-sm font-semibold text-zinc-900 transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BFFF3C]"
        >
          Fazer upgrade para Pro
        </a>
        <p className="text-xs text-zinc-500">
          Usuários do plano{' '}
          <span className="font-medium text-zinc-300">Pro</span> têm acesso incluso
        </p>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function RiskScore() {
  const { user } = useAuth()
  const prefersReduced = useReducedMotion()

  // ── Verificação de plano ──────────────────────────────────────────────────
  const plano = user?.assinante?.plano ?? user?.role

  if (!['pro', 'reservado', 'admin'].includes(plano ?? '')) {
    return <RiskScoreGate />
  }

  return <RiskScoreContent prefersReduced={prefersReduced ?? false} />
}

// ─── Conteúdo da página (separado para evitar hooks em return condicional) ───

function RiskScoreContent({ prefersReduced }: { prefersReduced: boolean }) {
  const [ativos, setAtivos] = useState<Ativo[]>([{ ticker: '', peso: 100 }])
  const [score, setScore] = useState<RiskScoreResult | null>(null)
  const [calculando, setCalculando] = useState(false)
  const [erroPeso, setErroPeso] = useState(false)

  // ── Buscar carteira salva ─────────────────────────────────────────────────
  const { data: carteiraData } = useQuery<CarteiraResponse>({
    queryKey: ['carteira'],
    queryFn: () => api.get('/carteira').then((r) => r.data),
  })

  useEffect(() => {
    if (carteiraData?.carteira) {
      const { ativos: ativosApi, ultimo_score } = carteiraData.carteira

      if (ativosApi && ativosApi.length > 0) {
        setAtivos(
          ativosApi.map((a) => ({
            ticker: a.ticker,
            peso: Math.round(a.peso * 100),
          })),
        )
      }

      if (ultimo_score) {
        setScore(ultimo_score)
      }
    }
  }, [carteiraData])

  // ── Cálculo de soma ───────────────────────────────────────────────────────
  const soma = ativos.reduce((s, a) => s + (a.peso || 0), 0)
  const somaInvalida = Math.abs(soma - 100) > 5

  // ── Handlers de edição ────────────────────────────────────────────────────
  function atualizarTicker(idx: number, valor: string) {
    setAtivos((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, ticker: valor.toUpperCase() } : a)),
    )
  }

  function atualizarPeso(idx: number, valor: string) {
    const num = Number(valor)
    setAtivos((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, peso: Number.isNaN(num) ? 0 : num } : a)),
    )
    setErroPeso(false)
  }

  function adicionarAtivo() {
    if (ativos.length >= 20) return
    setAtivos((prev) => [...prev, { ticker: '', peso: 0 }])
  }

  function removerAtivo(idx: number) {
    setAtivos((prev) => prev.filter((_, i) => i !== idx))
  }

  // ── Calcular risk score ───────────────────────────────────────────────────
  async function calcular() {
    if (somaInvalida || ativos.some((a) => !a.ticker.trim())) {
      setErroPeso(true)
      return
    }

    setCalculando(true)
    try {
      const response = await api.post('/carteira', {
        ativos: ativos.map((a) => ({
          ticker: a.ticker.toUpperCase(),
          peso: a.peso / 100,
        })),
      })
      setScore(response.data.score)
    } finally {
      setCalculando(false)
    }
  }

  const botaoDesabilitado =
    calculando || somaInvalida || ativos.some((a) => !a.ticker.trim())

  // ── Variantes de animação ─────────────────────────────────────────────────
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
  }

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col gap-6"
    >
      {/* ── Cabeçalho ───────────────────────────────────────────────────── */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-[#BFFF3C]/60">
          Geopolítica para Investidores
        </p>
        <h1 className="mt-1 font-serif text-xl font-bold text-white">Risk Score de Portfólio</h1>
      </div>

      {/* ── Formulário de ativos ─────────────────────────────────────────── */}
      <section className="rounded-xl border border-[#BFFF3C]/20 p-6">
        <p className="mb-4 font-mono text-xs uppercase tracking-widest text-white/40">
          Composição da carteira
        </p>

        <motion.ul
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-2"
        >
          <AnimatePresence mode="popLayout">
            {ativos.map((ativo, idx) => (
              <motion.li
                key={idx}
                variants={itemVariants}
                layout={!prefersReduced}
                exit={{ opacity: 0, x: -10, transition: { duration: 0.2, ease: 'easeIn' } }}
                className="flex items-center gap-3"
              >
                {/* Ticker */}
                <input
                  type="text"
                  value={ativo.ticker}
                  onChange={(e) => atualizarTicker(idx, e.target.value)}
                  placeholder="PETR4"
                  maxLength={10}
                  aria-label={`Ticker do ativo ${idx + 1}`}
                  className="w-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm uppercase text-white placeholder-white/20 outline-none focus:border-[#BFFF3C]/40 focus:ring-0"
                />

                {/* Peso */}
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={ativo.peso || ''}
                    onChange={(e) => atualizarPeso(idx, e.target.value)}
                    placeholder="30"
                    aria-label={`Peso do ativo ${idx + 1} em porcentagem`}
                    className="w-20 rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white placeholder-white/20 outline-none focus:border-[#BFFF3C]/40 focus:ring-0"
                  />
                  <span className="font-mono text-xs text-white/40">%</span>
                </div>

                {/* Remover */}
                {ativos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removerAtivo(idx)}
                    aria-label={`Remover ativo ${ativo.ticker || idx + 1}`}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-white/30 transition-colors hover:border-red-500/30 hover:text-red-400"
                  >
                    ×
                  </button>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>

        {/* Soma de pesos */}
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={adicionarAtivo}
            disabled={ativos.length >= 20}
            className="font-mono text-xs text-[#BFFF3C]/60 transition-colors hover:text-[#BFFF3C] disabled:cursor-not-allowed disabled:opacity-30"
          >
            + Adicionar ativo
          </button>

          <span
            className={`ml-auto font-mono text-xs ${
              somaInvalida ? 'text-red-400' : 'text-white/30'
            }`}
          >
            Total: {soma}%
          </span>
        </div>

        {/* Aviso de peso inválido */}
        <AnimatePresence>
          {(somaInvalida || erroPeso) && (
            <motion.p
              key="erro-peso"
              initial={prefersReduced ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="mt-2 text-xs text-red-400"
              role="alert"
            >
              Os pesos devem somar 100%. Atualmente: {soma}%
            </motion.p>
          )}
        </AnimatePresence>

        {/* Botão calcular */}
        <button
          type="button"
          onClick={calcular}
          disabled={botaoDesabilitado}
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-[#BFFF3C]/30 bg-[#BFFF3C]/10 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-[#BFFF3C] transition-all hover:bg-[#BFFF3C]/20 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {calculando ? (
            <>
              <span
                className="h-3 w-3 animate-spin rounded-full border border-[#BFFF3C]/40 border-t-[#BFFF3C]"
                aria-hidden="true"
              />
              Calculando…
            </>
          ) : (
            'Calcular risk score →'
          )}
        </button>
      </section>

      {/* ── Resultado ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {score !== null && (
          <motion.div
            key="resultado"
            initial={prefersReduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* Score total */}
            <div className="border border-[#BFFF3C]/20 rounded-xl p-6 mt-6">
              <p className="text-xs tracking-widest uppercase text-[#BFFF3C]/60">
                Score geopolítico do portfólio
              </p>

              <div className="flex items-baseline gap-2 mt-3">
                <span
                  className="text-6xl font-mono font-bold"
                  style={{ color: corScore(score.total) }}
                >
                  {score.total}
                </span>
                <span className="text-lg text-white/30">/100</span>
              </div>

              {score.top_riscos.length > 0 && (
                <p className="mt-2 text-sm text-white/50">
                  Maior risco: {score.top_riscos.join(' e ')}
                </p>
              )}
            </div>

            {/* Breakdown por categoria */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <ScoreGauge valor={score.breakdown.energia} label="Energia" />
              <ScoreGauge valor={score.breakdown.alimentos} label="Alimentos" />
              <ScoreGauge valor={score.breakdown.cambio} label="Câmbio" />
              <ScoreGauge valor={score.breakdown.militar} label="Geopolítica Militar" />
            </div>

            {/* Alertas preditivos */}
            {score.alertas.length > 0 && (
              <section className="mt-6">
                <p className="text-xs uppercase tracking-widest text-white/40 mb-3">
                  Alertas preditivos ativos
                </p>
                <motion.ul
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
                  }}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-2"
                >
                  {score.alertas.map((alerta, i) => (
                    <motion.li
                      key={i}
                      variants={{
                        hidden: { opacity: 0, y: 8 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
                      }}
                      className="flex items-start gap-3"
                    >
                      <span
                        className="mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-medium"
                        style={{
                          color: nivelAlerta(alerta.level),
                          borderColor: `${nivelAlerta(alerta.level)}33`,
                          backgroundColor: `${nivelAlerta(alerta.level)}10`,
                        }}
                      >
                        {alerta.level}
                      </span>
                      <p className="text-sm text-white/70">{alerta.title}</p>
                    </motion.li>
                  ))}
                </motion.ul>
              </section>
            )}

            {/* Exportar PDF */}
            <div className="mt-4">
              <ExportPdfButton tipo="risk_score" id="current" label="Exportar relatório PDF" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
