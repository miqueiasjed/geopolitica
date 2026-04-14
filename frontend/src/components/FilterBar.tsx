import type { FeedFilters } from '../types/feed'

interface FilterBarProps {
  filters: FeedFilters
  onChange: (filters: FeedFilters) => void
}

const categories = [
  { label: 'Todos', value: undefined },
  { label: 'Energia', value: 'energia' },
  { label: 'Alimentos', value: 'alimentos' },
  { label: 'Câmbio', value: 'cambio' },
  { label: 'Conflitos', value: 'conflitos' },
  { label: 'Sanções', value: 'sancoes' },
  { label: 'Eleições', value: 'eleicoes' },
  { label: 'Commodities', value: 'commodities' },
] as const

export function FilterBar({ filters, onChange }: FilterBarProps) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <div className="flex min-w-max gap-2">
        {categories.map((category) => {
          const active = (filters.categoria ?? undefined) === category.value

          return (
            <button
              key={category.label}
              type="button"
              onClick={() =>
                onChange({
                  ...filters,
                  categoria: category.value,
                })
              }
              className={`rounded-full px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] transition-colors ${
                active
                  ? 'border border-[#C9B882]/30 bg-[#C9B882]/10 text-[#C9B882]'
                  : 'border border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {category.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
