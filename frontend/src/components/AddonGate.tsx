const ADDON_INFO = {
  elections: {
    titulo: 'Monitor Eleitoral',
    descricao:
      'Acompanhe eleições globais que movem mercados. Briefings eleitorais diários + radar visual dos próximos 12 meses.',
    preco: 'R$ 297/ano',
    ctaLabel: 'Adicionar Monitor Eleitoral',
    ctaUrl: import.meta.env.VITE_LASTLINK_ELECTIONS_URL || '#',
    upgradePlano: 'Pro',
  },
  war: {
    titulo: 'Monitor de Guerra',
    descricao:
      'Feed em tempo real de conflitos armados e movimentações militares com impacto em mercados de energia e commodities.',
    preco: 'R$ 497/ano',
    ctaLabel: 'Adicionar Monitor de Guerra',
    ctaUrl: import.meta.env.VITE_LASTLINK_WAR_URL || '#',
    upgradePlano: 'Reservado',
  },
} as const

interface AddonGateProps {
  addonKey: 'elections' | 'war'
}

export function AddonGate({ addonKey }: AddonGateProps) {
  const info = ADDON_INFO[addonKey]

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[#C9B882]/60">
          acesso exclusivo
        </p>

        <h2 className="font-serif text-3xl font-bold text-white">{info.titulo}</h2>

        <p className="text-sm leading-6 text-zinc-400">{info.descricao}</p>

        <div className="w-full rounded-xl border border-[#C9B882]/30 bg-zinc-900/60 px-6 py-5">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Acesso anual</p>
          <p className="mt-1 text-2xl font-bold text-[#C9B882]">{info.preco}</p>
        </div>

        <a
          href={info.ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center rounded-lg bg-[#C9B882] px-6 py-3 text-sm font-semibold text-zinc-900 transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9B882]"
        >
          {info.ctaLabel}
        </a>

        <p className="text-xs text-zinc-500">
          Usuários do plano{' '}
          <span className="font-medium text-zinc-300">{info.upgradePlano}</span> têm acesso incluso
        </p>
      </div>
    </div>
  )
}
