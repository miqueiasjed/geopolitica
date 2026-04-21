/* eslint-disable react-refresh/only-export-components */
import { createContext, startTransition, useEffect, useState } from 'react'
import { consultarUsuarioAutenticado, login as loginServico, logout as logoutServico } from '../services/auth'
import type { UsuarioAutenticado } from '../types/auth'
import {
  EVENTO_TOKEN_ATUALIZADO,
  obterTokenAutenticacao,
  removerTokenAutenticacao,
  salvarTokenAutenticacao,
} from '../utils/storage'

interface AuthContextValue {
  user: UsuarioAutenticado | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UsuarioAutenticado | null>(null)
  const [token, setToken] = useState<string | null>(() => obterTokenAutenticacao())
  const [isLoading, setIsLoading] = useState(true)

  async function checkAuth() {
    const tokenAtual = obterTokenAutenticacao()

    if (!tokenAtual) {
      startTransition(() => {
        setToken(null)
        setUser(null)
        setIsLoading(false)
      })

      return
    }

    setIsLoading(true)

    try {
      const usuario = await consultarUsuarioAutenticado()

      startTransition(() => {
        setToken(tokenAtual)
        setUser(usuario)
        setIsLoading(false)
      })
    } catch {
      removerTokenAutenticacao()
      startTransition(() => {
        setToken(null)
        setUser(null)
        setIsLoading(false)
      })
    }
  }

  async function login(email: string, password: string) {
    const resposta = await loginServico({ email, password })

    salvarTokenAutenticacao(resposta.token)

    startTransition(() => {
      setToken(resposta.token)
      setUser(resposta.user)
    })
  }

  async function logout() {
    try {
      await logoutServico()
    } finally {
      removerTokenAutenticacao()
      startTransition(() => {
        setToken(null)
        setUser(null)
      })
    }
  }

  useEffect(() => {
    void checkAuth()
  }, [])

  useEffect(() => {
    const sincronizarToken = () => {
      const tokenAtual = obterTokenAutenticacao()
      setToken(tokenAtual)

      if (!tokenAtual) {
        setUser(null)
      }
    }

    window.addEventListener(EVENTO_TOKEN_ATUALIZADO, sincronizarToken)

    return () => {
      window.removeEventListener(EVENTO_TOKEN_ATUALIZADO, sincronizarToken)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        isLoading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
