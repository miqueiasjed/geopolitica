import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { WorldMap } from '../components/WorldMap'
import { RegionPanel } from '../components/RegionPanel'
import { IntensityLegend } from '../components/IntensityLegend'
import { useMapaIntensidade } from '../hooks/useMapaIntensidade'

interface PaisSelecionado {
  codigoPais: string
  nomePais: string
}

function MapaLoadingSkeleton() {
  return (
    <div className="flex h-full items-center justify-center">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-[#BFFF3C]/20 border-t-[#BFFF3C]"
        role="status"
        aria-label="Carregando mapa"
      />
    </div>
  )
}

export function Mapa() {
  const prefersReduced = useReducedMotion()
  const [paisSelecionado, setPaisSelecionado] = useState<PaisSelecionado | null>(null)
  const { paises, isLoading } = useMapaIntensidade()

  function handlePaisClick(codigo: string, nome: string) {
    setPaisSelecionado({ codigoPais: codigo, nomePais: nome })
  }

  function handleClose() {
    setPaisSelecionado(null)
  }

  return (
    <motion.div
      className="relative -mx-4 -my-6 flex h-[calc(100vh-13rem)] min-h-[620px] flex-col overflow-hidden bg-[#0a0a0b] sm:-mx-6 lg:-my-8 lg:h-[calc(100vh-14rem)]"
      initial={prefersReduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReduced ? 0 : 0.3, ease: 'easeOut' }}
    >
      {/* Header compacto */}
      <div className="flex-shrink-0 border-b border-[#1e1e20] bg-[#0a0a0b]/95 px-6 py-3 backdrop-blur">
        <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[#BFFF3C]/70">
          mapa de calor
        </p>
        <h1 className="text-base font-semibold text-white">
          Intensidade Geopolítica Global
        </h1>
      </div>

      {/* Área do mapa */}
      <div className="relative flex-1 overflow-hidden">
        {isLoading ? (
          <MapaLoadingSkeleton />
        ) : (
          <WorldMap paises={paises} onPaisClick={handlePaisClick} />
        )}

        {/* Legenda */}
        <IntensityLegend />

        {/* Instrução hover */}
        {!isLoading && !paisSelecionado && (
          <motion.p
            className="absolute bottom-6 right-6 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-600"
            initial={prefersReduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: prefersReduced ? 0 : 0.5, delay: 0.8 }}
          >
            Clique em um país para ver eventos
          </motion.p>
        )}

        {/* Painel lateral com animação */}
        <RegionPanel
          regiao={paisSelecionado?.codigoPais ?? null}
          nome={paisSelecionado?.nomePais ?? null}
          onClose={handleClose}
        />
      </div>
    </motion.div>
  )
}
