import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import type { EleicaoDetalhe, CandidatoPrincipal, RelevanciaEleicao } from '../../types/eleicao'
import { eleicoesKeys } from '../../hooks/useEleicoes'

interface AdminEleicaoFormProps {
  eleicao?: EleicaoDetalhe
  onSuccess: () => void
  onCancel: () => void
}

interface FormData {
  pais: string
  codigo_pais: string
  data_eleicao: string
  tipo_eleicao: string
  relevancia: RelevanciaEleicao
  contexto_geopolitico: string
  impacto_brasil: string
  candidatos_principais: CandidatoPrincipal[]
  content_slug: string
}

const SUGESTOES_TIPO = ['Presidencial', 'Parlamentar', 'Referendo', 'Municipal', 'Legislativa']

function getFormDataInicial(eleicao?: EleicaoDetalhe): FormData {
  if (eleicao) {
    return {
      pais: eleicao.pais,
      codigo_pais: eleicao.codigo_pais,
      data_eleicao: eleicao.data_eleicao,
      tipo_eleicao: eleicao.tipo_eleicao,
      relevancia: eleicao.relevancia,
      contexto_geopolitico: eleicao.contexto_geopolitico,
      impacto_brasil: eleicao.impacto_brasil,
      candidatos_principais: eleicao.candidatos_principais.length > 0
        ? eleicao.candidatos_principais
        : [{ nome: '', partido: '' }],
      content_slug: eleicao.content_slug ?? '',
    }
  }
  return {
    pais: '',
    codigo_pais: '',
    data_eleicao: '',
    tipo_eleicao: '',
    relevancia: 'media',
    contexto_geopolitico: '',
    impacto_brasil: '',
    candidatos_principais: [{ nome: '', partido: '' }],
    content_slug: '',
  }
}

export function AdminEleicaoForm({ eleicao, onSuccess, onCancel }: AdminEleicaoFormProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormData>(() => getFormDataInicial(eleicao))
  const [erroServidor, setErroServidor] = useState<string | null>(null)

  const isEdicao = !!eleicao

  const mutacao = useMutation({
    mutationFn: async (dados: FormData) => {
      const payload = {
        ...dados,
        content_slug: dados.content_slug.trim() || null,
        candidatos_principais: dados.candidatos_principais.filter((c) => c.nome.trim() !== ''),
      }
      if (isEdicao) {
        const response = await api.patch(`/admin/eleicoes/${eleicao.id}`, payload)
        return response.data
      } else {
        const response = await api.post('/admin/eleicoes', payload)
        return response.data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eleicoesKeys.all })
      onSuccess()
    },
    onError: (erro: unknown) => {
      if (erro instanceof Error) {
        setErroServidor(erro.message)
      } else {
        setErroServidor('Ocorreu um erro ao salvar. Tente novamente.')
      }
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErroServidor(null)
    mutacao.mutate(form)
  }

  function atualizarCampo<K extends keyof FormData>(campo: K, valor: FormData[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  function adicionarCandidato() {
    setForm((prev) => ({
      ...prev,
      candidatos_principais: [...prev.candidatos_principais, { nome: '', partido: '' }],
    }))
  }

  function removerCandidato(index: number) {
    setForm((prev) => ({
      ...prev,
      candidatos_principais: prev.candidatos_principais.filter((_, i) => i !== index),
    }))
  }

  function atualizarCandidato(index: number, campo: keyof CandidatoPrincipal, valor: string) {
    setForm((prev) => ({
      ...prev,
      candidatos_principais: prev.candidatos_principais.map((c, i) =>
        i === index ? { ...c, [campo]: valor } : c,
      ),
    }))
  }

  const labelClass = 'block font-mono text-xs uppercase tracking-[0.14em] text-zinc-400 mb-1'
  const inputClass =
    'w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 transition-colors focus:border-[#C9B882] focus:outline-none focus:ring-1 focus:ring-[#C9B882]'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {erroServidor && (
        <div className="rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {erroServidor}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* País */}
        <div>
          <label htmlFor="pais" className={labelClass}>
            País
          </label>
          <input
            id="pais"
            type="text"
            required
            value={form.pais}
            onChange={(e) => atualizarCampo('pais', e.target.value)}
            placeholder="Brasil"
            className={inputClass}
          />
        </div>

        {/* Código do país */}
        <div>
          <label htmlFor="codigo_pais" className={labelClass}>
            Código (ISO)
          </label>
          <input
            id="codigo_pais"
            type="text"
            required
            maxLength={2}
            value={form.codigo_pais}
            onChange={(e) => atualizarCampo('codigo_pais', e.target.value.toUpperCase())}
            placeholder="BR"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Data da eleição */}
        <div>
          <label htmlFor="data_eleicao" className={labelClass}>
            Data da Eleição
          </label>
          <input
            id="data_eleicao"
            type="date"
            required
            value={form.data_eleicao}
            onChange={(e) => atualizarCampo('data_eleicao', e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Relevância */}
        <div>
          <label htmlFor="relevancia" className={labelClass}>
            Relevância
          </label>
          <select
            id="relevancia"
            required
            value={form.relevancia}
            onChange={(e) => atualizarCampo('relevancia', e.target.value as RelevanciaEleicao)}
            className={inputClass}
          >
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
      </div>

      {/* Tipo de eleição */}
      <div>
        <label htmlFor="tipo_eleicao" className={labelClass}>
          Tipo de Eleição
        </label>
        <input
          id="tipo_eleicao"
          type="text"
          list="sugestoes-tipo"
          required
          value={form.tipo_eleicao}
          onChange={(e) => atualizarCampo('tipo_eleicao', e.target.value)}
          placeholder="Presidencial"
          className={inputClass}
        />
        <datalist id="sugestoes-tipo">
          {SUGESTOES_TIPO.map((tipo) => (
            <option key={tipo} value={tipo} />
          ))}
        </datalist>
      </div>

      {/* Contexto geopolítico */}
      <div>
        <label htmlFor="contexto_geopolitico" className={labelClass}>
          Contexto Geopolítico
        </label>
        <textarea
          id="contexto_geopolitico"
          rows={4}
          value={form.contexto_geopolitico}
          onChange={(e) => atualizarCampo('contexto_geopolitico', e.target.value)}
          placeholder="Descreva o contexto geopolítico desta eleição..."
          className={`${inputClass} resize-y`}
        />
      </div>

      {/* Impacto no Brasil */}
      <div>
        <label htmlFor="impacto_brasil" className={labelClass}>
          Impacto no Brasil
        </label>
        <textarea
          id="impacto_brasil"
          rows={3}
          value={form.impacto_brasil}
          onChange={(e) => atualizarCampo('impacto_brasil', e.target.value)}
          placeholder="Como esta eleição pode impactar o Brasil?"
          className={`${inputClass} resize-y`}
        />
      </div>

      {/* Candidatos principais */}
      <div>
        <span className={labelClass}>Candidatos Principais</span>
        <div className="space-y-2">
          {form.candidatos_principais.map((candidato, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={candidato.nome}
                onChange={(e) => atualizarCandidato(index, 'nome', e.target.value)}
                placeholder="Nome do candidato"
                aria-label={`Nome do candidato ${index + 1}`}
                className={`${inputClass} flex-1`}
              />
              <input
                type="text"
                value={candidato.partido ?? ''}
                onChange={(e) => atualizarCandidato(index, 'partido', e.target.value)}
                placeholder="Partido"
                aria-label={`Partido do candidato ${index + 1}`}
                className={`${inputClass} w-32`}
              />
              {form.candidatos_principais.length > 1 && (
                <button
                  type="button"
                  onClick={() => removerCandidato(index)}
                  aria-label={`Remover candidato ${index + 1}`}
                  className="rounded p-1.5 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={adicionarCandidato}
          className="mt-2 font-mono text-xs uppercase tracking-[0.14em] text-[#C9B882] transition-colors hover:text-[#E8E4DC]"
        >
          + Adicionar candidato
        </button>
      </div>

      {/* Content slug (opcional) */}
      <div>
        <label htmlFor="content_slug" className={labelClass}>
          Slug da Biblioteca (opcional)
        </label>
        <input
          id="content_slug"
          type="text"
          value={form.content_slug}
          onChange={(e) => atualizarCampo('content_slug', e.target.value)}
          placeholder="eleicoes-eua-2026"
          className={inputClass}
        />
      </div>

      {/* Botões de ação */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={mutacao.isPending}
          className="rounded-full border border-zinc-700 px-5 py-2 font-mono text-xs uppercase tracking-[0.14em] text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={mutacao.isPending}
          className="rounded-full bg-[#C9B882] px-5 py-2 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#0a0a0b] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {mutacao.isPending ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
