<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TimelineService;
use Illuminate\Http\JsonResponse;

class TimelineDetailController extends Controller
{
    public function __construct(
        private readonly TimelineService $timelineService
    ) {}

    public function show(string $slug): JsonResponse
    {
        $crise = $this->timelineService->buscarCrisePorSlug($slug);

        if (!$crise) {
            return response()->json(['mensagem' => 'Crise não encontrada'], 404);
        }

        return response()->json($crise);
    }
}
