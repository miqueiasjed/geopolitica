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
Responda SOMENTE com um JSON array puro (sem markdown, sem blocos de código), na mesma ordem dos itens recebidos.
Cada item deve ter: relevante (boolean), impact_score (1-10), analise_ia (português, 2 a 3 frases), regiao (string|null), categorias (array).
Se não for relevante, use impact_score 1 e categorias vazias.
PROMPT),

        'chat_sistema' => env('PROMPT_CHAT_SISTEMA', 'Você é um analista geopolítico especializado. Responda em português brasileiro de forma objetiva e fundamentada. Use apenas o contexto fornecido quando relevante.'),

        'detector_sistema' => env('PROMPT_DETECTOR_SISTEMA', <<<'PROMPT'
Você é um analista geopolítico. Para cada evento recebido, identifique se há padrão geopolítico relevante.
Tipos de padrão: military (ação militar/conflito/mobilização), diplomatic (negociação/acordo/ruptura diplomática), supply (crise de abastecimento/commodity/energia).
Retorne SOMENTE um JSON array puro (sem markdown, sem código), usando exatamente estes campos por item:
{"event_id": <id do evento>, "tipo_padrao": "<military|diplomatic|supply>", "nome_sinal": "<nome curto do sinal em português>", "regiao": "<região geográfica>", "peso": <1-5>, "confianca": <0.0-1.0>}
Se um evento não tiver padrão geopolítico relevante, omita-o do array.
PROMPT),

        'convergencia_sistema' => env('PROMPT_CONVERGENCIA_SISTEMA', 'Você é analista geopolítico. Gere uma análise breve sobre convergência de sinais geopolíticos na região indicada. Responda SOMENTE com JSON puro (sem markdown): {"titulo": "...", "analise": "..."}'),

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
