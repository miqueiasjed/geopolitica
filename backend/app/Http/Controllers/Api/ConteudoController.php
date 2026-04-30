<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ConteudoResource;
use App\Services\ConteudoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConteudoController extends Controller
{
    public function __construct(
        private readonly ConteudoService $conteudoService,
    ) {
    }

    public function show(Request $request, string $slug): JsonResponse
    {
        $conteudo = $this->conteudoService->buscarPorSlug($slug, $request->user());

        if ($conteudo === null) {
            abort(404);
        }

        return response()->json(new ConteudoResource($conteudo));
    }
}
