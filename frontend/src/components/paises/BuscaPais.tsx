import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import type { PaisResumo } from '../../types/pais'

interface BuscaPaisProps {
  onSelect: (codigoPais: string) => void
}

interface RespostaBuscaPaises {
  data: PaisResumo[]
}

const buscaPaisesKeys = {
  busca: (q: string) => ['paises', 'busca', q] as const,
}

async function buscarPaises(q: string): Promise<PaisResumo[]> {
  const resposta = await api.get<PaisResumo[] | RespostaBuscaPaises>('/paises', { params: { q } })
  const dados = resposta.data
  if (Array.isArray(dados)) return dados
  return dados.data ?? []
}

export function BuscaPais({ onSelect }: BuscaPaisProps) {
  const [termo, setTermo] = useState('')
  const [termoDebouncado, setTermoDebouncado] = useState('')
  const [aberto, setAberto] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setTermoDebouncado(termo)
    }, 300)

    return () => clearTimeout(timer)
  }, [termo])

  const habilitarBusca = termoDebouncado.length >= 2

  const { data: resultados = [], isLoading } = useQuery({
    queryKey: buscaPaisesKeys.busca(termoDebouncado),
    queryFn: () => buscarPaises(termoDebouncado),
    enabled: habilitarBusca,
  })

  useEffect(() => {
    if (habilitarBusca) {
      setAberto(true)
    } else {
      setAberto(false)
    }
  }, [habilitarBusca])

  useEffect(() => {
    function fecharAoClicarFora(evento: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(evento.target as Node)) {
        setAberto(false)
      }
    }

    document.addEventListener('mousedown', fecharAoClicarFora)
    return () => document.removeEventListener('mousedown', fecharAoClicarFora)
  }, [])

  function handleSelect(pais: PaisResumo) {
    onSelect(pais.codigo_pais)
    setTermo('')
    setTermoDebouncado('')
    setAberto(false)
  }

  const mostrarDropdown = aberto && habilitarBusca

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <input
        type="text"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        placeholder="Buscar país (mín. 2 caracteres)..."
        aria-label="Buscar país"
        className="w-full rounded-lg border border-white/10 bg-[#111113] px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-[#BFFF3C] focus:ring-1 focus:ring-[#BFFF3C]/40"
      />

      {mostrarDropdown && (
        <div
          role="listbox"
          aria-label="Resultados da busca"
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-white/10 bg-[#111113] shadow-xl"
        >
          {isLoading ? (
            <div className="space-y-2 p-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-md p-2">
                  <div className="h-6 w-6 animate-pulse rounded bg-white/10" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
                    <div className="h-2.5 w-1/3 animate-pulse rounded bg-white/8" />
                  </div>
                </div>
              ))}
            </div>
          ) : resultados.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-zinc-500">Nenhum país encontrado</div>
          ) : (
            <ul className="max-h-60 overflow-y-auto py-1">
              {resultados.map((pais) => (
                <li key={pais.codigo_pais}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={false}
                    onClick={() => handleSelect(pais)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/5 focus:bg-white/5 focus:outline-none"
                  >
                    <span className="text-xl" aria-hidden="true">
                      {pais.bandeira_emoji ?? '🌐'}
                    </span>
                    <span className="flex-1">
                      <span className="block font-medium text-white">{pais.nome_pt}</span>
                      <span className="block text-xs text-zinc-500">{pais.regiao_geopolitica}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
