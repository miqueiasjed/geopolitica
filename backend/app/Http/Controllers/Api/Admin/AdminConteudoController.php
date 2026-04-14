<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AtualizarConteudoRequest;
use App\Http\Requests\CriarConteudoRequest;
use App\Http\Resources\ConteudoResource;
use App\Models\Conteudo;
use App\Services\ConteudoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminConteudoController extends Controller
{
    public function __construct(
        private readonly ConteudoService $conteudoService,
    ) {
        $this->middleware(['auth:sanctum', 'role:admin']);
    }

    public function index(Request $request): JsonResponse
    {
        $conteudos = Conteudo::query()
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json(ConteudoResource::collection($conteudos));
    }

    public function store(CriarConteudoRequest $request): JsonResponse
    {
        $conteudo = $this->conteudoService->criar($request->validated());

        return response()->json(new ConteudoResource($conteudo), 201);
    }

    public function update(AtualizarConteudoRequest $request, Conteudo $conteudo): JsonResponse
    {
        $conteudo = $this->conteudoService->atualizar($conteudo, $request->validated());

        return response()->json(new ConteudoResource($conteudo));
    }

    public function destroy(Conteudo $conteudo): JsonResponse
    {
        $this->conteudoService->despublicar($conteudo);

        return response()->json(['message' => 'Conteúdo despublicado com sucesso']);
    }
}
