import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Switch } from '@radix-ui/themes'
import { buscarAutomacoes, definirAutomacao, adminKeys } from '../../services/admin'
import type { Automacao, AutomacoesResponse } from '../../types/automacao'

export function AutomacoesPanel() {
  const queryClient = useQueryClient()
  const [erro, setErro] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: adminKeys.automacoes(),
    queryFn: buscarAutomacoes,
    staleTime: 30_000,
  })

  const mutation = useMutation({
    mutationFn: ({ chave, ativa }: { chave: string; ativa: boolean }) => definirAutomacao(chave, ativa),
    // Atualização otimista: reflete o toggle na hora e desfaz em caso de erro.
    onMutate: async ({ chave, ativa }) => {
      setErro(null)
      await queryClient.cancelQueries({ queryKey: adminKeys.automacoes() })
      const anterior = queryClient.getQueryData<AutomacoesResponse>(adminKeys.automacoes())

      queryClient.setQueryData<AutomacoesResponse>(adminKeys.automacoes(), (atual) => {
        if (!atual) return atual
        const novosGrupos: AutomacoesResponse['data'] = {}
        for (const [grupo, itens] of Object.entries(atual.data)) {
          novosGrupos[grupo] = itens.map((item) => (item.chave === chave ? { ...item, ativa } : item))
        }
        return { ...atual, data: novosGrupos }
      })

      return { anterior }
    },
    onError: (_erro, _vars, context) => {
      if (context?.anterior) {
        queryClient.setQueryData(adminKeys.automacoes(), context.anterior)
      }
      setErro('Não foi possível alterar a automação. Tente novamente.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.automacoes() })
    },
  })

  return (
    <div className="rounded-xl border border-[#1e1e20] bg-[#0d0d0f]">
      <div className="border-b border-[#1e1e20] px-5 py-4">
        <h2 className="text-base font-semibold text-white">Automações</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Ligue ou desligue as rotinas automáticas do sistema. Alterações entram em vigor na próxima execução agendada.
        </p>
      </div>

      {erro && (
        <div className="mx-5 mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {erro}
        </div>
      )}

      {isLoading && (
        <div className="space-y-3 p-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-[#111113]" aria-hidden="true" />
          ))}
        </div>
      )}

      {data && (
        <div className="divide-y divide-[#1e1e20]">
          {Object.entries(data.data).map(([grupo, itens]) => (
            <div key={grupo} className="px-5 py-4">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#C9B882]/70">
                {data.grupos[grupo] ?? grupo}
              </p>
              <div className="space-y-2">
                {itens.map((automacao) => (
                  <LinhaAutomacao
                    key={automacao.chave}
                    automacao={automacao}
                    salvando={mutation.isPending && mutation.variables?.chave === automacao.chave}
                    onToggle={(ativa) => mutation.mutate({ chave: automacao.chave, ativa })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LinhaAutomacao({
  automacao,
  salvando,
  onToggle,
}: {
  automacao: Automacao
  salvando: boolean
  onToggle: (ativa: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-[#1a1a1c] bg-[#111113] px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{automacao.label}</span>
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${automacao.ativa ? 'bg-emerald-400' : 'bg-zinc-600'}`}
            aria-hidden="true"
          />
          <span className={`text-[11px] ${automacao.ativa ? 'text-emerald-400' : 'text-zinc-500'}`}>
            {automacao.ativa ? 'Ligada' : 'Desligada'}
          </span>
        </div>
        {automacao.descricao && (
          <p className="mt-0.5 text-xs text-zinc-500">{automacao.descricao}</p>
        )}
      </div>
      <Switch
        size="2"
        color="grass"
        checked={automacao.ativa}
        disabled={salvando}
        onCheckedChange={onToggle}
        aria-label={`Ligar ou desligar ${automacao.label}`}
      />
    </div>
  )
}
