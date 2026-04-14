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
}
