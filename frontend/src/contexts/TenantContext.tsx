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

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null
  }

  const partes = hostname.split('.')

  // ccTLDs de segundo nível (.com.br, .net.br, etc.) fazem o domínio raiz ter 3 segmentos.
  // Nesses casos precisamos de 4+ partes para ter subdomínio real.
  const ccTLDs2Nivel = ['com', 'net', 'org', 'edu', 'gov', 'mil', 'art', 'esp', 'rec', 'tur', 'adv', 'arq', 'ato', 'bio', 'bmd', 'cim', 'cng', 'cnt', 'coop', 'ecn', 'eco', 'eng', 'etc', 'eti', 'far', 'fnd', 'fot', 'fst', 'g12', 'ggf', 'imb', 'ind', 'inf', 'jor', 'jus', 'leg', 'lel', 'mat', 'med', 'mus', 'not', 'ntr', 'odo', 'ppg', 'pro', 'psc', 'psi', 'qsl', 'radio', 'slg', 'srv', 'taxi', 'teo', 'tmp', 'trd', 'tur', 'tv', 'vet', 'zlg']
  const tld = partes[partes.length - 1]
  const sld = partes[partes.length - 2]
  const ehCcTLD2Nivel = tld === 'br' && ccTLDs2Nivel.includes(sld)
  const minimoPartes = ehCcTLD2Nivel ? 4 : 3

  if (partes.length >= minimoPartes && partes[0] !== 'www') {
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
