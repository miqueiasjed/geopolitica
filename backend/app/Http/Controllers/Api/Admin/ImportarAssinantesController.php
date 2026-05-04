<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ImportarAssinantesRequest;
use App\Services\ImportacaoAssinantesService;
use Illuminate\Http\JsonResponse;

class ImportarAssinantesController extends Controller
{
    public function __construct(
        private readonly ImportacaoAssinantesService $importacaoAssinantesService,
    ) {}

    public function store(ImportarAssinantesRequest $request): JsonResponse
    {
        $resultado = $this->importacaoAssinantesService->enfileirar($request->validated());

        return response()->json($resultado, 202);
    }

    public function status(string $id): JsonResponse
    {
        $status = $this->importacaoAssinantesService->status($id);

        if (! $status) {
            return response()->json(['message' => 'Importação não encontrada.'], 404);
        }

        return response()->json($status);
    }
}
