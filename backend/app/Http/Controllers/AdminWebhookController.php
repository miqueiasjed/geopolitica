<?php

namespace App\Http\Controllers;

use App\Http\Requests\ExcluirWebhooksBulkRequest;
use App\Http\Requests\ListarWebhookEventosRequest;
use App\Models\WebhookEvento;
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

    public function destroyBulk(ExcluirWebhooksBulkRequest $request): JsonResponse
    {
        $deletados = $this->adminWebhookEventoService->excluirEmLote($request->validated('ids'));

        return response()->json(['deleted' => $deletados]);
    }

    public function reprocessar(WebhookEvento $webhookEvento): JsonResponse
    {
        $this->adminWebhookEventoService->reprocessar($webhookEvento);

        return response()->json(['success' => true]);
    }
}
