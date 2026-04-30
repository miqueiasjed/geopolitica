import { ArrowLeftIcon, ExternalLinkIcon, GlobeIcon } from '@radix-ui/react-icons'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { ImpactBadge } from '../components/ImpactBadge'
import { useEventDetail, useGerarEditorial } from '../hooks/useEventDetail'
import { formatDistanceToNow } from '../utils/relativeTime'
import type { ImpactLabel } from '../types/feed'

const scoreStyles: Record<ImpactLabel, string> = {
  CRÍTICO: 'text-red-400',
  ALTO: 'text-orange-400',
  MÉDIO: 'text-yellow-400',
  MONITORAR: 'text-blue-400',
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 w-24 rounded bg-zinc-800" />
      <div className="space-y-3">
        <div className="h-8 w-3/4 rounded bg-zinc-800" />
        <div className="h-6 w-1/2 rounded bg-zinc-800" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-zinc-800" />
        <div className="h-4 w-full rounded bg-zinc-800" />
        <div className="h-4 w-2/3 rounded bg-zinc-800" />
      </div>
    </div>
  )
}

export function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const prefersReduced = useReducedMotion()

  const { data: event, isLoading, isError } = useEventDetail(id ?? '')
  const { data: editorial, isPending: gerando, mutate: gerarEditorial, error: erroEditorial } = useGerarEditorial(id ?? '')

  if (isLoading) {
    return (
      <section className="mx-auto max-w-3xl space-y-8">
        <Skeleton />
      </section>
    )
  }

  if (isError || !event) {
    return (
      <section className="mx-auto max-w-3xl space-y-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-zinc-500 transition-colors hover:text-white"
        >
          <ArrowLeftIcon />
          Voltar
        </button>
        <p className="text-sm text-zinc-500">Evento não encontrado.</p>
      </section>
    )
  }

  const publishedAt = event.publicado_em ? formatDistanceToNow(event.publicado_em) : 'sem data'

  return (
    <section className="mx-auto max-w-3xl space-y-8">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-zinc-500 transition-colors hover:text-white"
      >
        <ArrowLeftIcon />
        Voltar ao feed
      </button>

      <motion.div
        initial={prefersReduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="space-y-6"
      >
        {/* Header do evento */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className={`font-mono text-4xl font-semibold ${scoreStyles[event.impact_label]}`}>
              {event.impact_score}
            </div>
            <ImpactBadge label={event.impact_label} score={event.impact_score} />
            <span className="rounded-full border border-white/6 bg-white/3 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              {event.fonte}
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-zinc-500">{publishedAt}</span>
            {event.regiao && (
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/10 bg-cyan-500/5 px-3 py-1 text-xs text-cyan-100/75">
                <GlobeIcon />
                <span className="font-mono uppercase tracking-[0.16em]">{event.regiao}</span>
              </div>
            )}
          </div>

          <h1 className="text-2xl font-semibold leading-tight text-white sm:text-3xl">{event.titulo}</h1>

          <div className="flex flex-wrap gap-2">
            {event.categorias.map((cat) => (
              <span
                key={cat}
                className="rounded-full border border-[#BFFF3C]/20 bg-[#BFFF3C]/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[#BFFF3C]"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>

        {/* Resumo e análise */}
        <div className="rounded-xl border border-[#1e1e20] bg-[#111113] p-5 space-y-4">
          {event.analise_ia ? (
            <div className="space-y-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#BFFF3C]/60">Análise IA</p>
              <p className="text-sm leading-7 text-zinc-300">{event.analise_ia}</p>
            </div>
          ) : null}

          {event.resumo && (
            <div className="space-y-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">Resumo original</p>
              <p className="text-sm leading-7 text-zinc-400">{event.resumo}</p>
            </div>
          )}
        </div>

        {/* Gerador de editorial */}
        <div className="rounded-xl border border-[#1e1e20] bg-[#111113] p-5 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#BFFF3C]/60">Editorial @danuzioneto</p>
              <p className="mt-1 text-xs text-zinc-500">
                Gera HEADLINE + LEGENDA prontos para Instagram e X.
              </p>
            </div>

            <button
              onClick={() => gerarEditorial()}
              disabled={gerando}
              className="shrink-0 rounded-lg border border-[#BFFF3C]/30 bg-[#BFFF3C]/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[#BFFF3C] transition-colors hover:bg-[#BFFF3C]/20 disabled:cursor-wait disabled:opacity-50"
            >
              {gerando ? 'Gerando...' : editorial ? 'Gerar novamente' : 'Gerar editorial'}
            </button>
          </div>

          <AnimatePresence>
            {gerando && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                <div className="animate-pulse space-y-2">
                  <div className="h-4 w-1/2 rounded bg-zinc-800" />
                  <div className="h-4 w-full rounded bg-zinc-800" />
                  <div className="h-4 w-3/4 rounded bg-zinc-800" />
                </div>
              </motion.div>
            )}

            {!gerando && erroEditorial && (
              <motion.p
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-red-400"
              >
                Erro ao gerar editorial. Verifique a configuração da API de IA e tente novamente.
              </motion.p>
            )}

            {!gerando && editorial && (
              <motion.div
                key="editorial"
                initial={prefersReduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="space-y-5"
              >
                {/* HEADLINE */}
                <div className="space-y-2">
                  <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">Headline</p>
                  <div className="rounded-lg border border-white/5 bg-white/2 p-4">
                    <p className="text-base font-semibold leading-snug text-white">{editorial.headline}</p>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(editorial.headline)}
                    className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600 transition-colors hover:text-zinc-400"
                  >
                    Copiar headline
                  </button>
                </div>

                {/* LEGENDA */}
                <div className="space-y-2">
                  <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">Legenda</p>
                  <div className="rounded-lg border border-white/5 bg-white/2 p-4">
                    <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">{editorial.legenda}</p>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(editorial.legenda)}
                    className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600 transition-colors hover:text-zinc-400"
                  >
                    Copiar legenda
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Links originais */}
        {event.fonte_url && (
          <div className="space-y-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">Fontes originais</p>
            <a
              href={event.fonte_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl border border-[#1e1e20] bg-[#111113] p-4 text-sm text-zinc-400 transition-colors hover:border-[#BFFF3C]/20 hover:text-white"
            >
              <ExternalLinkIcon className="shrink-0 text-zinc-600" />
              <span className="truncate">{event.fonte_url}</span>
              <span className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                {event.fonte}
              </span>
            </a>
          </div>
        )}
      </motion.div>
    </section>
  )
}
