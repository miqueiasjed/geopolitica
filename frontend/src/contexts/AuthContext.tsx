/* eslint-disable react-refresh/only-export-components */
import { createContext, startTransition, useEffect, useState } from 'react'
import { consultarUsuarioAutenticado, login as loginServico, logout as logoutServico } from '../services/auth'
import type { UsuarioAutenticado } from '../types/auth'
import {
  EVENTO_TOKEN_ATUALIZADO,
  obterTokenAutenticacao,
  obterUsuarioCache,
  removerTokenAutenticacao,
  salvarTokenAutenticacao,
  salvarUsuarioCache,
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
  const tokenInicial = obterTokenAutenticacao()
  const usuarioCacheado = tokenInicial ? obterUsuarioCache<UsuarioAutenticado>() : null

  const [user, setUser] = useState<UsuarioAutenticado | null>(usuarioCacheado)
  const [token, setToken] = useState<string | null>(tokenInicial)
  const [isLoading, setIsLoading] = useState(!usuarioCacheado && Boolean(tokenInicial))

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

    try {
      const usuario = await consultarUsuarioAutenticado()

      salvarUsuarioCache(usuario)

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
    salvarUsuarioCache(resposta.user)

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
