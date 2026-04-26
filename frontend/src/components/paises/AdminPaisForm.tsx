import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { criarPais, atualizarPais, adminKeys } from '../../services/admin'
import type { AdminPerfilPais, CriarPerfilPaisPayload, AtualizarPerfilPaisPayload } from '../../types/admin'

interface AdminPaisFormProps {
  pais?: AdminPerfilPais
  onSuccess: () => void
  onCancel: () => void
}

const REGIOES = [
  'América do Norte', 'América Latina', 'Europa', 'Oriente Médio',
  'Ásia', 'Ásia-Pacífico', 'África', 'Oceania', 'Global',
]

const BANDEIRAS_EXEMPLOS = ['🇧🇷', '🇺🇸', '🇨🇳', '🇷🇺', '🇩🇪', '🇬🇧', '🇫🇷', '🇯🇵', '🇮🇳', '🇮🇱']

function getFormInicial(pais?: AdminPerfilPais): CriarPerfilPaisPayload {
  if (pais) {
    return {
      codigo_pais: pais.codigo_pais,
      nome_pt: pais.nome_pt,
      bandeira_emoji: pais.bandeira_emoji ?? '',
      regiao_geopolitica: pais.regiao_geopolitica ?? '',
      contexto_geopolitico: pais.contexto_geopolitico ?? '',
      analise_lideranca: pais.analise_lideranca ?? '',
      indicadores_relevantes: pais.indicadores_relevantes ?? [],
      termos_busca: pais.termos_busca ?? [],
    }
  }
  return {
    codigo_pais: '', nome_pt: '', bandeira_emoji: '', regiao_geopolitica: '',
    contexto_geopolitico: '', analise_lideranca: '',
    indicadores_relevantes: [], termos_busca: [],
  }
}

export function AdminPaisForm({ pais, onSuccess, onCancel }: AdminPaisFormProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<CriarPerfilPaisPayload>(() => getFormInicial(pais))
  const [erroServidor, setErroServidor] = useState<string | null>(null)
  const [novoTermo, setNovoTermo] = useState('')
  const isEdicao = !!pais

  const mutacao = useMutation({
    mutationFn: (dados: CriarPerfilPaisPayload) => {
      const payload = {
        ...dados,
        bandeira_emoji: dados.bandeira_emoji?.trim() || null,
        regiao_geopolitica: dados.regiao_geopolitica?.trim() || null,
        contexto_geopolitico: dados.contexto_geopolitico?.trim() || null,
        analise_lideranca: dados.analise_lideranca?.trim() || null,
      }
      if (isEdicao) {
        const { codigo_pais: _, ...resto } = payload
        return atualizarPais(pais.codigo_pais, resto as AtualizarPerfilPaisPayload)
      }
      return criarPais(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.paises() })
      onSuccess()
    },
    onError: (erro: unknown) => {
      setErroServidor(erro instanceof Error ? erro.message : 'Erro ao salvar. Tente novamente.')
    },
  })

  function set<K extends keyof CriarPerfilPaisPayload>(campo: K, valor: CriarPerfilPaisPayload[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  function adicionarTermo(termo: string) {
    const valor = termo.trim()
    if (!valor || form.termos_busca.includes(valor)) return
    set('termos_busca', [...form.termos_busca, valor])
    setNovoTermo('')
  }

  function removerTermo(termo: string) {
    set('termos_busca', form.termos_busca.filter((t) => t !== termo))
  }

  const label = 'block font-mono text-xs uppercase tracking-[0.14em] text-zinc-400 mb-1'
  const input = 'w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 transition-colors focus:border-[#C9B882] focus:outline-none focus:ring-1 focus:ring-[#C9B882]'

  return (
    <form onSubmit={(e) => { e.preventDefault(); setErroServidor(null); mutacao.mutate(form) }} className="space-y-5">
      {erroServidor && (
        <div className="rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{erroServidor}</div>
      )}

      {/* Código + Nome */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="codigo_pais" className={label}>Código ISO (2 letras)</label>
          <input id="codigo_pais" type="text" required maxLength={2} minLength={2}
            value={form.codigo_pais} disabled={isEdicao}
            onChange={(e) => set('codigo_pais', e.target.value.toUpperCase())}
            placeholder="BR" className={`${input} ${isEdicao ? 'cursor-not-allowed opacity-50' : ''}`} />
        </div>
        <div className="col-span-2">
          <label htmlFor="nome_pt" className={label}>Nome em Português</label>
          <input id="nome_pt" type="text" required value={form.nome_pt}
            onChange={(e) => set('nome_pt', e.target.value)}
            placeholder="Brasil" className={input} />
        </div>
      </div>

      {/* Bandeira + Região */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="bandeira_emoji" className={label}>Emoji da Bandeira</label>
          <input id="bandeira_emoji" type="text" value={form.bandeira_emoji ?? ''}
            onChange={(e) => set('bandeira_emoji', e.target.value)}
            placeholder="🇧🇷" className={input} />
          <div className="mt-1.5 flex flex-wrap gap-1">
            {BANDEIRAS_EXEMPLOS.map((b) => (
              <button key={b} type="button" onClick={() => set('bandeira_emoji', b)}
                className="rounded px-1 text-lg hover:bg-white/5">{b}</button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="regiao" className={label}>Região Geopolítica</label>
          <select id="regiao" value={form.regiao_geopolitica ?? ''}
            onChange={(e) => set('regiao_geopolitica', e.target.value)}
            className={input}>
            <option value="">— Selecionar —</option>
            {REGIOES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Termos de Busca */}
      <div>
        <span className={label}>Termos de Busca (RSS/IA usam para filtrar notícias)</span>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {form.termos_busca.map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 font-mono text-xs text-zinc-300">
              {t}
              <button type="button" onClick={() => removerTermo(t)} className="text-zinc-500 hover:text-red-400">✕</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={novoTermo}
            onChange={(e) => setNovoTermo(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarTermo(novoTermo) } }}
            placeholder="Ex: brasil, selic, lula (Enter para adicionar)" className={`${input} flex-1`} />
          <button type="button" onClick={() => adicionarTermo(novoTermo)}
            className="rounded border border-zinc-700 px-3 py-2 font-mono text-xs text-zinc-400 hover:border-[#C9B882] hover:text-[#C9B882]">
            + Adicionar
          </button>
        </div>
      </div>

      {/* Contexto (opcional — IA pode gerar) */}
      <div>
        <label htmlFor="contexto_geo" className={label}>
          Contexto Geopolítico
          <span className="ml-2 normal-case text-zinc-600">(opcional — pode ser gerado pela IA)</span>
        </label>
        <textarea id="contexto_geo" rows={4} value={form.contexto_geopolitico ?? ''}
          onChange={(e) => set('contexto_geopolitico', e.target.value)}
          placeholder="Deixe vazio para gerar automaticamente via IA quando o usuário acessar..."
          className={`${input} resize-y`} />
      </div>

      {/* Análise de Liderança (opcional — IA pode gerar) */}
      <div>
        <label htmlFor="analise_lideranca" className={label}>
          Análise de Liderança
          <span className="ml-2 normal-case text-zinc-600">(opcional — pode ser gerado pela IA)</span>
        </label>
        <textarea id="analise_lideranca" rows={3} value={form.analise_lideranca ?? ''}
          onChange={(e) => set('analise_lideranca', e.target.value)}
          placeholder="Deixe vazio para gerar automaticamente via IA quando o usuário acessar..."
          className={`${input} resize-y`} />
      </div>

      {/* Ações */}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} disabled={mutacao.isPending}
          className="rounded-full border border-zinc-700 px-5 py-2 font-mono text-xs uppercase tracking-[0.14em] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-50">
          Cancelar
        </button>
        <button type="submit" disabled={mutacao.isPending}
          className="rounded-full bg-[#C9B882] px-5 py-2 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#0a0a0b] hover:opacity-90 disabled:opacity-50">
          {mutacao.isPending ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
