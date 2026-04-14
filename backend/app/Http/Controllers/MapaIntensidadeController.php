<?php

namespace App\Http\Controllers;

use App\Services\MapaIntensidadeService;
use Illuminate\Http\JsonResponse;

class MapaIntensidadeController extends Controller
{
    public function __construct(
        private readonly MapaIntensidadeService $mapaIntensidadeService
    ) {}

    public function index(): JsonResponse
    {
        $dados = $this->mapaIntensidadeService->obter();

        return response()
            ->json($dados)
            ->header('Cache-Control', 'public, max-age=900');
    }
}
