<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\AutomacaoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAutomacaoController extends Controller
{
    public function __construct(
        private readonly AutomacaoService $service
    ) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'data'   => $this->service->todas(),
            'grupos' => AutomacaoService::GRUPOS,
        ]);
    }

    public function update(Request $request, string $chave): JsonResponse
    {
        $validado = $request->validate([
            'ativa' => ['required', 'boolean'],
        ]);

        $automacao = $this->service->definir($chave, $validado['ativa']);

        return response()->json([
            'message' => $automacao->ativa
                ? "Automação \"{$automacao->label}\" ligada."
                : "Automação \"{$automacao->label}\" desligada.",
            'data' => [
                'chave' => $automacao->chave,
                'ativa' => $automacao->ativa,
            ],
        ]);
    }
}
