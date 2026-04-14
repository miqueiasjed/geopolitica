<?php

namespace App\Http\Controllers;

use App\Http\Requests\ListarWebhookEventosRequest;
use App\Services\AdminWebhookEventoService;
use Illuminate\Http\JsonResponse;

class AdminWebhookController extends Controller
{
    public function __construct(
        private readonly AdminWebhookEventoService $adminWebhookEventoService,
    ) {
    }

    public function index(ListarWebhookEventosRequest $request): JsonResponse
    {
        return response()->json(
            $this->adminWebhookEventoService->listar($request->validated())
        );
    }
}
