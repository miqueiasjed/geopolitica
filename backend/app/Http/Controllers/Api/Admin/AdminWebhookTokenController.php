<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\WebhookToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Validation\Rule;

class AdminWebhookTokenController extends Controller
{
    public function index(): JsonResponse
    {
        $tokens = WebhookToken::orderBy('fonte')->orderBy('descricao')->get()
            ->map(fn (WebhookToken $t) => $this->formatar($t));

        return response()->json(['data' => $tokens]);
    }

    public function store(Request $request): JsonResponse
    {
        $dados = $request->validate([
            'fonte'     => ['required', Rule::in(['hotmart', 'lastlink'])],
            'descricao' => ['required', 'string', 'max:100'],
            'token'     => ['required', 'string', 'min:6'],
        ]);

        $token = WebhookToken::create($dados);

        return response()->json(['data' => $this->formatar($token)], 201);
    }

    public function toggle(WebhookToken $webhookToken): JsonResponse
    {
        $webhookToken->update(['ativo' => ! $webhookToken->ativo]);

        return response()->json(['data' => $this->formatar($webhookToken->fresh())]);
    }

    public function destroy(WebhookToken $webhookToken): JsonResponse
    {
        $webhookToken->delete();

        return response()->json(null, 204);
    }

    private function formatar(WebhookToken $t): array
    {
        try {
            $plain = Crypt::decryptString($t->getRawOriginal('token'));
            $mascarado = $this->mascarar($plain);
        } catch (\Throwable) {
            $mascarado = '***';
        }

        return [
            'id'        => $t->id,
            'fonte'     => $t->fonte,
            'descricao' => $t->descricao,
            'token'     => $mascarado,
            'ativo'     => $t->ativo,
            'created_at' => $t->created_at?->toIso8601String(),
        ];
    }

    private function mascarar(string $token): string
    {
        $len = mb_strlen($token);

        if ($len <= 8) {
            return str_repeat('*', $len);
        }

        return mb_substr($token, 0, 4) . str_repeat('*', $len - 8) . mb_substr($token, -4);
    }
}
