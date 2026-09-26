import { useEffect, useState } from 'react'
import { AppRouter } from './router'
import { SiteDesativado } from './pages/SiteDesativado'

type StatusSite = 'verificando' | 'ativo' | 'desativado'

function App() {
  const [status, setStatus] = useState<StatusSite>('verificando')

  useEffect(() => {
    fetch('/api/status-site', { headers: { Accept: 'application/json' } })
      .then(async (resposta) => {
        const corpo = await resposta.json().catch(() => null)
        setStatus(corpo?.site_desativado ? 'desativado' : 'ativo')
      })
      .catch(() => setStatus('ativo'))

    const aoDesativar = () => setStatus('desativado')
    window.addEventListener('site-desativado', aoDesativar)

    return () => window.removeEventListener('site-desativado', aoDesativar)
  }, [])

  if (status === 'verificando') return null
  if (status === 'desativado') return <SiteDesativado />

  return <AppRouter />
}

export default App
