<?php

namespace App\Services;

use App\Models\Configuracao;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;

class ConfiguracaoService
{
    private const CACHE_KEY = 'configuracoes:todas';
    private const CACHE_TTL = 3600; // 1 hora

    /**
     * Mapeamento chave_db → caminho Laravel config.
     */
    private const MAPA_CONFIG = [
        // Claude
        'claude_api_key'              => 'claude.api_key',
        'claude_model'                => 'claude.model',
        'claude_max_tokens'           => 'claude.max_tokens',
        // IA Provider / OpenAI
        'ia_provider'                 => 'ai.provider',
        'openai_api_key'              => 'ai.openai.api_key',
        'openai_model'                => 'ai.openai.model',
        'openai_max_tokens'           => 'ai.openai.max_tokens',
        // Prompts
        'prompt_analise_sistema'      => 'ai.prompts.analise_sistema',
        'prompt_chat_sistema'         => 'ai.prompts.chat_sistema',
        'prompt_detector_sistema'     => 'ai.prompts.detector_sistema',
        'prompt_convergencia_sistema' => 'ai.prompts.convergencia_sistema',
        'prompt_perfil_contexto'      => 'ai.prompts.perfil_contexto',
        'prompt_perfil_lideranca'     => 'ai.prompts.perfil_lideranca',
        'prompt_editorial_sistema'    => 'ai.prompts.editorial_sistema',
        // E-mail
        'resend_api_key'              => 'services.resend.key',
        'resend_from_email'           => 'mail.from.address',
        // Pagamentos
        'hotmart_webhook_token'       => 'services.hotmart.webhook_token',
        // Segurança
        'cron_secret'                 => 'app.cron_secret',
        // Geral
        'frontend_url'                => 'app.frontend_url',
        // Alertas
        'alerta_threshold_critico'    => 'app.alerta_threshold_critico',
        'alerta_threshold_alto'       => 'app.alerta_threshold_alto',
        'convergencia_janela_horas'   => 'app.convergencia_janela_horas',
        'limite_chat_essencial'       => 'app.limite_chat_essencial',
        'limite_chat_pro'             => 'app.limite_chat_pro',
    ];

    /**
     * Carrega os valores do banco no config do Laravel.
     * Chamado pelo service provider na inicialização.
     */
    public function carregarNoConfig(): void
    {
        $registros = Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            return Configuracao::all()->keyBy('chave');
        });

        foreach (self::MAPA_CONFIG as $chave => $configPath) {
            $registro = $registros->get($chave);

            if (! $registro || $registro->valor === null) {
                continue;
            }

            $valor = $registro->valor_decriptado;

            if ($valor === null) {
                continue;
            }

            // Converte para int se o tipo for numero
            if ($registro->tipo === 'numero') {
                $valor = (int) $valor;
            }

            Config::set($configPath, $valor);
        }
    }

    /**
     * Retorna todas as configurações agrupadas, com valores sensíveis mascarados.
     *
     * @return array<string, array<int, array<string, mixed>>>
     */
    public function todos(): array
    {
        $registros = Configuracao::all()->keyBy('chave');
        $grupos = [];

        foreach ($this->definicoes() as $definicao) {
            $chave = $definicao['chave'];
            $registro = $registros->get($chave);

            $configurado = $registro && $registro->valor !== null;

            $item = [
                'chave'      => $chave,
                'label'      => $definicao['label'],
                'descricao'  => $definicao['descricao'] ?? null,
                'grupo'      => $definicao['grupo'],
                'tipo'       => $definicao['tipo'],
                'opcoes'     => $definicao['opcoes'] ?? null,
                'sensivel'   => $definicao['sensivel'],
                'configurado'=> $configurado,
                // Nunca retorna o valor real de campos sensíveis
                'valor'      => $definicao['sensivel'] ? null : ($registro?->valor),
            ];

            // Metadados estáticos exclusivos do grupo prompts
            if ($definicao['grupo'] === 'prompts') {
                $item['tela']     = $definicao['tela'];
                $item['trigger']  = $definicao['trigger'];
                $item['saida']    = $definicao['saida'];
                $item['variaveis']= $definicao['variaveis'];
            }

            $grupos[$definicao['grupo']][] = $item;
        }

        return $grupos;
    }

    /**
     * Atualiza um conjunto de configurações.
     *
     * @param array<string, string|null> $dados
     */
    public function atualizar(array $dados): void
    {
        $definicoes = collect($this->definicoes())->keyBy('chave');

        foreach ($dados as $chave => $valor) {
            if (! $definicoes->has($chave)) {
                continue;
            }

            // Para campos sensíveis, ignorar se o valor estiver vazio
            $def = $definicoes->get($chave);
            if ($def['sensivel'] && ($valor === null || trim((string) $valor) === '')) {
                continue;
            }

            if ($valor === null || trim((string) $valor) === '') {
                // Limpa o valor
                Configuracao::updateOrCreate(
                    ['chave' => $chave],
                    [
                        'valor'     => null,
                        'grupo'     => $def['grupo'],
                        'label'     => $def['label'],
                        'descricao' => $def['descricao'] ?? null,
                        'tipo'      => $def['tipo'],
                        'sensivel'  => $def['sensivel'],
                    ]
                );
            } else {
                $registro = Configuracao::firstOrNew(['chave' => $chave]);
                $registro->grupo     = $def['grupo'];
                $registro->label     = $def['label'];
                $registro->descricao = $def['descricao'] ?? null;
                $registro->tipo      = $def['tipo'];
                $registro->sensivel  = $def['sensivel'];
                $registro->save();
                $registro->setValor(trim((string) $valor));
            }
        }

        Cache::forget(self::CACHE_KEY);
    }

    /**
     * Definições estáticas de todas as configurações suportadas.
     *
     * @return array<int, array<string, mixed>>
     */
    public function definicoes(): array
    {
        return [
            // ── IA / Provedor ─────────────────────────────────────────────
            [
                'chave'    => 'ia_provider',
                'label'    => 'Provedor de IA',
                'descricao'=> 'Provedor ativo para todas as análises e o chat',
                'grupo'    => 'ia',
                'tipo'     => 'select',
                'opcoes'   => ['claude', 'openai'],
                'sensivel' => false,
            ],
            // ── IA / Claude ──────────────────────────────────────────────
            [
                'chave'    => 'claude_api_key',
                'label'    => 'Claude — API Key',
                'descricao'=> 'Chave da API da Anthropic (começa com sk-ant-)',
                'grupo'    => 'ia',
                'tipo'     => 'senha',
                'sensivel' => true,
            ],
            [
                'chave'    => 'claude_model',
                'label'    => 'Claude — Modelo',
                'descricao'=> 'Modelo padrão (ex: claude-sonnet-4-6)',
                'grupo'    => 'ia',
                'tipo'     => 'texto',
                'sensivel' => false,
            ],
            [
                'chave'    => 'claude_max_tokens',
                'label'    => 'Claude — Máx. Tokens',
                'descricao'=> 'Limite de tokens por resposta',
                'grupo'    => 'ia',
                'tipo'     => 'numero',
                'sensivel' => false,
            ],
            // ── IA / OpenAI ───────────────────────────────────────────────
            [
                'chave'    => 'openai_api_key',
                'label'    => 'OpenAI — API Key',
                'descricao'=> 'Chave da API da OpenAI (começa com sk-)',
                'grupo'    => 'ia',
                'tipo'     => 'senha',
                'sensivel' => true,
            ],
            [
                'chave'    => 'openai_model',
                'label'    => 'OpenAI — Modelo',
                'descricao'=> 'Modelo padrão (ex: gpt-4o, gpt-4o-mini)',
                'grupo'    => 'ia',
                'tipo'     => 'texto',
                'sensivel' => false,
            ],
            [
                'chave'    => 'openai_max_tokens',
                'label'    => 'OpenAI — Máx. Tokens',
                'descricao'=> 'Limite de tokens por resposta',
                'grupo'    => 'ia',
                'tipo'     => 'numero',
                'sensivel' => false,
            ],
            // ── E-mail / Resend ───────────────────────────────────────────
            [
                'chave'    => 'resend_api_key',
                'label'    => 'Resend API Key',
                'descricao'=> 'Chave da API do Resend para envio de e-mails',
                'grupo'    => 'email',
                'tipo'     => 'senha',
                'sensivel' => true,
            ],
            [
                'chave'    => 'resend_from_email',
                'label'    => 'E-mail de Envio (From)',
                'descricao'=> 'Endereço remetente para alertas e convites',
                'grupo'    => 'email',
                'tipo'     => 'texto',
                'sensivel' => false,
            ],
            // ── Pagamentos / Hotmart ──────────────────────────────────────
            [
                'chave'    => 'hotmart_webhook_token',
                'label'    => 'Hotmart Webhook Token',
                'descricao'=> 'Token secreto para validar webhooks da Hotmart',
                'grupo'    => 'pagamentos',
                'tipo'     => 'senha',
                'sensivel' => true,
            ],
            // ── Segurança ─────────────────────────────────────────────────
            [
                'chave'    => 'cron_secret',
                'label'    => 'Cron Secret',
                'descricao'=> 'Segredo para autenticar endpoints de cron jobs externos',
                'grupo'    => 'seguranca',
                'tipo'     => 'senha',
                'sensivel' => true,
            ],
            // ── Geral ─────────────────────────────────────────────────────
            [
                'chave'    => 'frontend_url',
                'label'    => 'URL do Frontend',
                'descricao'=> 'URL base do frontend (usado em links de e-mail)',
                'grupo'    => 'geral',
                'tipo'     => 'texto',
                'sensivel' => false,
            ],
            // ── Alertas / Thresholds ──────────────────────────────────────
            [
                'chave'    => 'alerta_threshold_critico',
                'label'    => 'Threshold Crítico',
                'descricao'=> 'Score mínimo para classificar sinal como crítico (0–10)',
                'grupo'    => 'alertas',
                'tipo'     => 'numero',
                'sensivel' => false,
            ],
            [
                'chave'    => 'alerta_threshold_alto',
                'label'    => 'Threshold Alto',
                'descricao'=> 'Score mínimo para classificar sinal como alto (0–10)',
                'grupo'    => 'alertas',
                'tipo'     => 'numero',
                'sensivel' => false,
            ],
            [
                'chave'    => 'convergencia_janela_horas',
                'label'    => 'Janela de Convergência (horas)',
                'descricao'=> 'Período analisado para detectar convergência de sinais',
                'grupo'    => 'alertas',
                'tipo'     => 'numero',
                'sensivel' => false,
            ],
            [
                'chave'    => 'limite_chat_essencial',
                'label'    => 'Limite Chat — Essencial',
                'descricao'=> 'Perguntas por dia no plano Essencial',
                'grupo'    => 'alertas',
                'tipo'     => 'numero',
                'sensivel' => false,
            ],
            [
                'chave'    => 'limite_chat_pro',
                'label'    => 'Limite Chat — Pro',
                'descricao'=> 'Perguntas por dia no plano Pro',
                'grupo'    => 'alertas',
                'tipo'     => 'numero',
                'sensivel' => false,
            ],
            // ── Prompts de IA ─────────────────────────────────────────────
            [
                'chave'    => 'prompt_analise_sistema',
                'label'    => 'Análise de Feed',
                'descricao'=> 'Analisa notícias e classifica impacto (1–10). Deve retornar um JSON array.',
                'grupo'    => 'prompts',
                'tipo'     => 'textarea',
                'sensivel' => false,
                'tela'     => 'Timeline / Feed de Tensões',
                'trigger'  => 'Cron de ingestão de feed',
                'saida'    => 'JSON array',
                'variaveis'=> [],
            ],
            [
                'chave'    => 'prompt_chat_sistema',
                'label'    => 'Chat / Briefings',
                'descricao'=> 'Prompt base do analista no chat. O contexto recuperado é anexado automaticamente.',
                'grupo'    => 'prompts',
                'tipo'     => 'textarea',
                'sensivel' => false,
                'tela'     => 'Chat com os Briefings',
                'trigger'  => 'Ação do usuário (pergunta)',
                'saida'    => 'Texto livre (streaming)',
                'variaveis'=> [],
            ],
            [
                'chave'    => 'prompt_detector_sistema',
                'label'    => 'Detector de Sinais',
                'descricao'=> 'Identifica padrões em eventos (military, diplomatic, supply). Deve retornar um JSON array.',
                'grupo'    => 'prompts',
                'tipo'     => 'textarea',
                'sensivel' => false,
                'tela'     => 'Alertas Preditivos (background)',
                'trigger'  => 'Cron de detecção de sinais',
                'saida'    => 'JSON array',
                'variaveis'=> [],
            ],
            [
                'chave'    => 'prompt_convergencia_sistema',
                'label'    => 'Convergência de Sinais',
                'descricao'=> 'Gera análise de convergência por região. Deve retornar JSON: {"titulo": "...", "analise": "..."}',
                'grupo'    => 'prompts',
                'tipo'     => 'textarea',
                'sensivel' => false,
                'tela'     => 'Alertas Preditivos (card de alerta)',
                'trigger'  => 'Cron de convergência',
                'saida'    => 'JSON {titulo, analise}',
                'variaveis'=> [],
            ],
            [
                'chave'    => 'prompt_perfil_contexto',
                'label'    => 'Perfil do País — Contexto Geopolítico',
                'descricao'=> 'Análise geopolítica do país. Use {{pais}} onde o nome do país deve aparecer.',
                'grupo'    => 'prompts',
                'tipo'     => 'textarea',
                'sensivel' => false,
                'tela'     => 'Perfil de País (aba Contexto)',
                'trigger'  => 'Ação admin (gerar perfil)',
                'saida'    => 'Texto livre',
                'variaveis'=> ['{{pais}}'],
            ],
            [
                'chave'    => 'prompt_perfil_lideranca',
                'label'    => 'Perfil do País — Análise de Liderança',
                'descricao'=> 'Análise do líder atual do país. Use {{pais}} onde o nome do país deve aparecer.',
                'grupo'    => 'prompts',
                'tipo'     => 'textarea',
                'sensivel' => false,
                'tela'     => 'Perfil de País (aba Liderança)',
                'trigger'  => 'Ação admin (gerar perfil)',
                'saida'    => 'Texto livre',
                'variaveis'=> ['{{pais}}'],
            ],
            [
                'chave'    => 'prompt_editorial_sistema',
                'label'    => 'Editorial — @danuzioneto',
                'descricao'=> 'Prompt para geração de HEADLINE + LEGENDA no padrão editorial da página. Sem variáveis — o evento é enviado como mensagem do usuário.',
                'grupo'    => 'prompts',
                'tipo'     => 'textarea',
                'sensivel' => false,
                'tela'     => 'Feed de Tensões (detalhe do evento)',
                'trigger'  => 'Ação do usuário (gerar editorial)',
                'saida'    => 'Texto: HEADLINE + LEGENDA',
                'variaveis'=> [],
            ],
        ];
    }
}
