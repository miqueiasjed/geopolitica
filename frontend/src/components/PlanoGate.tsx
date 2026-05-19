import { useAuth } from '../hooks/useAuth'

const PLANOS_REAIS = ['essencial', 'pro', 'reservado']

interface PlanoGateProps {
  children: React.ReactNode
}

export function PlanoGate({ children }: PlanoGateProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) return null

  const plano = user?.assinante?.plano

  if (plano && PLANOS_REAIS.includes(plano)) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[#C9B882]/60">
          recurso exclusivo
        </p>

        <h2 className="font-serif text-3xl font-bold text-white">
          Disponível nos planos
        </h2>

        <div className="flex flex-wrap justify-center gap-2">
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-medium text-amber-300">
            Essencial
          </span>
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-medium text-cyan-300">
            Pro
          </span>
          <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-medium text-purple-300">
            Reservado
          </span>
        </div>

        <p className="text-sm leading-6 text-zinc-400">
          Assine um dos planos acima para ter acesso completo à plataforma de inteligência geopolítica.
        </p>

        <a
          href="mailto:contato@geopoliticaparainvestidores.com.br"
          className="inline-flex w-full items-center justify-center rounded-lg bg-[#C9B882] px-6 py-3 text-sm font-semibold text-zinc-900 transition-opacity hover:opacity-90"
        >
          Falar com o time
        </a>
      </div>
    </div>
  )
}
