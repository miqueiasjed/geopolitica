import { useNavigate, useParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeftIcon, GlobeIcon } from '@radix-ui/react-icons'
import { usePerfilPais } from '../hooks/usePerfilPais'
import { useEventosPais } from '../hooks/useEventosPais'
import { useMeusPaises } from '../hooks/useMeusPaises'
import { ExportPdfButton } from '../components/ExportPdfButton'

function formatDataRelativa(dataIso: string): string {
  const agora = new Date()
  const data = new Date(dataIso)
  const diffMs = agora.getTime() - data.getTime()
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDias === 0) return 'hoje'
  if (diffDias === 1) return 'há 1 dia'
  if (diffDias < 30) return `há ${diffDias.toString()} dias`
  const diffMeses = Math.floor(diffDias / 30)
  if (diffMeses === 1) return 'há 1 mês'
  return `há ${diffMeses.toString()} meses`
}

function corNivelTensao(nivel: string): string {
  switch (nivel.toUpperCase()) {
    case 'CRÍTICO':
    case 'CRITICO':
      return 'border-red-500/30 bg-red-500/10 text-red-400'
    case 'ALTO':
      return 'border-orange-500/30 bg-orange-500/10 text-orange-400'
    case 'MÉDIO':
    case 'MEDIO':
      return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
    case 'MONITORAR':
      return 'border-green-500/30 bg-green-500/10 text-green-400'
    default:
      return 'border-zinc-500/30 bg-zinc-500/10 text-zinc-400'
  }
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-[#1e1e20] ${className ?? ''}`}
      aria-hidden="true"
    />
  )
}

export function PerfilPaisPage() {
  const { codigo } = useParams<{ codigo: string }>()
  const navigate = useNavigate()
  const prefersReduced = useReducedMotion()

  const codigoPais = codigo ?? ''

  const { perfil, isLoading: isLoadingPerfil } = usePerfilPais(codigoPais)
  const { eventos, isLoading: isLoadingEventos } = useEventosPais(codigoPais)
  const {
    data: meusPaises,
    adicionarPais,
    removerPais,
    isAdicionando,
    isRemovendo,
  } = useMeusPaises()

  const jaAcompanha = meusPaises.some((p) => p.codigo_pais === codigoPais)
  const isPendente = isAdicionando || isRemovendo

  function handleToggleAcompanhar() {
    if (jaAcompanha) {
      removerPais(codigoPais)
    } else {
      adicionarPais(codigoPais)
    }
  }

  if (isLoadingPerfil) {
    return (
      <section className="mx-auto max-w-3xl space-y-8 py-8">
        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-8 w-8 rounded-full" />
          <SkeletonBlock className="h-4 w-24" />
        </div>
        <div className="space-y-4 rounded-2xl border border-[#1e1e20] bg-[#111113] p-6">
          <div className="flex items-start gap-4">
            <SkeletonBlock className="h-14 w-14 rounded-xl" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-7 w-48" />
              <SkeletonBlock className="h-4 w-32" />
            </div>
            <SkeletonBlock className="h-9 w-36 rounded-full" />
          </div>
        </div>
        <div className="space-y-3 rounded-2xl border border-[#1e1e20] bg-[#111113] p-6">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-5/6" />
          <SkeletonBlock className="h-4 w-4/6" />
        </div>
        <div className="space-y-3 rounded-2xl border border-[#1e1e20] bg-[#111113] p-6">
          <SkeletonBlock className="h-5 w-36" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-5/6" />
        </div>
      </section>
    )
  }

  if (!perfil) {
    return (
      <section className="mx-auto max-w-3xl py-16 text-center">
        <p className="text-zinc-400">Perfil do país não encontrado.</p>
        <button
          type="button"
          onClick={() => navigate('/paises')}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#1e1e20] px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-zinc-400 transition-colors hover:border-[#BFFF3C]/30 hover:text-[#BFFF3C]"
        >
          <ArrowLeftIcon />
          Voltar
        </button>
      </section>
    )
  }

  const indicadoresRelevantes = Array.isArray(perfil.indicadores_relevantes)
    ? perfil.indicadores_relevantes
    : []

  return (
    <motion.section
      className="mx-auto max-w-3xl space-y-6 py-6"
      initial={prefersReduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReduced ? 0 : 0.3, ease: 'easeOut' }}
    >
      {/* Botão Voltar */}
      <button
        type="button"
        onClick={() => navigate('/paises')}
        className="inline-flex items-center gap-2 rounded-full border border-[#1e1e20] px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-zinc-400 transition-colors hover:border-[#BFFF3C]/30 hover:text-[#BFFF3C]"
      >
        <ArrowLeftIcon />
        Voltar
      </button>

      {/* Seção 1 — Header */}
      <div className="rounded-2xl border border-[#1e1e20] bg-[#111113] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            {perfil.bandeira_emoji ? (
              <span className="text-5xl leading-none" aria-hidden="true">
                {perfil.bandeira_emoji}
              </span>
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#1e1e20]">
                <GlobeIcon className="h-7 w-7 text-zinc-500" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-semibold text-white sm:text-3xl">{perfil.nome_pt}</h1>
              <p className="mt-1 font-mono text-xs uppercase tracking-[0.18em] text-[#BFFF3C]/70">
                {perfil.regiao_geopolitica}
              </p>
            </div>
          </div>

          <div className="flex flex-shrink-0 flex-col items-end gap-2">
            <button
              type="button"
              disabled={isPendente}
              onClick={handleToggleAcompanhar}
              className={`inline-flex flex-shrink-0 items-center gap-2 rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                jaAcompanha
                  ? 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                  : 'border-[#BFFF3C]/30 bg-[#BFFF3C]/10 text-[#BFFF3C] hover:bg-[#BFFF3C]/20'
              }`}
            >
              {isPendente ? (
                <>
                  <svg
                    className="h-3 w-3 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Aguarde...
                </>
              ) : jaAcompanha ? (
                'Parar de acompanhar'
              ) : (
                'Acompanhar'
              )}
            </button>
            <ExportPdfButton tipo="pais" id={perfil.codigo_pais} label="Exportar perfil" />
          </div>
        </div>
      </div>

      {/* Seção 2 — Contexto Geopolítico */}
      <div className="rounded-2xl border border-[#1e1e20] bg-[#111113] p-6">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.32em] text-[#BFFF3C]/70">
          contexto geopolítico
        </p>
        {perfil.contexto_geopolitico ? (
          <p className="text-sm leading-7 text-zinc-300 whitespace-pre-wrap">{perfil.contexto_geopolitico}</p>
        ) : (
          <div className="space-y-3">
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-5/6" />
            <SkeletonBlock className="h-4 w-4/6" />
            <p className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-zinc-600">
              Análise sendo gerada...
            </p>
          </div>
        )}
      </div>

      {/* Seção 3 — Liderança Atual */}
      <div className="rounded-2xl border border-[#1e1e20] bg-[#111113] p-6">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.32em] text-[#BFFF3C]/70">
          liderança atual
        </p>
        {perfil.analise_lideranca ? (
          <p className="text-sm leading-7 text-zinc-300 whitespace-pre-wrap">{perfil.analise_lideranca}</p>
        ) : (
          <div className="space-y-3">
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-5/6" />
            <p className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-zinc-600">
              Análise sendo gerada...
            </p>
          </div>
        )}
      </div>

      {/* Seção 4 — Indicadores Econômicos (ocultar se vazio) */}
      {indicadoresRelevantes.length > 0 && (
        <div className="rounded-2xl border border-[#1e1e20] bg-[#111113] p-6">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.32em] text-[#BFFF3C]/70">
            indicadores econômicos
          </p>
          <div className="flex flex-wrap gap-2">
            {indicadoresRelevantes.map((indicador) => (
              <span
                key={indicador}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#BFFF3C]/20 bg-[#BFFF3C]/8 px-3 py-1.5 font-mono text-xs text-[#BFFF3C]"
              >
                <svg
                  className="h-3 w-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
                {indicador}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Seção 5 — Eventos Recentes */}
      <div className="rounded-2xl border border-[#1e1e20] bg-[#111113] p-6">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.32em] text-[#BFFF3C]/70">
          eventos recentes
        </p>

        {isLoadingEventos ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <SkeletonBlock className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : eventos.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhum evento recente encontrado.</p>
        ) : (
          <ul className="space-y-3">
            {eventos.map((evento) => {
              const nivelTensao = evento.impact_label ?? 'MONITORAR'

              return (
                <li
                  key={evento.id}
                  className="flex flex-col gap-1.5 rounded-xl border border-[#1e1e20] bg-[#0a0a0b] p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-zinc-200">{evento.titulo}</p>
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                      {formatDataRelativa(evento.created_at)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex flex-shrink-0 items-center rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${corNivelTensao(nivelTensao)}`}
                  >
                    {nivelTensao}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </motion.section>
  )
}
