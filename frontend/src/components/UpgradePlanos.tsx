import { usePlanosAtivos, planosComRecurso, type PlanoPublico } from '../hooks/usePlanosAtivos'

const COR_PLANO: Record<string, { label: string; botao: string; anel: string }> = {
  essencial: {
    label: 'text-amber-300',
    botao: 'bg-amber-500 hover:bg-amber-400 text-zinc-900',
    anel: 'border-amber-500/40 bg-amber-500/[0.06]',
  },
  pro: {
    label: 'text-cyan-300',
    botao: 'bg-cyan-500 hover:bg-cyan-400 text-zinc-900',
    anel: 'border-cyan-500/40 bg-cyan-500/[0.06]',
  },
  reservado: {
    label: 'text-purple-300',
    botao: 'bg-purple-500 hover:bg-purple-400 text-white',
    anel: 'border-purple-500/40 bg-purple-500/[0.06]',
  },
}

const COR_PADRAO = {
  label: 'text-[#BFFF3C]',
  botao: 'bg-[#BFFF3C] hover:opacity-90 text-zinc-900',
  anel: 'border-[#BFFF3C]/30 bg-[#BFFF3C]/[0.06]',
}

interface UpgradePlanosProps {
  titulo?: string
  descricao?: string
  recurso?: string
}

export function UpgradePlanos({ titulo, descricao, recurso }: UpgradePlanosProps) {
  const { data: planos, isLoading } = usePlanosAtivos()

  if (isLoading) return null

  const planosParaUpgrade = (planos ?? []).filter((p) => p.exibir_no_upgrade)

  const planosExibidos = recurso
    ? planosComRecurso(planosParaUpgrade, recurso)
    : planosParaUpgrade

  const gridClass =
    planosExibidos.length === 1
      ? 'max-w-xs'
      : planosExibidos.length === 2
        ? 'grid-cols-2 max-w-md'
        : 'grid-cols-1 sm:grid-cols-3'

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
        <div className="space-y-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[#BFFF3C]/60">
            acesso exclusivo
          </p>
          <h2 className="font-serif text-3xl font-bold text-white">
            {titulo ?? 'Faça upgrade do seu plano'}
          </h2>
          {descricao && (
            <p className="mx-auto max-w-md text-sm leading-6 text-zinc-400">{descricao}</p>
          )}
        </div>

        {planosExibidos.length > 0 ? (
          <div className={`grid w-full gap-4 ${gridClass}`}>
            {planosExibidos.map((plano) => (
              <CartaoPlano key={plano.slug} plano={plano} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            Nenhum plano disponível no momento. Entre em contato com o suporte.
          </p>
        )}
      </div>
    </div>
  )
}

function CartaoPlano({ plano }: { plano: PlanoPublico }) {
  const cor = COR_PLANO[plano.slug] ?? COR_PADRAO
  const preco = plano.preco ? formatarPreco(plano.preco) : null

  return (
    <div className={`flex flex-col gap-5 rounded-xl border px-6 py-6 text-left ${cor.anel}`}>
      <div className="space-y-1">
        <p className={`font-mono text-xs uppercase tracking-[0.22em] ${cor.label}`}>
          {plano.nome}
        </p>
        {preco && (
          <p className="text-2xl font-bold text-white">{preco}</p>
        )}
        {plano.descricao && (
          <p className="text-xs leading-5 text-zinc-500">{plano.descricao}</p>
        )}
      </div>

      {plano.lastlink_url ? (
        <a
          href={plano.lastlink_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity ${cor.botao}`}
        >
          Assinar plano
        </a>
      ) : (
        <button
          disabled
          className="inline-flex cursor-not-allowed items-center justify-center rounded-lg bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-500"
        >
          Em breve
        </button>
      )}
    </div>
  )
}

function formatarPreco(preco: string): string {
  const n = parseFloat(preco)
  if (isNaN(n) || n === 0) return ''
  return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/ano`
}
