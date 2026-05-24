import { useProdutos, resolveLinkCta, resolveLabelCta } from '../hooks/useProdutos'

interface AddonGateProps {
  chave: string
  children?: React.ReactNode
}

function parseBeneficios(descricao: string): string[] {
  const partes = descricao.split(/\.\s+/).filter(Boolean).slice(0, 4)
  return partes.length >= 2 ? partes.map((s) => s.replace(/\.$/, '').trim()) : []
}

function calcularMensal(precoLabel: string): string | null {
  const match = precoLabel.match(/[\d.,]+/)
  if (!match) return null
  const valor = parseFloat(match[0].replace('.', '').replace(',', '.'))
  if (isNaN(valor) || valor === 0) return null
  const mensal = valor / 12
  return `R$ ${mensal.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mês`
}

export function AddonGate({ chave, children }: AddonGateProps) {
  const { data: produtos, isLoading } = useProdutos()

  if (isLoading) return null

  const produto = produtos?.find((p) => p.chave === chave)

  if (!produto) return <>{children ?? null}</>
  if (produto.status_usuario === 'ativo') return <>{children ?? null}</>

  const ctaLink = resolveLinkCta(produto)
  const ctaLabel =
    produto.status_usuario === null ? 'Adicionar acesso' : resolveLabelCta(produto.status_usuario)
  const desabilitado = ctaLink === null

  const beneficios = produto.descricao ? parseBeneficios(produto.descricao) : []
  const mensal = produto.preco_label ? calcularMensal(produto.preco_label) : null

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        {/* Linha de destaque no topo */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#BFFF3C]/50 to-transparent" />
        {/* Glow de fundo */}
        <div className="absolute -top-16 left-1/2 h-32 w-56 -translate-x-1/2 rounded-full bg-[#BFFF3C]/6 blur-3xl" />

        <div className="relative flex flex-col items-center gap-7 px-8 py-12 text-center">
          {/* Ícone de cadeado */}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#BFFF3C]/25 bg-[#BFFF3C]/8 shadow-lg shadow-[#BFFF3C]/5">
            <svg
              width="26"
              height="26"
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

          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#BFFF3C]/60">
              acesso exclusivo
            </p>
            {produto.nome && (
              <h2 className="font-serif text-2xl font-bold leading-tight text-white">
                {produto.nome}
              </h2>
            )}
          </div>

          {/* Descrição em bullets ou parágrafo */}
          {beneficios.length >= 2 ? (
            <ul className="w-full space-y-3 text-left">
              {beneficios.map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <svg
                    className="mt-0.5 shrink-0 text-[#BFFF3C]"
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
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-sm leading-5 text-zinc-300">{b}</span>
                </li>
              ))}
            </ul>
          ) : produto.descricao ? (
            <p className="text-sm leading-6 text-zinc-400">{produto.descricao}</p>
          ) : null}

          {/* Preço */}
          {produto.preco_label && (
            <div className="w-full rounded-xl border border-[#BFFF3C]/20 bg-zinc-800/60 px-6 py-5">
              <p className="text-[11px] uppercase tracking-widest text-zinc-500">Acesso anual</p>
              <p className="mt-1 text-3xl font-bold text-[#BFFF3C]">{produto.preco_label}</p>
              {mensal && (
                <p className="mt-1 text-xs text-zinc-500">equivalente a {mensal}</p>
              )}
            </div>
          )}

          {/* CTA */}
          {desabilitado ? (
            <button
              disabled
              className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-[#BFFF3C] px-6 py-3.5 text-sm font-semibold text-zinc-900 opacity-40"
            >
              Entre em contato
            </button>
          ) : (
            <a
              href={ctaLink!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#BFFF3C] px-6 py-3.5 text-sm font-semibold text-zinc-900 shadow-lg shadow-[#BFFF3C]/20 transition-all hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BFFF3C]"
            >
              {ctaLabel}
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
          )}
        </div>
      </div>
    </div>
  )
}
