import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { criarCrise, atualizarCrise, adminKeys } from '../../services/admin'
import type { AdminCriseHistorica, CriarCrisePayload, MetricaItem } from '../../types/admin'

interface AdminCriseFormProps {
  crise?: AdminCriseHistorica
  onSuccess: () => void
  onCancel: () => void
}

const CATEGORIAS_SUGERIDAS = [
  'conflito-armado', 'crise-economica', 'crise-humanitaria', 'golpe-de-estado',
  'crise-nuclear', 'terrorismo', 'revolucao', 'pandemia', 'crise-energetica',
  'crise-diplomatica', 'sancoes', 'colapso-financeiro',
]


function gerarSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function getFormInicial(crise?: AdminCriseHistorica): CriarCrisePayload {
  if (crise) {
    return {
      titulo: crise.titulo,
      slug: crise.slug,
      ano: crise.ano,
      data_inicio: crise.data_inicio,
      data_fim: crise.data_fim ?? '',
      contexto_geopolitico: crise.contexto_geopolitico,
      impacto_global: crise.impacto_global,
      impacto_brasil: crise.impacto_brasil,
      metricas_globais: crise.metricas_globais.length > 0 ? crise.metricas_globais : [],
      metricas_brasil: crise.metricas_brasil.length > 0 ? crise.metricas_brasil : [],
      categorias: crise.categorias,
      content_slug: crise.content_slug ?? '',
    }
  }
  return {
    titulo: '', slug: '', ano: new Date().getFullYear(),
    data_inicio: '', data_fim: '',
    contexto_geopolitico: '', impacto_global: '', impacto_brasil: '',
    metricas_globais: [], metricas_brasil: [], categorias: [], content_slug: '',
  }
}

export function AdminCriseForm({ crise, onSuccess, onCancel }: AdminCriseFormProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<CriarCrisePayload>(() => getFormInicial(crise))
  const [erroServidor, setErroServidor] = useState<string | null>(null)
  const [novaCategoria, setNovaCategoria] = useState('')
  const isEdicao = !!crise

  const mutacao = useMutation({
    mutationFn: (dados: CriarCrisePayload) => {
      const payload = {
        ...dados,
        data_fim: dados.data_fim?.trim() || null,
        content_slug: (dados.content_slug as string)?.trim() || null,
        metricas_globais: dados.metricas_globais.filter((m) => m.label.trim()),
        metricas_brasil: dados.metricas_brasil.filter((m) => m.label.trim()),
      }
      return isEdicao ? atualizarCrise(crise.id, payload) : criarCrise(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.crises() })
      onSuccess()
    },
    onError: (erro: unknown) => {
      setErroServidor(erro instanceof Error ? erro.message : 'Erro ao salvar. Tente novamente.')
    },
  })

  function set<K extends keyof CriarCrisePayload>(campo: K, valor: CriarCrisePayload[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  function handleTituloChange(titulo: string) {
    setForm((prev) => ({
      ...prev, titulo,
      slug: isEdicao ? prev.slug : gerarSlug(titulo),
    }))
  }

  function adicionarCategoria(cat: string) {
    const valor = cat.trim().toLowerCase()
    if (!valor || form.categorias.includes(valor)) return
    set('categorias', [...form.categorias, valor])
    setNovaCategoria('')
  }

  function removerCategoria(cat: string) {
    set('categorias', form.categorias.filter((c) => c !== cat))
  }

  function adicionarMetrica(campo: 'metricas_globais' | 'metricas_brasil') {
    set(campo, [...form[campo], { label: '', valor: '' }])
  }

  function atualizarMetrica(campo: 'metricas_globais' | 'metricas_brasil', index: number, key: keyof MetricaItem, valor: string) {
    set(campo, form[campo].map((m, i) => i === index ? { ...m, [key]: valor } : m))
  }

  function removerMetrica(campo: 'metricas_globais' | 'metricas_brasil', index: number) {
    set(campo, form[campo].filter((_, i) => i !== index))
  }

  const label = 'block font-mono text-xs uppercase tracking-[0.14em] text-zinc-400 mb-1'
  const input = 'w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 transition-colors focus:border-[#C9B882] focus:outline-none focus:ring-1 focus:ring-[#C9B882]'

  return (
    <form onSubmit={(e) => { e.preventDefault(); setErroServidor(null); mutacao.mutate(form) }} className="space-y-5">
      {erroServidor && (
        <div className="rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{erroServidor}</div>
      )}

      {/* Título + Slug */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="titulo" className={label}>Título</label>
          <input id="titulo" type="text" required value={form.titulo}
            onChange={(e) => handleTituloChange(e.target.value)}
            placeholder="Guerra do Golfo" className={input} />
        </div>
        <div>
          <label htmlFor="slug" className={label}>Slug (URL)</label>
          <input id="slug" type="text" required value={form.slug}
            onChange={(e) => set('slug', e.target.value)}
            placeholder="guerra-do-golfo" className={input} />
        </div>
      </div>

      {/* Ano + Datas */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="ano" className={label}>Ano</label>
          <input id="ano" type="number" required min={1900} max={2100}
            value={form.ano} onChange={(e) => set('ano', Number(e.target.value))}
            className={input} />
        </div>
        <div>
          <label htmlFor="data_inicio" className={label}>Data Início</label>
          <input id="data_inicio" type="date" required value={form.data_inicio}
            onChange={(e) => set('data_inicio', e.target.value)} className={input} />
        </div>
        <div>
          <label htmlFor="data_fim" className={label}>Data Fim (vazio = em andamento)</label>
          <input id="data_fim" type="date" value={form.data_fim ?? ''}
            onChange={(e) => set('data_fim', e.target.value)} className={input} />
        </div>
      </div>

      {/* Categorias */}
      <div>
        <span className={label}>Categorias</span>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {form.categorias.map((cat) => (
            <span key={cat} className="inline-flex items-center gap-1.5 rounded-full border border-[#C9B882]/30 bg-[#C9B882]/10 px-2.5 py-0.5 font-mono text-xs text-[#C9B882]">
              {cat}
              <button type="button" onClick={() => removerCategoria(cat)} className="text-[#C9B882]/60 hover:text-red-400">✕</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" list="sugestoes-cat" value={novaCategoria}
            onChange={(e) => setNovaCategoria(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarCategoria(novaCategoria) } }}
            placeholder="Digite e pressione Enter" className={`${input} flex-1`} />
          <button type="button" onClick={() => adicionarCategoria(novaCategoria)}
            className="rounded border border-[#C9B882]/30 px-3 py-2 font-mono text-xs text-[#C9B882] hover:bg-[#C9B882]/10">
            + Adicionar
          </button>
        </div>
        <datalist id="sugestoes-cat">
          {CATEGORIAS_SUGERIDAS.map((c) => <option key={c} value={c} />)}
        </datalist>
        {form.categorias.length === 0 && (
          <p className="mt-1 font-mono text-xs text-red-400">Pelo menos uma categoria é obrigatória.</p>
        )}
      </div>

      {/* Contexto */}
      <div>
        <label htmlFor="contexto" className={label}>Contexto Geopolítico</label>
        <textarea id="contexto" rows={4} required value={form.contexto_geopolitico}
          onChange={(e) => set('contexto_geopolitico', e.target.value)}
          placeholder="Descreva o contexto histórico e geopolítico desta crise..."
          className={`${input} resize-y`} />
      </div>

      {/* Impacto Global */}
      <div>
        <label htmlFor="impacto_global" className={label}>Impacto Global</label>
        <textarea id="impacto_global" rows={3} required value={form.impacto_global}
          onChange={(e) => set('impacto_global', e.target.value)}
          placeholder="Quais foram os efeitos globais desta crise?" className={`${input} resize-y`} />
      </div>

      {/* Impacto Brasil */}
      <div>
        <label htmlFor="impacto_brasil" className={label}>Impacto no Brasil</label>
        <textarea id="impacto_brasil" rows={3} required value={form.impacto_brasil}
          onChange={(e) => set('impacto_brasil', e.target.value)}
          placeholder="Como esta crise afetou o Brasil?" className={`${input} resize-y`} />
      </div>

      {/* Métricas Globais */}
      <div>
        <span className={label}>Métricas Globais (opcional)</span>
        <div className="space-y-2">
          {form.metricas_globais.map((m, i) => (
            <div key={i} className="flex gap-2">
              <input type="text" value={m.label} placeholder="Ex: Baixas civis"
                onChange={(e) => atualizarMetrica('metricas_globais', i, 'label', e.target.value)}
                aria-label={`Label métrica global ${i + 1}`} className={`${input} flex-1`} />
              <input type="text" value={m.valor} placeholder="Ex: 250.000"
                onChange={(e) => atualizarMetrica('metricas_globais', i, 'valor', e.target.value)}
                aria-label={`Valor métrica global ${i + 1}`} className={`${input} w-36`} />
              <button type="button" onClick={() => removerMetrica('metricas_globais', i)}
                className="rounded p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400">✕</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => adicionarMetrica('metricas_globais')}
          className="mt-2 font-mono text-xs uppercase tracking-[0.14em] text-[#C9B882] hover:text-[#E8E4DC]">
          + Adicionar métrica global
        </button>
      </div>

      {/* Métricas Brasil */}
      <div>
        <span className={label}>Métricas Brasil (opcional)</span>
        <div className="space-y-2">
          {form.metricas_brasil.map((m, i) => (
            <div key={i} className="flex gap-2">
              <input type="text" value={m.label} placeholder="Ex: Variação do câmbio"
                onChange={(e) => atualizarMetrica('metricas_brasil', i, 'label', e.target.value)}
                aria-label={`Label métrica brasil ${i + 1}`} className={`${input} flex-1`} />
              <input type="text" value={m.valor} placeholder="Ex: +15%"
                onChange={(e) => atualizarMetrica('metricas_brasil', i, 'valor', e.target.value)}
                aria-label={`Valor métrica brasil ${i + 1}`} className={`${input} w-36`} />
              <button type="button" onClick={() => removerMetrica('metricas_brasil', i)}
                className="rounded p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400">✕</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => adicionarMetrica('metricas_brasil')}
          className="mt-2 font-mono text-xs uppercase tracking-[0.14em] text-[#C9B882] hover:text-[#E8E4DC]">
          + Adicionar métrica Brasil
        </button>
      </div>

      {/* Content slug opcional */}
      <div>
        <label htmlFor="content_slug" className={label}>Slug da Biblioteca (opcional)</label>
        <input id="content_slug" type="text" value={form.content_slug ?? ''}
          onChange={(e) => set('content_slug', e.target.value)}
          placeholder="analise-guerra-golfo" className={input} />
      </div>

      {/* Ações */}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} disabled={mutacao.isPending}
          className="rounded-full border border-zinc-700 px-5 py-2 font-mono text-xs uppercase tracking-[0.14em] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-50">
          Cancelar
        </button>
        <button type="submit" disabled={mutacao.isPending || form.categorias.length === 0}
          className="rounded-full bg-[#C9B882] px-5 py-2 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#0a0a0b] hover:opacity-90 disabled:opacity-50">
          {mutacao.isPending ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
