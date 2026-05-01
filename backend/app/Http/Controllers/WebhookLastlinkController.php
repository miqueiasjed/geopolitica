<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReceberWebhookLastlinkRequest;
use App\Services\LastlinkHandlerService;
use App\Services\WebhookTokenService;
use Illuminate\Http\JsonResponse;

class WebhookLastlinkController extends Controller
{
    public function __construct(
        private readonly LastlinkHandlerService $lastlinkHandlerService,
        private readonly WebhookTokenService $webhookTokenService,
    ) {
    }

    public function receber(ReceberWebhookLastlinkRequest $request): JsonResponse
    {
        $payload = array_merge($request->validated(), $request->all());

        if ($this->lastlinkHandlerService->deveIgnorar($payload)) {
            return response()->json(['received' => true]);
        }

        $evento = $this->lastlinkHandlerService->registrarEvento($payload);

        if (! $this->webhookTokenService->validar('lastlink', $request->header('x-lastlink-token'))) {
            $evento->update(['erro' => 'token inválido']);

            return response()->json(['received' => true]);
        }

        $this->lastlinkHandlerService->handle($evento);

        return response()->json(['received' => true]);
    }
}
