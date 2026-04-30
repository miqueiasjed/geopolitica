import { TrashIcon } from '@radix-ui/react-icons'
import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { PaisUsuario } from '../../types/pais'

interface CardPaisProps {
  paisUsuario: PaisUsuario
  isRemovendo: boolean
  onRemover: (codigoPais: string) => void
}

function formatarData(valor: string): string {
  const data = new Date(valor)

  if (Number.isNaN(data.getTime())) {
    return valor
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(data)
}

export function CardPais({ paisUsuario, isRemovendo, onRemover }: CardPaisProps) {
  const prefersReducedMotion = useReducedMotion()
  const { perfil, adicionado_em, codigo_pais } = paisUsuario
  const dataFormatada = formatarData(adicionado_em)

  return (
    <motion.article
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0, y: -4 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: 'easeOut' }}
      className="group flex flex-col gap-4 rounded-2xl border border-[#1e1e20] bg-[#111113] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition-colors hover:border-[#BFFF3C]/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden="true">
            {perfil.bandeira_emoji ?? '🌐'}
          </span>
          <div>
            <h3 className="font-semibold text-white">{perfil.nome_pt}</h3>
            <p className="text-xs text-zinc-500">{perfil.regiao_geopolitica}</p>
          </div>
        </div>

        <button
          type="button"
          aria-label={`Remover ${perfil.nome_pt} da lista`}
          disabled={isRemovendo}
          onClick={() => onRemover(codigo_pais)}
          className="rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isRemovendo ? (
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <TrashIcon className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center rounded-full border border-white/8 bg-white/4 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500">
          desde {dataFormatada}
        </span>

        <Link
          to={`/paises/${codigo_pais}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#BFFF3C]/20 bg-[#BFFF3C]/8 px-3 py-1.5 text-xs font-medium text-[#BFFF3C] transition-colors hover:border-[#BFFF3C]/40 hover:bg-[#BFFF3C]/15"
        >
          Acompanhar
        </Link>
      </div>
    </motion.article>
  )
}
