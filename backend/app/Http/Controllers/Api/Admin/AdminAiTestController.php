<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\TestarPromptRequest;
use App\Services\Ai\AiTestService;
use Illuminate\Http\JsonResponse;

class AdminAiTestController extends Controller
{
    public function testar(TestarPromptRequest $request, AiTestService $service): JsonResponse
    {
        $maxTokens = min($request->input('max_tokens', 512), 1024);

        try {
            $resultado = $service->executar(
                $request->input('prompt_sistema'),
                $request->input('mensagem_usuario'),
                $maxTokens
            );

            return response()->json(['data' => $resultado]);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function testarConexao(AiTestService $service): JsonResponse
    {
        try {
            $resultado = $service->executar(
                'Você é um assistente de teste.',
                'Responda apenas com a palavra: OK',
                20,
            );

            return response()->json([
                'ok'         => true,
                'provider'   => $resultado['provider'],
                'modelo'     => $resultado['modelo'],
                'duracao_ms' => $resultado['duracao_ms'],
                'resposta'   => $resultado['resposta'],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'ok'      => false,
                'mensagem' => $e->getMessage(),
            ], 422);
        }
    }
}
