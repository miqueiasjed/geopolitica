import { Link } from 'react-router-dom'
import type { TipoConteudo } from '../../types/biblioteca'

interface PlanGateProps {
  tipo?: TipoConteudo
}

const subtituloMap: Record<TipoConteudo, string> = {
  briefing: 'Este briefing está disponível a partir do plano Essencial.',
  mapa: 'Este mapa estratégico está disponível a partir do plano Pro.',
  tese: 'Esta tese de investimento está disponível exclusivamente no plano Reservado.',
}

const subtituloPadrao = 'Este conteúdo está disponível em um plano superior.'

function LockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-zinc-500"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

export function PlanGate({ tipo }: PlanGateProps) {
  const subtitulo = tipo ? subtituloMap[tipo] : subtituloPadrao

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 px-8 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800/60">
        <LockIcon />
      </div>

      <h3 className="mb-2 text-base font-semibold text-white">
        Conteúdo exclusivo
      </h3>

      <p className="mb-6 max-w-xs text-sm leading-6 text-zinc-400">
        {subtitulo}
      </p>

      <Link
        to="/planos"
        className="inline-flex items-center rounded-lg bg-[#BFFF3C] px-5 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-[#D7FF69]"
      >
        Fazer upgrade
      </Link>
    </div>
  )
}
