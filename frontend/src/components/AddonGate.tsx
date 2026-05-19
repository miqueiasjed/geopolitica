import { useProdutos, resolveLinkCta, resolveLabelCta } from '../hooks/useProdutos'

interface AddonGateProps {
  chave: string
  children?: React.ReactNode
}

export function AddonGate({ chave, children }: AddonGateProps) {
  const { data: produtos, isLoading } = useProdutos()

  // Evitar flash de conteúdo durante o carregamento
  if (isLoading) return null

  const produto = produtos?.find((p) => p.chave === chave)

  // Produto não encontrado (chave inválida) → renderizar children ou null
  if (!produto) return <>{children ?? null}</>

  // Usuário com acesso ativo → renderizar children ou null
  if (produto.status_usuario === 'ativo') return <>{children ?? null}</>

  // Determinar CTA
  const ctaLink = resolveLinkCta(produto)
  const ctaLabel = produto.status_usuario === null
    ? 'Adicionar'
    : resolveLabelCta(produto.status_usuario)
  const desabilitado = ctaLink === null

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[#BFFF3C]/60">
          acesso exclusivo
        </p>

        {produto.nome && (
          <h2 className="font-serif text-3xl font-bold text-white">{produto.nome}</h2>
        )}

        {produto.descricao && (
          <p className="text-sm leading-6 text-zinc-400">{produto.descricao}</p>
        )}

        {produto.preco_label && (
          <div className="w-full rounded-xl border border-[#BFFF3C]/30 bg-zinc-900/60 px-6 py-5">
            <p className="text-xs uppercase tracking-widest text-zinc-500">Acesso anual</p>
            <p className="mt-1 text-2xl font-bold text-[#BFFF3C]">{produto.preco_label}</p>
          </div>
        )}

        {desabilitado ? (
          <button
            disabled
            className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-lg bg-[#BFFF3C] px-6 py-3 text-sm font-semibold text-zinc-900 opacity-40"
          >
            Entre em contato
          </button>
        ) : (
          <a
            href={ctaLink!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center rounded-lg bg-[#BFFF3C] px-6 py-3 text-sm font-semibold text-zinc-900 transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BFFF3C]"
          >
            {ctaLabel}
          </a>
        )}
      </div>
    </div>
  )
}
