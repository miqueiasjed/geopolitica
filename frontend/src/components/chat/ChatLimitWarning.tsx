import { Link } from 'react-router-dom'

interface ChatLimitWarningProps {
  mensagem: string
  onUpgrade?: () => void
}

export function ChatLimitWarning({ mensagem, onUpgrade }: ChatLimitWarningProps) {
  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-amber-700/50 bg-amber-900/20 px-4 py-3"
      role="alert"
      aria-live="assertive"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>

      <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-amber-200">{mensagem}</p>

        {onUpgrade ? (
          <button
            type="button"
            onClick={onUpgrade}
            className="rounded-md border border-amber-600 bg-amber-900/40 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wide text-amber-300 transition-colors hover:bg-amber-800/50"
          >
            Ver planos
          </button>
        ) : (
          <Link
            to="/planos"
            className="rounded-md border border-amber-600 bg-amber-900/40 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wide text-amber-300 transition-colors hover:bg-amber-800/50"
          >
            Ver planos
          </Link>
        )}
      </div>
    </div>
  )
}
