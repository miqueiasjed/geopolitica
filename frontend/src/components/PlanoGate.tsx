import { useAuth } from '../hooks/useAuth'
import { usePlanosAtivos } from '../hooks/usePlanosAtivos'

const CORES_PLANO: Record<string, string> = {
  essencial: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  pro:       'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  reservado: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
}

interface PlanoGateProps {
  children: React.ReactNode
}

export function PlanoGate({ children }: PlanoGateProps) {
  const { user, isLoading } = useAuth()
  const { data: planos, isLoading: isLoadingPlanos } = usePlanosAtivos()

  if (isLoading || isLoadingPlanos) return null

  const plano = user?.assinante?.plano
  const planoReal = plano && planos?.some((p) => p.slug === plano)

  if (planoReal) {
    return <>{children}</>
  }

  const planosExibidos = planos ?? []

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
          {planosExibidos.length > 0
            ? planosExibidos.map((p) => (
                <span
                  key={p.slug}
                  className={`rounded-full border px-4 py-1.5 text-xs font-medium ${CORES_PLANO[p.slug] ?? 'border-zinc-600/30 bg-zinc-700/10 text-zinc-300'}`}
                >
                  {p.nome}
                </span>
              ))
            : (
              <>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-medium text-amber-300">Essencial</span>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-medium text-cyan-300">Pro</span>
                <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-medium text-purple-300">Reservado</span>
              </>
            )}
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
