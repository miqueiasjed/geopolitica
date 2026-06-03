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
    }

    public function index(Request $request): JsonResponse
    {
        $query = Conteudo::query()->orderByDesc('created_at');

        if ($tipo = $request->string('tipo')->toString()) {
            $query->where('tipo', $tipo);
        }

        if ($status = $request->string('status')->toString()) {
            $query->where('publicado', $status === 'publicado');
        }

        if ($q = $request->string('q')->toString()) {
            $query->where('titulo', 'like', "%{$q}%");
        }

        $conteudos = $query->paginate(20);

        return response()->json([
            'data'         => ConteudoResource::collection($conteudos->items()),
            'total'        => $conteudos->total(),
            'per_page'     => $conteudos->perPage(),
            'current_page' => $conteudos->currentPage(),
            'last_page'    => $conteudos->lastPage(),
        ]);
    }

    public function show(Conteudo $conteudo): JsonResponse
    {
        return response()->json(new ConteudoResource($conteudo));
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

    public function excluir(Conteudo $conteudo): JsonResponse
    {
        if ($conteudo->publicado) {
            return response()->json(['message' => 'Apenas rascunhos podem ser excluídos permanentemente.'], 422);
        }

        $conteudo->delete();

        return response()->json(['message' => 'Conteúdo excluído permanentemente.']);
    }
}
