<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AtualizarConfiguracoesRequest;
use App\Services\AlphaVantageService;
use App\Services\ConfiguracaoService;
use App\Services\TelegramService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminConfiguracaoController extends Controller
{
    public function __construct(
        private readonly ConfiguracaoService $service
    ) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'data' => $this->service->todos(),
        ]);
    }

    public function defaults(): JsonResponse
    {
        $chaves = [
            'prompt_analise_sistema'      => 'analise_sistema',
            'prompt_chat_sistema'         => 'chat_sistema',
            'prompt_detector_sistema'     => 'detector_sistema',
            'prompt_convergencia_sistema' => 'convergencia_sistema',
            'prompt_perfil_contexto'      => 'perfil_contexto',
            'prompt_perfil_lideranca'     => 'perfil_lideranca',
            'prompt_editorial_sistema'    => 'editorial_sistema',
        ];

        $defaults = [];
        foreach ($chaves as $chaveConfig => $chaveAi) {
            $defaults[$chaveConfig] = config("ai.prompts.{$chaveAi}");
        }

        $defaults['alerta_threshold_critico']   = (string) config('app.alerta_threshold_critico', 10);
        $defaults['alerta_threshold_alto']      = (string) config('app.alerta_threshold_alto', 7);
        $defaults['convergencia_janela_horas']  = (string) config('app.convergencia_janela_horas', 72);
        $defaults['limite_chat_essencial']      = (string) config('app.limite_chat_essencial', 5);
        $defaults['limite_chat_pro']            = (string) config('app.limite_chat_pro', 20);
        $defaults['indicadores_ordem']          = (string) config('app.indicadores_ordem', 'CL=F, BZ=F, USDBRL=X, NG=F, HG=F, ALI=F, ZW=F, ZC=F, KC=F');

        return response()->json(['data' => $defaults]);
    }

    public function update(AtualizarConfiguracoesRequest $request): JsonResponse
    {
        $this->service->atualizar($request->validated('configuracoes'));

        return response()->json([
            'message' => 'Configurações salvas com sucesso.',
            'data'    => $this->service->todos(),
        ]);
    }

    public function testarMercado(): JsonResponse
    {
        $apiKey = (string) $this->service->obterValor('alpha_vantage_api_key');

        if (empty($apiKey)) {
            return response()->json([
                'ok'       => false,
                'mensagem' => 'API Key não configurada. Salve a chave antes de testar.',
            ], 422);
        }

        $alpha = new AlphaVantageService($apiKey);

        $cotacoes = $alpha->buscarCotacoes(['CL=F', 'BZ=F', 'NG=F', 'HG=F', 'ALI=F', 'ZW=F', 'ZC=F', 'KC=F']);
        $cambio   = $alpha->buscarCambio('USD', 'BRL');

        if (! empty($cambio)) {
            $cotacoes['USDBRL=X'] = $cambio;
        }

        if (empty($cotacoes)) {
            return response()->json([
                'ok'       => false,
                'mensagem' => 'A API retornou vazio. Verifique se a chave é válida e o plano está ativo.',
            ], 422);
        }

        $nomes = [
            'CL=F'    => 'WTI',
            'BZ=F'    => 'Brent',
            'NG=F'    => 'Gás Natural',
            'HG=F'    => 'Cobre',
            'ALI=F'   => 'Alumínio',
            'ZW=F'    => 'Trigo',
            'ZC=F'    => 'Milho',
            'KC=F'    => 'Café',
            'USDBRL=X'=> 'USD/BRL',
        ];

        $resultado = collect($cotacoes)->map(fn ($c, $simbolo) => [
            'simbolo'      => $simbolo,
            'nome'         => $nomes[$simbolo] ?? $simbolo,
            'valor'        => round($c['valor'], 4),
            'variacao_pct' => round($c['variacao_pct'], 4),
        ])->values()->all();

        return response()->json([
            'ok'       => true,
            'cotacoes' => $resultado,
        ]);
    }

    private const CANAIS_TELEGRAM = [
        'feed'      => 'Feed / Geopolítica',
        'war'       => 'Monitor de Guerra',
        'elections' => 'Monitor de Eleições',
    ];

    public function testarTelegram(Request $request, TelegramService $telegram): JsonResponse
    {
        if (empty(config('services.telegram.bot_token'))) {
            return response()->json([
                'ok'       => false,
                'mensagem' => 'TELEGRAM_BOT_TOKEN não configurado no .env. Defina o token do bot antes de testar.',
            ], 422);
        }

        $canalSolicitado = $request->input('canal');
        $canais = $canalSolicitado && isset(self::CANAIS_TELEGRAM[$canalSolicitado])
            ? [$canalSolicitado => self::CANAIS_TELEGRAM[$canalSolicitado]]
            : self::CANAIS_TELEGRAM;

        $texto = "✅ <b>Teste de conexão</b>\n\n"
            . 'Mensagem de teste enviada pelo painel admin do Geopolítica para Investidores. '
            . 'Se você está vendo isto, o canal está configurado corretamente.';

        $resultados = [];
        foreach ($canais as $canal => $label) {
            $chatId = config("services.telegram.channels.$canal");

            if (empty($chatId)) {
                $resultados[] = [
                    'canal'    => $canal,
                    'label'    => $label,
                    'enviado'  => false,
                    'mensagem' => 'Canal não configurado no .env.',
                ];

                continue;
            }

            $enviado = $telegram->enviarParaCanal($canal, $texto);
            $resultados[] = [
                'canal'    => $canal,
                'label'    => $label,
                'enviado'  => $enviado,
                'mensagem' => $enviado ? 'Mensagem enviada.' : 'Falha ao enviar (verifique se o bot é admin do canal).',
            ];
        }

        $algumEnviado = collect($resultados)->contains('enviado', true);

        return response()->json([
            'ok'       => $algumEnviado,
            'mensagem' => $algumEnviado ? null : 'Nenhuma mensagem foi enviada. Verifique os chat_ids e se o bot é administrador dos canais.',
            'canais'   => $resultados,
        ], $algumEnviado ? 200 : 422);
    }
}
