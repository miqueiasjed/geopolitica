import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

interface ExportPdfButtonProps {
  tipo: 'briefing' | 'alerta' | 'pais' | 'chat' | 'report' | 'risk_score'
  id: string
  label?: string
  companySlug?: string
}

const DownloadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M7 2v7" />
    <path d="M4.5 6.5L7 9l2.5-2.5" />
    <path d="M2 11h10" />
  </svg>
)

export function ExportPdfButton({
  tipo,
  id,
  label = 'Exportar PDF',
  companySlug,
}: ExportPdfButtonProps) {
  const [loading, setLoading] = useState(false)
  const { token } = useAuth()

  async function handleExport() {
    setLoading(true)

    try {
      const res = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tipo, id, company_slug: companySlug }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const mensagem =
          (data as { message?: string }).message ?? 'Erro ao exportar PDF. Tente novamente.'
        alert(mensagem)
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)

      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `export-${tipo}-${id}.pdf`
      anchor.click()

      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      aria-label={label}
      className="flex items-center gap-2 text-[10px] tracking-widest uppercase
        border border-white/10 px-3 py-1.5 text-white/40
        hover:border-white/25 hover:text-white/60 transition-all
        disabled:opacity-30 disabled:cursor-not-allowed"
    >
      <DownloadIcon />
      {loading ? 'Exportando…' : label}
    </button>
  )
}
