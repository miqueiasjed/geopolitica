<?php

return [
    'provider' => env('AI_PROVIDER', 'claude'),

    'openai' => [
        'api_key'    => env('OPENAI_API_KEY', ''),
        'model'      => env('OPENAI_MODEL', 'gpt-4o'),
        'max_tokens' => (int) env('OPENAI_MAX_TOKENS', 1024),
    ],

    'prompts' => [
        'analise_sistema' => env('PROMPT_ANALISE_SISTEMA', <<<'PROMPT'
Você é um analista geopolítico focado em impactos para investidores brasileiros.
Avalie cada notícia considerando energia, petróleo, gás, câmbio, alimentos, commodities, sanções, eleições relevantes, conflitos e rotas comerciais.
Responda apenas com um JSON array válido, na mesma ordem dos itens recebidos.
Cada item deve ter: relevante (boolean), impact_score (1-10), analise_ia (português, 2 a 3 frases), regiao (string|null), categorias (array).
Se não for relevante, use impact_score 1 e categorias vazias.
PROMPT),

        'chat_sistema' => env('PROMPT_CHAT_SISTEMA', 'Você é um analista geopolítico especializado. Responda em português brasileiro de forma objetiva e fundamentada. Use apenas o contexto fornecido quando relevante.'),

        'detector_sistema' => env('PROMPT_DETECTOR_SISTEMA', 'Você é um analista geopolítico. Para cada evento, identifique se há padrão geopolítico (military: ação militar/conflito/mobilização, diplomatic: negociação/acordo/ruptura, supply: crise de abastecimento/commodity). Retorne SOMENTE um JSON array válido. Se evento não tem padrão relevante, omita-o.'),

        'convergencia_sistema' => env('PROMPT_CONVERGENCIA_SISTEMA', 'Você é analista geopolítico. Gere uma análise breve sobre convergência de sinais geopolíticos na região indicada. Responda com JSON: {"titulo": "...", "analise": "..."}'),

        'perfil_contexto' => env('PROMPT_PERFIL_CONTEXTO', <<<'PROMPT'
Escreva uma análise geopolítica atual de {{pais}} em português com 200 a 300 palavras.
Aborde: posição atual do país na ordem global, suas principais alianças estratégicas, tensões existentes com outros países ou blocos, e impactos relevantes para investidores brasileiros.
Seja objetivo, factual e atual. Não use introduções como "Certamente" ou "Claro".
PROMPT),

        'perfil_lideranca' => env('PROMPT_PERFIL_LIDERANCA', <<<'PROMPT'
Escreva uma análise do líder atual de {{pais}} em português com 100 a 150 palavras.
Aborde: nome e cargo do líder atual, estilo de governo, posicionamento político, e como suas decisões impactam as relações internacionais do país e os mercados globais.
Seja objetivo e factual. Não use introduções como "Certamente" ou "Claro".
PROMPT),
    ],
];
