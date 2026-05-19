import { useEffect } from 'react'
import manualHtml from '../../../manual-assinante.html?raw'

export function Manual() {
  useEffect(() => {
    document.title = 'Manual do Assinante - Geopolitica para Investidores'
  }, [])

  return (
    <iframe
      title="Manual do Assinante"
      srcDoc={manualHtml}
      className="fixed inset-0 h-screen w-screen border-0 bg-[#050606]"
    />
  )
}
