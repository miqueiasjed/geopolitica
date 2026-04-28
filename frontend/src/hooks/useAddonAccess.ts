import { useAuth } from './useAuth'

export function useAddonAccess(addonKey: 'elections' | 'war'): boolean {
  const { user } = useAuth()

  if (!user) return false

  const plano = user.assinante?.plano ?? ''
  const addons: string[] = user.assinante?.addons ?? []

  if (addonKey === 'elections') {
    return plano === 'pro' || plano === 'reservado' || addons.includes('elections')
  }

  if (addonKey === 'war') {
    return plano === 'reservado' || addons.includes('war')
  }

  return false
}
