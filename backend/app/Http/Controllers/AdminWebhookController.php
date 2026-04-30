<?php

namespace App\Http\Controllers;

use App\Http\Requests\ListarWebhookEventosRequest;
use App\Models\WebhookEvento;
use App\Services\AdminWebhookEventoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

    public function destroyBulk(Request $request): JsonResponse
    {
        $ids = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer'],
        ])['ids'];

        $deletados = WebhookEvento::whereIn('id', $ids)->delete();

        return response()->json(['deleted' => $deletados]);
    }
}
