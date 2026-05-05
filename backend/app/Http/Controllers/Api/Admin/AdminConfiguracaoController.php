<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AtualizarConfiguracoesRequest;
use App\Services\AlphaVantageService;
use App\Services\ConfiguracaoService;
use Illuminate\Http\JsonResponse;

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

    public function testarMercado(AlphaVantageService $alpha): JsonResponse
    {
        $apiKey = config('services.alphavantage.api_key', '');

        if (empty($apiKey)) {
            return response()->json([
                'ok'       => false,
                'mensagem' => 'API Key não configurada. Salve a chave antes de testar.',
            ], 422);
        }

        $cotacoes = $alpha->buscarCotacoes(['BZ=F', 'NG=F', 'ZS=F', 'ZW=F']);
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
            'BZ=F'    => 'Brent',
            'NG=F'    => 'Gás Natural',
            'ZS=F'    => 'Soja',
            'ZW=F'    => 'Trigo',
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
}
