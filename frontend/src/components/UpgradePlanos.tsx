import { usePlanosAtivos, planosComRecurso, type PlanoPublico } from '../hooks/usePlanosAtivos'

const COR_PLANO: Record<
  string,
  { label: string; botao: string; anel: string; glow: string; badge: string }
> = {
  essencial: {
    label: 'text-amber-300',
    botao: 'bg-amber-500 hover:bg-amber-400 text-zinc-900 shadow-amber-500/20',
    anel: 'border-amber-500/30 bg-amber-500/[0.04]',
    glow: 'via-amber-500/25',
    badge: 'bg-amber-500 text-zinc-900',
  },
  pro: {
    label: 'text-cyan-300',
    botao: 'bg-cyan-500 hover:bg-cyan-400 text-zinc-900 shadow-cyan-500/20',
    anel: 'border-cyan-500/40 bg-cyan-500/[0.06]',
    glow: 'via-cyan-500/30',
    badge: 'bg-cyan-500 text-zinc-900',
  },
  reservado: {
    label: 'text-purple-300',
    botao: 'bg-purple-500 hover:bg-purple-400 text-white shadow-purple-500/20',
    anel: 'border-purple-500/30 bg-purple-500/[0.04]',
    glow: 'via-purple-500/25',
    badge: 'bg-purple-500 text-white',
  },
}

const COR_PADRAO = {
  label: 'text-[#BFFF3C]',
  botao: 'bg-[#BFFF3C] hover:brightness-110 text-zinc-900 shadow-[#BFFF3C]/20',
  anel: 'border-[#BFFF3C]/30 bg-[#BFFF3C]/[0.04]',
  glow: 'via-[#BFFF3C]/25',
  badge: 'bg-[#BFFF3C] text-zinc-900',
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
      <div className="flex w-full max-w-3xl flex-col items-center gap-10 text-center">
        {/* Cabeçalho */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#BFFF3C]/25 bg-[#BFFF3C]/8 shadow-lg shadow-[#BFFF3C]/5">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#BFFF3C]"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.32em] text-[#BFFF3C]/60">
              acesso exclusivo
            </p>
            <h2 className="font-serif text-3xl font-bold text-white">
              {titulo ?? 'Escolha o seu plano'}
            </h2>
            {descricao && (
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-400">{descricao}</p>
            )}
          </div>
        </div>

        {/* Cards de planos */}
        {planosExibidos.length > 0 ? (
          <div className={`grid w-full gap-4 ${gridClass}`}>
            {planosExibidos.map((plano) => (
              <CartaoPlano
                key={plano.slug}
                plano={plano}
                destaque={plano.slug === 'pro' || planosExibidos.length === 1}
              />
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

function CartaoPlano({ plano, destaque }: { plano: PlanoPublico; destaque?: boolean }) {
  const cor = COR_PLANO[plano.slug] ?? COR_PADRAO
  const preco = plano.preco ? formatarPreco(plano.preco) : null
  const mensal = plano.preco ? formatarMensal(plano.preco) : null

  return (
    <div
      className={`relative flex flex-col gap-5 rounded-2xl border px-6 py-7 text-left transition-transform hover:-translate-y-1 ${cor.anel}`}
    >
      {/* Linha de gradiente no topo do card */}
      <div
        className={`absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent ${cor.glow} to-transparent`}
      />

      {destaque && (
        <span
          className={`absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest ${cor.badge}`}
        >
          Mais popular
        </span>
      )}

      <div className="space-y-1.5">
        <p className={`font-mono text-xs uppercase tracking-[0.22em] ${cor.label}`}>
          {plano.nome}
        </p>

        {preco ? (
          <div>
            <p className="text-2xl font-bold text-white">{preco}</p>
            {mensal && <p className="text-xs text-zinc-500">{mensal}</p>}
          </div>
        ) : null}

        {plano.descricao && (
          <p className="whitespace-pre-wrap pt-1 text-xs leading-5 text-zinc-400">{plano.descricao}</p>
        )}
      </div>

      {plano.lastlink_url ? (
        <a
          href={plano.lastlink_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg transition-all ${cor.botao}`}
        >
          Assinar agora
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      ) : (
        <button
          disabled
          className="inline-flex cursor-not-allowed items-center justify-center rounded-xl bg-zinc-800 px-4 py-3 text-sm font-semibold text-zinc-500"
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

function formatarMensal(preco: string): string | null {
  const n = parseFloat(preco)
  if (isNaN(n) || n === 0) return null
  const mensal = n / 12
  return `equivalente a R$ ${mensal.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mês`
}
