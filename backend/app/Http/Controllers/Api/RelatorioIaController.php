<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RelatorioIaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

class RelatorioIaController extends Controller
{
    public function __construct(private RelatorioIaService $relatorioIaService)
    {
    }

    public function gerar(Request $request): StreamedResponse
    {
        $request->validate([
            'topico' => 'required|string|max:300',
            'escopo' => 'nullable|string|max:500',
        ]);

        return response()->stream(function () use ($request): void {
            try {
                $relatorio = $this->relatorioIaService->gerarComStreaming(
                    usuario:        auth()->user(),
                    topico:         $request->input('topico'),
                    escopo:         $request->input('escopo', ''),
                    aoReceberToken: function (string $token): void {
                        echo 'data: ' . json_encode(['token' => $token]) . "\n\n";
                        ob_flush();
                        flush();
                    },
                );
                echo 'data: ' . json_encode(['done' => true, 'relatorio_id' => $relatorio->id]) . "\n\n";
                ob_flush();
                flush();
            } catch (TooManyRequestsHttpException $e) {
                echo 'data: ' . json_encode(['error' => 'limit_reached', 'mensagem' => 'Limite de relatórios mensais atingido.']) . "\n\n";
                ob_flush();
                flush();
            }
        }, 200, [
            'Content-Type'      => 'text/event-stream',
            'Cache-Control'     => 'no-cache',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    public function historico(Request $request): JsonResponse
    {
        $relatorios = $this->relatorioIaService->listarRelatorios(auth()->id());

        $dados = $relatorios->map(fn ($r) => [
            'id'         => $r->id,
            'title'      => $r->title,
            'topic'      => $r->topic,
            'word_count' => $r->word_count,
            'status'     => $r->status,
            'created_at' => $r->created_at,
        ]);

        return response()->json(['data' => $dados]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $relatorio = $this->relatorioIaService->buscarRelatorio($id, auth()->id());

        return response()->json(['data' => $relatorio]);
    }
}
