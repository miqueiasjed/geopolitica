import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useMeusPaises } from '../hooks/useMeusPaises'
import { BuscaPais } from '../components/paises/BuscaPais'
import { CardPais } from '../components/paises/CardPais'
import { EmptyState } from '../components/EmptyState'

const LIMITE_PLANO: Record<string, number> = {
  essencial: 3,
  pro: 10,
  reservado: 10,
  admin: 10,
}

const LIMITE_PADRAO = 3

function obterLimitePlano(plano: string | null | undefined, role: string | null | undefined): number {
  if (role === 'admin') return LIMITE_PLANO.admin
  if (!plano) return LIMITE_PADRAO
  return LIMITE_PLANO[plano.toLowerCase()] ?? LIMITE_PADRAO
}

function obterNomePlano(plano: string | null | undefined, role: string | null | undefined): string {
  if (role === 'admin') return 'admin'
  return plano ?? 'essencial'
}

export function MeusPaisesPage() {
  const { user } = useAuth()
  const { data: paises, isLoading, adicionarPais, removerPais, isAdicionando } = useMeusPaises()

  const [codigoSelecionado, setCodigoSelecionado] = useState<string | null>(null)
  const [removendoSet, setRemovendoSet] = useState<Set<string>>(new Set())
  const [toastErro, setToastErro] = useState<string | null>(null)
  const [toastSucesso, setToastSucesso] = useState<string | null>(null)

  const plano = user?.assinante?.plano
  const role = user?.role
  const limite = obterLimitePlano(plano, role)
  const nomePlano = obterNomePlano(plano, role)

  function exibirToastErro(mensagem: string) {
    setToastErro(mensagem)
    window.setTimeout(() => setToastErro(null), 4000)
  }

  function exibirToastSucesso(mensagem: string) {
    setToastSucesso(mensagem)
    window.setTimeout(() => setToastSucesso(null), 3000)
  }

  function handleSelecionar(codigoPais: string) {
    setCodigoSelecionado(codigoPais)
  }

  function handleAdicionar() {
    if (!codigoSelecionado) return

    adicionarPais(codigoSelecionado, {
      onSuccess: () => {
        exibirToastSucesso('País adicionado com sucesso!')
        setCodigoSelecionado(null)
      },
      onError: (erro: unknown) => {
        const axiosErro = erro as { response?: { status?: number; data?: { message?: string } } }
        if (axiosErro?.response?.status === 422) {
          const mensagemApi = axiosErro.response.data?.message
          exibirToastErro(
            mensagemApi ??
              `Limite de ${limite.toString()} países atingido para o plano ${nomePlano}. Faça upgrade para adicionar mais.`,
          )
        } else {
          exibirToastErro('Não foi possível adicionar o país. Tente novamente.')
        }
        setCodigoSelecionado(null)
      },
    })
  }

  function handleRemover(codigoPais: string) {
    setRemovendoSet((prev) => new Set(prev).add(codigoPais))

    removerPais(codigoPais, {
      onSuccess: () => {
        setRemovendoSet((prev) => {
          const novo = new Set(prev)
          novo.delete(codigoPais)
          return novo
        })
      },
      onError: () => {
        setRemovendoSet((prev) => {
          const novo = new Set(prev)
          novo.delete(codigoPais)
          return novo
        })
        exibirToastErro('Não foi possível remover o país. Tente novamente.')
      },
    })
  }

  return (
    <section className="space-y-8">
      {/* Cabeçalho */}
      <div className="space-y-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[#BFFF3C]/70">acompanhamento</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Meus Países</h1>
            <p className="max-w-xl text-sm leading-6 text-zinc-400">
              Acompanhe os países que você selecionou e receba análises e eventos geopolíticos relevantes.
            </p>
          </div>

          {/* Badge contador */}
          <div className="flex-shrink-0">
            <span className="inline-flex items-center rounded-full border border-[#BFFF3C]/20 bg-[#BFFF3C]/8 px-4 py-2 font-mono text-sm text-[#BFFF3C]">
              {isLoading ? (
                <span className="inline-block h-4 w-16 animate-pulse rounded bg-[#BFFF3C]/20" />
              ) : (
                <>
                  {paises.length} / {limite} países
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Seção de busca */}
      <div className="rounded-2xl border border-[#1e1e20] bg-[#111113] p-5">
        <p className="mb-4 text-sm font-medium text-zinc-300">Adicionar país</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <BuscaPais onSelect={handleSelecionar} />

          {codigoSelecionado && (
            <span className="rounded-full border border-[#BFFF3C]/30 bg-[#BFFF3C]/10 px-3 py-1 font-mono text-xs text-[#BFFF3C]">
              {codigoSelecionado} selecionado
            </span>
          )}

          <button
            type="button"
            disabled={!codigoSelecionado || isAdicionando}
            onClick={handleAdicionar}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#BFFF3C] px-4 py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-[#D7FF69] disabled:cursor-not-allowed disabled:opacity-40 sm:flex-shrink-0"
          >
            {isAdicionando ? (
              <>
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
                Adicionando...
              </>
            ) : (
              'Adicionar'
            )}
          </button>
        </div>
      </div>

      {/* Toasts */}
      <AnimatePresence>
        {toastErro && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {toastErro}
          </div>
        )}
        {toastSucesso && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300"
          >
            {toastSucesso}
          </div>
        )}
      </AnimatePresence>

      {/* Lista de países */}
      <div>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-2xl border border-[#1e1e20] bg-[#111113]"
                aria-hidden="true"
              />
            ))}
          </div>
        ) : paises.length === 0 ? (
          <EmptyState message="Você ainda não segue nenhum país. Use a busca acima para começar." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {paises.map((paisUsuario) => (
                <CardPais
                  key={paisUsuario.codigo_pais}
                  paisUsuario={paisUsuario}
                  isRemovendo={removendoSet.has(paisUsuario.codigo_pais)}
                  onRemover={handleRemover}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  )
}
