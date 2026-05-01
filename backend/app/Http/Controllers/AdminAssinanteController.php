<?php

namespace App\Http\Controllers;

use App\Http\Requests\ListarAssinantesRequest;
use App\Services\AdminAssinanteService;
use Illuminate\Http\JsonResponse;

class AdminAssinanteController extends Controller
{
    public function __construct(
        private readonly AdminAssinanteService $adminAssinanteService,
    ) {
    }

    public function index(ListarAssinantesRequest $request): JsonResponse
    {
        return response()->json(
            $this->adminAssinanteService->listar($request->validated())
        );
    }

    public function reenviarBoasVindas(int $id): JsonResponse
    {
        $this->adminAssinanteService->reenviarBoasVindas($id);

        return response()->json(['message' => 'E-mail de boas-vindas reenviado com sucesso.']);
    }
}
