import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { TopNav } from './TopNav'
import { IndicatorsBar } from './indicadores/IndicatorsBar'
import { TenantProvider } from '../contexts/TenantContext'

function DashboardLayoutInner() {
  const location = useLocation()
  const prefersReduced = useReducedMotion()
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState('Aguardando sincronização')

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050606] text-zinc-100">
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-90"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_0%,rgba(191,255,60,0.11),transparent_28%),radial-gradient(circle_at_95%_35%,rgba(255,91,32,0.12),transparent_24%),linear-gradient(180deg,rgba(7,10,16,0.72),rgba(5,6,6,1))]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>
      <TopNav lastUpdatedLabel={lastUpdatedLabel} />
      <div className="relative z-10 lg:pl-72">
        <IndicatorsBar />
        <motion.main
          key={location.pathname}
          className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
          initial={prefersReduced ? false : { opacity: 0, y: 8 }}
          animate={prefersReduced ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: prefersReduced ? 0 : 0.3, ease: 'easeOut' }}
        >
          <Outlet context={{ setLastUpdatedLabel }} />
        </motion.main>
      </div>
    </div>
  )
}

export function DashboardLayout() {
  return (
    <TenantProvider>
      <DashboardLayoutInner />
    </TenantProvider>
  )
}
