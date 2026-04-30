import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { formatDistanceToNow } from '../utils/relativeTime'

interface RefetchIndicatorProps {
  isFetching: boolean
  dataUpdatedAt: number
}

function formatUpdatedAt(dataUpdatedAt: number, referenceTime: number) {
  if (!dataUpdatedAt) {
    return 'Aguardando primeira atualização'
  }

  return `Atualizado ${formatDistanceToNow(dataUpdatedAt, referenceTime)}`
}

export function RefetchIndicator({ isFetching, dataUpdatedAt }: RefetchIndicatorProps) {
  const prefersReducedMotion = useReducedMotion()
  const [referenceTime, setReferenceTime] = useState(() => Date.now())

  useEffect(() => {
    const interval = window.setInterval(() => {
      setReferenceTime(Date.now())
    }, 60_000)

    return () => window.clearInterval(interval)
  }, [])

  const label = formatUpdatedAt(dataUpdatedAt, referenceTime)

  return (
    <div className="flex justify-end">
      <AnimatePresence mode="wait" initial={false}>
        {isFetching ? (
          <motion.div
            key="fetching"
            initial={prefersReducedMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 rounded-full border border-[#BFFF3C]/20 bg-[#BFFF3C]/10 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.18em] text-[#BFFF3C]"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#BFFF3C] opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#BFFF3C]" />
            </span>
            Atualizando...
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={prefersReducedMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: 'easeOut' }}
            className="inline-flex items-center rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 font-mono text-xs uppercase tracking-[0.18em] text-zinc-400"
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
