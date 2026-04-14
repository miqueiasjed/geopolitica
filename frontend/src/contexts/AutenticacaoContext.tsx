/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react'

interface AutenticacaoContextValue {
  token: string | null
}

const AutenticacaoContext = createContext<AutenticacaoContextValue>({
  token: null,
})

export function AutenticacaoProvider({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('gpi_token')

  return (
    <AutenticacaoContext.Provider value={{ token }}>
      {children}
    </AutenticacaoContext.Provider>
  )
}

export function useAutenticacao() {
  return useContext(AutenticacaoContext)
}
