import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import { obterTokenAutenticacao } from '../utils/storage'

interface UseGerarRelatorioReturn {
  topico: string
  setTopico: (v: string) => void
  escopo: string
  setEscopo: (v: string) => void
  gerando: boolean
  preview: string
  relatorioId: string | null
  erroLimite: boolean
  gerar: () => Promise<void>
  resetar: () => void
}

function xsrfToken(): string {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ''
}

export function useGerarRelatorio(): UseGerarRelatorioReturn {
  const { token } = useAuth()

  const [topico, setTopico] = useState('')
  const [escopo, setEscopo] = useState('')
  const [gerando, setGerando] = useState(false)
  const [preview, setPreview] = useState('')
  const [relatorioId, setRelatorioId] = useState<string | null>(null)
  const [erroLimite, setErroLimite] = useState(false)

  const gerar = useCallback(async () => {
    if (!topico.trim()) return

    setGerando(true)
    setPreview('')
    setRelatorioId(null)
    setErroLimite(false)

    const authToken = token ?? obterTokenAutenticacao()

    try {
      const res = await fetch('/api/relatorios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken ? `Bearer ${authToken}` : '',
          Accept: 'text/event-stream',
          'X-XSRF-TOKEN': xsrfToken(),
        },
        body: JSON.stringify({ topico, escopo }),
      })

      if (!res.ok) {
        throw new Error(`Erro ao gerar relatório: ${res.status}`)
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = JSON.parse(line.slice(6)) as {
            token?: string
            done?: boolean
            relatorio_id?: string
            error?: string
          }
          if (data.token) setPreview((prev) => prev + data.token)
          if (data.done) setRelatorioId(data.relatorio_id ?? null)
          if (data.error === 'limit_reached') setErroLimite(true)
        }
      }
    } finally {
      setGerando(false)
    }
  }, [topico, escopo, token])

  const resetar = useCallback(() => {
    setTopico('')
    setEscopo('')
    setGerando(false)
    setPreview('')
    setRelatorioId(null)
    setErroLimite(false)
  }, [])

  return {
    topico,
    setTopico,
    escopo,
    setEscopo,
    gerando,
    preview,
    relatorioId,
    erroLimite,
    gerar,
    resetar,
  }
}
