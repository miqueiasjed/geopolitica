<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AiLog;
use Illuminate\Http\JsonResponse;

class AdminAiUsoController extends Controller
{
    public function index(): JsonResponse
    {
        $agora      = now()->timezone('America/Sao_Paulo');
        $inicioDia  = $agora->copy()->startOfDay();
        $inicioMes  = $agora->copy()->startOfMonth();
        $inicio7Dias = $agora->copy()->subDays(6)->startOfDay();

        $hoje = AiLog::where('created_at', '>=', $inicioDia)
            ->selectRaw('COUNT(*) as chamadas, SUM(tokens_entrada) as tokens_entrada, SUM(tokens_saida) as tokens_saida, SUM(custo_estimado_usd) as custo_estimado_usd, AVG(duracao_ms) as duracao_media_ms')
            ->first();

        $mes = AiLog::where('created_at', '>=', $inicioMes)
            ->selectRaw('COUNT(*) as chamadas, SUM(tokens_entrada) as tokens_entrada, SUM(tokens_saida) as tokens_saida, SUM(custo_estimado_usd) as custo_estimado_usd, AVG(duracao_ms) as duracao_media_ms')
            ->first();

        $historico = AiLog::where('created_at', '>=', $inicio7Dias)
            ->selectRaw("DATE(CONVERT_TZ(created_at, '+00:00', '-03:00')) as data, COUNT(*) as chamadas, SUM(custo_estimado_usd) as custo_estimado_usd")
            ->groupBy('data')
            ->orderBy('data')
            ->get();

        $porServico = AiLog::where('created_at', '>=', $inicioMes)
            ->selectRaw('servico, COUNT(*) as chamadas, SUM(custo_estimado_usd) as custo_estimado_usd')
            ->groupBy('servico')
            ->orderByDesc('chamadas')
            ->get();

        return response()->json(['data' => [
            'hoje'                 => $this->formatarResumo($hoje),
            'mes'                  => $this->formatarResumo($mes),
            'historico_7_dias'     => $historico,
            'por_servico'          => $porServico,
            'provider_ativo'       => config('ai.provider', 'claude'),
            'modelo_ativo'         => $this->getModeloAtivo(),
            'threshold_alerta_usd' => (float) config('ai.threshold_alerta_usd', 10.0),
        ]]);
    }

    private function formatarResumo(?object $resumo): array
    {
        return [
            'chamadas'           => (int) ($resumo->chamadas ?? 0),
            'tokens_entrada'     => (int) ($resumo->tokens_entrada ?? 0),
            'tokens_saida'       => (int) ($resumo->tokens_saida ?? 0),
            'custo_estimado_usd' => round((float) ($resumo->custo_estimado_usd ?? 0), 6),
            'duracao_media_ms'   => round((float) ($resumo->duracao_media_ms ?? 0), 2),
        ];
    }

    private function getModeloAtivo(): string
    {
        $provider = config('ai.provider', 'claude');

        if ($provider === 'openai') {
            return (string) config('ai.openai.model', 'gpt-4o');
        }

        return (string) config('claude.model', 'claude-sonnet-4-6');
    }
}
