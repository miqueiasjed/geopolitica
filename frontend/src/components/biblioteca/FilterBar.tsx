import type { BibliotecaFiltros, TipoConteudo } from '../../types/biblioteca'

interface FilterBarProps {
  filtros: BibliotecaFiltros
  onChange: (f: BibliotecaFiltros) => void
}

const tipoOptions: { label: string; value: TipoConteudo | '' }[] = [
  { label: 'Todos', value: '' },
  { label: 'Briefing', value: 'briefing' },
  { label: 'Mapa', value: 'mapa' },
  { label: 'A Tese', value: 'tese' },
]

const regiaoOptions: { label: string; value: string }[] = [
  { label: 'Todas', value: '' },
  { label: 'América do Sul', value: 'america-do-sul' },
  { label: 'Europa', value: 'europa' },
  { label: 'Oriente Médio', value: 'oriente-medio' },
  { label: 'Ásia', value: 'asia' },
  { label: 'África', value: 'africa' },
  { label: 'América do Norte', value: 'america-do-norte' },
  { label: 'Global', value: 'global' },
]

const selectClass =
  'rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors focus:border-zinc-600 cursor-pointer'

const inputDateClass =
  'rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors focus:border-zinc-600 [color-scheme:dark]'

export function FilterBar({ filtros, onChange }: FilterBarProps) {
  const hasActiveFilter =
    Boolean(filtros.tipo) ||
    Boolean(filtros.regiao) ||
    Boolean(filtros.de) ||
    Boolean(filtros.ate)

  function handleTipo(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value as TipoConteudo | ''
    onChange({ ...filtros, tipo: val === '' ? undefined : val })
  }

  function handleRegiao(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    onChange({ ...filtros, regiao: val === '' ? undefined : val })
  }

  function handleDe(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    onChange({ ...filtros, de: val === '' ? undefined : val })
  }

  function handleAte(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    onChange({ ...filtros, ate: val === '' ? undefined : val })
  }

  function handleClear() {
    onChange({})
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <div className="flex min-w-max flex-wrap items-center gap-2">
        {/* Tipo */}
        <select
          value={filtros.tipo ?? ''}
          onChange={handleTipo}
          aria-label="Filtrar por tipo"
          className={selectClass}
        >
          {tipoOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Região */}
        <select
          value={filtros.regiao ?? ''}
          onChange={handleRegiao}
          aria-label="Filtrar por região"
          className={selectClass}
        >
          {regiaoOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* De */}
        <input
          type="date"
          value={filtros.de ?? ''}
          onChange={handleDe}
          aria-label="Data inicial"
          className={inputDateClass}
        />

        {/* Até */}
        <input
          type="date"
          value={filtros.ate ?? ''}
          onChange={handleAte}
          aria-label="Data final"
          className={inputDateClass}
        />

        {/* Limpar filtros */}
        {hasActiveFilter && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg border border-zinc-700 bg-transparent px-3 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
          >
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  )
}
