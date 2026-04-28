import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useConteudo } from '../../hooks/useConteudo'
import { ContentReader } from '../../components/biblioteca/ContentReader'
import { PlanGate } from '../../components/biblioteca/PlanGate'
import { ExportPdfButton } from '../../components/ExportPdfButton'

function SkeletonLeitura() {
  return (
    <div className="animate-pulse max-w-3xl mx-auto px-4">
      {/* Breadcrumb */}
      <div className="mb-8 h-4 w-32 rounded bg-zinc-800" />
      {/* Título */}
      <div className="mb-8 space-y-3">
        <div className="h-8 w-3/4 rounded bg-zinc-800" />
        <div className="h-8 w-1/2 rounded bg-zinc-800" />
      </div>
      {/* Linhas de texto */}
      <div className="space-y-3">
        <div className="h-4 w-full rounded bg-zinc-800" />
        <div className="h-4 w-full rounded bg-zinc-800" />
        <div className="h-4 w-5/6 rounded bg-zinc-800" />
        <div className="h-4 w-full rounded bg-zinc-800" />
        <div className="h-4 w-4/6 rounded bg-zinc-800" />
      </div>
    </div>
  )
}

function BotaoVoltar({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
      Voltar
    </button>
  )
}

export function ConteudoLeitura() {
  const prefersReducedMotion = useReducedMotion()
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const { conteudo, isLoading, isError, isPlanGate } = useConteudo(slug!)

  function handleVoltar() {
    navigate('/dashboard/biblioteca')
  }

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <nav aria-label="Navegação" className="flex items-center gap-2 text-sm text-zinc-500">
          <Link
            to="/dashboard/biblioteca"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-zinc-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Biblioteca
          </Link>
          {conteudo?.titulo && (
            <>
              <span aria-hidden="true">/</span>
              <span className="max-w-xs truncate text-zinc-400">{conteudo.titulo}</span>
            </>
          )}
        </nav>
        {conteudo && (
          <ExportPdfButton tipo="briefing" id={String(conteudo.id)} label="Exportar PDF" />
        )}
      </div>

      {/* Conteúdo principal */}
      {isLoading ? (
        <SkeletonLeitura />
      ) : isError ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-sm text-zinc-400">
            Não foi possível carregar este conteúdo. Tente novamente mais tarde.
          </p>
          <BotaoVoltar onClick={handleVoltar} />
        </div>
      ) : isPlanGate ? (
        <div className="space-y-4">
          <BotaoVoltar onClick={handleVoltar} />
          <PlanGate tipo={conteudo?.tipo} />
        </div>
      ) : conteudo ? (
        <ContentReader corpo={conteudo.corpo} titulo={conteudo.titulo} />
      ) : null}
    </motion.div>
  )
}
