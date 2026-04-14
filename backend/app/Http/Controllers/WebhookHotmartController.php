<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReceberWebhookHotmartRequest;
use App\Services\HotmartHandlerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class WebhookHotmartController extends Controller
{
    public function __construct(
        private readonly HotmartHandlerService $hotmartHandlerService,
    ) {
    }

    public function receber(ReceberWebhookHotmartRequest $request): JsonResponse
    {
        $payload = $request->validated() + $request->all();
        $evento = $this->hotmartHandlerService->registrarEvento($payload);

        if ($request->header('x-hotmart-webhook-token') !== config('services.hotmart.webhook_token')) {
            $evento->forceFill([
                'erro' => 'Token de webhook invalido.',
            ])->save();

            Log::warning('Tentativa de webhook Hotmart com token invalido.', [
                'evento_id' => $evento->id,
                'event_type' => $evento->event_type,
            ]);

            return response()->json(['received' => true]);
        }

        $this->hotmartHandlerService->handle($evento);

        return response()->json(['received' => true]);
    }
}
