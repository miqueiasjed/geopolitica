import { useMutation } from '@tanstack/react-query'
import api from '../lib/axios'
import type { TestarPromptPayload, TestarPromptResultado } from '../types/ai'

async function postTestarPrompt(payload: TestarPromptPayload): Promise<TestarPromptResultado> {
  const resposta = await api.post<{ data: TestarPromptResultado }>(
    '/admin/ai/testar-prompt',
    payload,
  )
  return resposta.data.data
}

export function useTestarPrompt() {
  return useMutation<TestarPromptResultado, Error, TestarPromptPayload>({
    mutationFn: postTestarPrompt,
  })
}
