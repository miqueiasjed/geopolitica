<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\ReprocessarEditorialJob;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class AdminEventoSemEditorialController extends Controller
{
    private const CACHE_TTL_HORAS = 4;
    private const DELAY_PADRAO_S  = 8;

    public function index(Request $request): JsonResponse
    {
        $tipo    = $request->query('tipo', 'todos');
        $perPage = min((int) $request->query('per_page', 25), 100);

        $query = Event::query()
            ->select(['id', 'titulo', 'fonte', 'publicado_em', 'relevante', 'headline', 'legenda', 'analise_ia', 'resumo'])
            ->where(function ($q) use ($tipo) {
                match ($tipo) {
                    'sem_headline' => $q->whereNull('headline')->orWhereNull('legenda'),
                    'sem_analise'  => $q->whereNull('analise_ia'),
                    'sem_resumo'   => $q->whereNull('resumo'),
                    default        => $q->where(function ($inner) {
                        $inner->whereNull('headline')
                              ->orWhereNull('legenda')
                              ->orWhereNull('analise_ia');
                    }),
                };
            })
            ->orderBy('publicado_em', 'desc');

        $paginado = $query->paginate($perPage);

        $paginado->getCollection()->transform(function (Event $e) {
            return [
                'id'           => $e->id,
                'titulo'       => $e->titulo,
                'fonte'        => $e->fonte,
                'publicado_em' => $e->publicado_em?->toIso8601String(),
                'relevante'    => $e->relevante,
                'tem_headline' => $e->headline !== null,
                'tem_legenda'  => $e->legenda !== null,
                'tem_analise'  => $e->analise_ia !== null,
                'tem_resumo'   => $e->resumo !== null,
            ];
        });

        return response()->json($paginado);
    }

    public function reprocessar(Request $request): JsonResponse
    {
        $request->validate([
            'ids'             => 'required|array|min:1|max:100',
            'ids.*'           => 'integer|exists:events,id',
            'delay_segundos'  => 'integer|min:3|max:60',
        ]);

        $ids           = $request->input('ids');
        $delaySegundos = (int) $request->input('delay_segundos', self::DELAY_PADRAO_S);
        $operacaoId    = Str::uuid()->toString();
        $total         = count($ids);
        $ttl           = now()->addHours(self::CACHE_TTL_HORAS);

        Cache::put("reprocessar_editorial:{$operacaoId}:total",       $total,  $ttl);
        Cache::put("reprocessar_editorial:{$operacaoId}:processados",  0,       $ttl);
        Cache::put("reprocessar_editorial:{$operacaoId}:sucesso",      0,       $ttl);
        Cache::put("reprocessar_editorial:{$operacaoId}:erros_count",  0,       $ttl);
        Cache::put("reprocessar_editorial:{$operacaoId}:erros",        [],      $ttl);

        foreach ($ids as $indice => $id) {
            ReprocessarEditorialJob::dispatch($id, $operacaoId)
                ->delay(now()->addSeconds($indice * $delaySegundos));
        }

        $estimativaMinutos = (int) ceil(($total * $delaySegundos) / 60);

        return response()->json([
            'operacao_id'         => $operacaoId,
            'total'               => $total,
            'estimativa_minutos'  => $estimativaMinutos,
            'delay_segundos'      => $delaySegundos,
        ]);
    }

    public function status(string $operacaoId): JsonResponse
    {
        $total      = (int) Cache::get("reprocessar_editorial:{$operacaoId}:total", 0);
        $processados = (int) Cache::get("reprocessar_editorial:{$operacaoId}:processados", 0);
        $sucesso    = (int) Cache::get("reprocessar_editorial:{$operacaoId}:sucesso", 0);
        $errosCount = (int) Cache::get("reprocessar_editorial:{$operacaoId}:erros_count", 0);
        $erros      = (array) Cache::get("reprocessar_editorial:{$operacaoId}:erros", []);

        if ($total === 0) {
            return response()->json(['message' => 'Operação não encontrada.'], 404);
        }

        $percentual = $total > 0 ? (int) round(($processados / $total) * 100) : 0;
        $concluido  = $processados >= $total;

        return response()->json([
            'total'       => $total,
            'processados' => $processados,
            'sucesso'     => $sucesso,
            'erros_count' => $errosCount,
            'erros'       => $erros,
            'concluido'   => $concluido,
            'percentual'  => $percentual,
        ]);
    }
}
