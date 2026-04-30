import { motion, useReducedMotion } from 'framer-motion'
import type { ConteudoCard, TipoConteudo } from '../../types/biblioteca'

interface BadgeConfig {
  className: string
  label: string
}

const badgeConfig: Record<TipoConteudo, BadgeConfig> = {
  briefing: {
    className:
      'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40',
    label: 'Briefing',
  },
  mapa: {
    className:
      'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/40',
    label: 'Mapa',
  },
  tese: {
    className:
      'bg-[#BFFF3C]/20 text-[#BFFF3C] ring-1 ring-[#BFFF3C]/40',
    label: 'A Tese',
  },
}

function formatarDataPublicacao(iso: string): string {
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return iso
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  })
    .format(data)
    .replace('.', '')
}

interface ContentCardProps {
  conteudo: ConteudoCard
  onClick?: () => void
}

export function ContentCard({ conteudo, onClick }: ContentCardProps) {
  const prefersReducedMotion = useReducedMotion()
  const badge = badgeConfig[conteudo.tipo]

  return (
    <motion.article
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeOut' }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      className="rounded-2xl border border-[#1e1e20] bg-[#111113] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition-colors hover:border-[#BFFF3C]/30 sm:p-5 cursor-pointer"
    >
      {/* Badge de tipo */}
      <div className="mb-3">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      {/* Data e região */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-zinc-500">
          {formatarDataPublicacao(conteudo.publicado_em)}
        </span>
        {conteudo.regiao ? (
          <span className="rounded-full border border-cyan-500/10 bg-cyan-500/5 px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.16em] text-cyan-100/75">
            {conteudo.regiao}
          </span>
        ) : null}
      </div>

      {/* Título */}
      <h2 className="mb-1 text-base font-semibold leading-snug text-white">
        {conteudo.titulo}
      </h2>

      {/* Manchete da tese */}
      {conteudo.tipo === 'tese' && conteudo.tese_manchete ? (
        <p className="mb-2 text-sm italic text-[#BFFF3C]">
          {conteudo.tese_manchete}
        </p>
      ) : null}

      {/* Resumo */}
      <p className="line-clamp-3 text-sm leading-6 text-zinc-400">
        {conteudo.resumo}
      </p>

      {/* Tags */}
      {conteudo.tags && conteudo.tags.length > 0 ? (
        <footer className="mt-4 flex flex-wrap gap-2">
          {conteudo.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[#BFFF3C]/20 bg-[#BFFF3C]/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[#BFFF3C]"
            >
              {tag}
            </span>
          ))}
        </footer>
      ) : null}
    </motion.article>
  )
}
