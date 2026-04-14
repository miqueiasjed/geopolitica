import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { TopNav } from './TopNav'

export function DashboardLayout() {
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState('Aguardando sincronização')

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100">
      <TopNav lastUpdatedLabel={lastUpdatedLabel} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <Outlet context={{ setLastUpdatedLabel }} />
      </main>
    </div>
  )
}
