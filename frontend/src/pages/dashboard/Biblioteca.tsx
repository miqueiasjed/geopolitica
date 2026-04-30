import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useBiblioteca } from '../../hooks/useBiblioteca'
import { ContentCard } from '../../components/biblioteca/ContentCard'
import { SearchBar } from '../../components/biblioteca/SearchBar'
import { FilterBar } from '../../components/biblioteca/FilterBar'
import type { BibliotecaFiltros } from '../../types/biblioteca'

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-[#1e1e20] bg-[#111113] p-5">
      <div className="mb-3 h-5 w-16 rounded-full bg-zinc-800" />
      <div className="mb-3 flex gap-2">
        <div className="h-4 w-24 rounded bg-zinc-800" />
        <div className="h-4 w-16 rounded-full bg-zinc-800" />
      </div>
      <div className="mb-1 h-5 w-3/4 rounded bg-zinc-800" />
      <div className="space-y-2 mt-2">
        <div className="h-4 w-full rounded bg-zinc-800" />
        <div className="h-4 w-5/6 rounded bg-zinc-800" />
        <div className="h-4 w-4/6 rounded bg-zinc-800" />
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex justify-center py-6" aria-label="Carregando mais conteúdos">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-[#BFFF3C]" />
    </div>
  )
}

export function Biblioteca() {
  const prefersReducedMotion = useReducedMotion()
  const navigate = useNavigate()
  const [filtros, setFiltros] = useState<BibliotecaFiltros>({})
  const sentinelaRef = useRef<HTMLDivElement | null>(null)

  const {
    conteudos,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useBiblioteca(filtros)

  useEffect(() => {
    const sentinela = sentinelaRef.current
    if (!sentinela) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage()
        }
      },
      { rootMargin: '200px' },
    )

    observer.observe(sentinela)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  function handleSearchChange(valor: string) {
    setFiltros((f) => ({ ...f, q: valor || undefined }))
  }

  function handleFilterChange(novosFiltros: BibliotecaFiltros) {
    setFiltros(novosFiltros)
  }

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Cabeçalho */}
      <div className="space-y-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[#BFFF3C]/70">
          biblioteca
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Conteúdos analíticos
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
          Briefings, mapas estratégicos e teses de investimento organizados para orientar suas decisões.
        </p>
      </div>

      {/* Busca e filtros */}
      <div className="space-y-3">
        <SearchBar
          value={filtros.q ?? ''}
          onChange={handleSearchChange}
          placeholder="Buscar por título, tema ou palavra-chave..."
        />
        <FilterBar filtros={filtros} onChange={handleFilterChange} />
      </div>

      {/* Grid de cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : conteudos.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-zinc-500">Nenhum conteúdo encontrado.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {conteudos.map((conteudo) => (
            <ContentCard
              key={conteudo.id}
              conteudo={conteudo}
              onClick={() => navigate(`/dashboard/biblioteca/${conteudo.slug}`)}
            />
          ))}
        </div>
      )}

      {/* Sentinela de scroll infinito */}
      <div ref={sentinelaRef} aria-hidden="true" />

      {/* Spinner de próxima página */}
      {isFetchingNextPage && <Spinner />}
    </motion.div>
  )
}
