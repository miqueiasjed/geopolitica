/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'

interface TenantData {
  nome: string
  logo_url: string | null
  subdominio: string
  max_usuarios: number
}

interface TenantContextValue {
  tenant: TenantData | null
  isB2B: boolean
  isLoading: boolean
}

const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  isB2B: false,
  isLoading: false,
})

function detectarSubdominio(): string | null {
  const hostname = window.location.hostname
  const partes = hostname.split('.')

  // Aceita subdomínio quando há pelo menos 3 partes (sub.dominio.tld) ou
  // quando não é localhost nem www
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null
  }

  if (partes.length >= 3 && partes[0] !== 'www') {
    return partes[0]
  }

  return null
}

export const tenantKeys = {
  info: ['tenant', 'info'] as const,
}

async function fetchEmpresaInfo(): Promise<TenantData> {
  const res = await api.get<TenantData>('/empresa/info')
  return res.data
}

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const subdominio = detectarSubdominio()
  const isB2B = subdominio !== null

  const { data: tenant = null, isLoading } = useQuery({
    queryKey: tenantKeys.info,
    queryFn: fetchEmpresaInfo,
    enabled: isB2B,
    staleTime: Infinity,
    retry: false,
  })

  return (
    <TenantContext.Provider value={{ tenant, isB2B, isLoading }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant(): TenantContextValue {
  return useContext(TenantContext)
}
