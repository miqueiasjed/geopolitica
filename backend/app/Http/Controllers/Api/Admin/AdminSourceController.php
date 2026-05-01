<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AtualizarSourceRequest;
use App\Http\Requests\Admin\CriarSourceRequest;
use App\Models\Source;
use App\Services\SourceService;
use Illuminate\Http\JsonResponse;

class AdminSourceController extends Controller
{
    public function __construct(
        private readonly SourceService $sourceService,
    ) {}

    public function index(): JsonResponse
    {
        return response()->json(['data' => $this->sourceService->listar()]);
    }

    public function store(CriarSourceRequest $request): JsonResponse
    {
        $source = $this->sourceService->criar($request->validated());

        return response()->json(['data' => $source], 201);
    }

    public function update(AtualizarSourceRequest $request, Source $source): JsonResponse
    {
        $source = $this->sourceService->atualizar($source, $request->validated());

        return response()->json(['data' => $source]);
    }

    public function destroy(Source $source): JsonResponse
    {
        $this->sourceService->excluir($source);

        return response()->json(null, 204);
    }
}
