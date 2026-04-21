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
}
