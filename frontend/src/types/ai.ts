export interface TestarPromptPayload {
  prompt_sistema: string;
  mensagem_usuario: string;
  max_tokens?: number;
}

export interface TestarPromptResultado {
  resposta: string;
  provider: string;
  modelo: string;
  duracao_ms: number;
  tokens_estimados_entrada: number;
  tokens_estimados_saida: number;
}
