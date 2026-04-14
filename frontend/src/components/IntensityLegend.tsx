import { motion, useReducedMotion } from 'framer-motion'

export function IntensityLegend() {
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      className="fixed bottom-6 left-6 z-40 bg-[#111] border border-[#333] rounded-lg p-3 shadow-xl"
      initial={prefersReduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReduced ? 0 : 0.3, ease: 'easeOut', delay: 0.4 }}
    >
      <p className="text-xs text-gray-400 mb-2 font-medium tracking-wide uppercase">
        Intensidade Geopolítica
      </p>

      <div
        className="h-3 w-40 rounded-full"
        style={{
          background: 'linear-gradient(to right, #2a2a2a, #7f1d1d)',
        }}
        role="img"
        aria-label="Escala de intensidade geopolítica de baixo a alto"
      />

      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-400">Baixo (1)</span>
        <span className="text-xs text-[#ef4444]">Alto (10)</span>
      </div>
    </motion.div>
  )
}
