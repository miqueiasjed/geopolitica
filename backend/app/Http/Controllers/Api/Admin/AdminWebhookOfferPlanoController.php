<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\WebhookOfferPlano;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminWebhookOfferPlanoController extends Controller
{
    public function index(): JsonResponse
    {
        $registros = WebhookOfferPlano::orderBy('fonte')->orderBy('descricao')->get()
            ->map(fn (WebhookOfferPlano $r) => [
                'id'        => $r->id,
                'fonte'     => $r->fonte,
                'offer_id'  => $r->offer_id,
                'descricao' => $r->descricao,
                'plano'     => $r->plano,
                'created_at' => $r->created_at?->toIso8601String(),
            ]);

        return response()->json(['data' => $registros]);
    }

    public function store(Request $request): JsonResponse
    {
        $dados = $request->validate([
            'fonte'     => ['required', Rule::in(['hotmart', 'lastlink'])],
            'offer_id'  => [
                'required', 'string', 'max:100',
                Rule::unique('webhook_offer_planos')->where(fn ($q) => $q->where('fonte', $request->fonte)),
            ],
            'descricao' => ['required', 'string', 'max:150'],
            'plano'     => ['required', Rule::in(['essencial', 'pro', 'reservado'])],
        ]);

        $registro = WebhookOfferPlano::create($dados);

        return response()->json(['data' => [
            'id'        => $registro->id,
            'fonte'     => $registro->fonte,
            'offer_id'  => $registro->offer_id,
            'descricao' => $registro->descricao,
            'plano'     => $registro->plano,
            'created_at' => $registro->created_at?->toIso8601String(),
        ]], 201);
    }

    public function destroy(WebhookOfferPlano $webhookOfferPlano): JsonResponse
    {
        $webhookOfferPlano->delete();

        return response()->json(null, 204);
    }
}
