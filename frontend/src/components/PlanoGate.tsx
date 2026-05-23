import { useAuth } from '../hooks/useAuth'
import { usePlanosAtivos } from '../hooks/usePlanosAtivos'
import { UpgradePlanos } from './UpgradePlanos'

interface PlanoGateProps {
  children: React.ReactNode
}

export function PlanoGate({ children }: PlanoGateProps) {
  const { user, isLoading } = useAuth()
  const { data: planos, isLoading: isLoadingPlanos, isError: isErrorPlanos } = usePlanosAtivos()

  if (isLoading || isLoadingPlanos) return null

  if (user?.role === 'admin') return <>{children}</>

  const plano = user?.assinante?.plano

  if (isErrorPlanos) {
    if (user?.assinante?.ativo) return <>{children}</>
  } else {
    const planoReal = plano && planos?.some((p) => p.slug === plano)
    if (planoReal) return <>{children}</>
  }

  return (
    <UpgradePlanos
      titulo="Escolha seu plano"
      descricao="Assine um dos planos abaixo para ter acesso completo à plataforma de inteligência geopolítica."
    />
  )
}
