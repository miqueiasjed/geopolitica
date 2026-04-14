import { ExclamationTriangleIcon } from '@radix-ui/react-icons'

interface EmptyStateProps {
  message?: string
}

export function EmptyState({ message = 'Nenhum evento encontrado para os filtros selecionados.' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/8 bg-white/[0.02] px-6 py-14 text-center text-zinc-500">
      <ExclamationTriangleIcon className="h-6 w-6" />
      <p className="max-w-md text-sm leading-6">{message}</p>
    </div>
  )
}
