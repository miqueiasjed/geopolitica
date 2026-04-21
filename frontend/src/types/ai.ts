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

export interface AiUsoResumo {
  chamadas: number;
  tokens_entrada: number;
  tokens_saida: number;
  custo_estimado_usd: number;
  duracao_media_ms: number;
}

export interface AiUsoHistoricoDia {
  data: string; // 'YYYY-MM-DD'
  chamadas: number;
  custo_estimado_usd: number;
}

export interface AiUsoServico {
  servico: string;
  chamadas: number;
  custo_estimado_usd: number;
}

export interface AiUsoData {
  hoje: AiUsoResumo;
  mes: AiUsoResumo;
  historico_7_dias: AiUsoHistoricoDia[];
  por_servico: AiUsoServico[];
  provider_ativo: string;
  modelo_ativo: string;
  threshold_alerta_usd: number;
}
