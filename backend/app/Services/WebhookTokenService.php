<?php

namespace App\Services;

use App\Models\WebhookToken;
use Illuminate\Support\Facades\Crypt;

class WebhookTokenService
{
    public function validar(string $fonte, ?string $tokenRecebido): bool
    {
        if (! $tokenRecebido) {
            return false;
        }

        return WebhookToken::where('fonte', $fonte)
            ->where('ativo', true)
            ->get()
            ->contains(fn (WebhookToken $t) => Crypt::decryptString($t->getRawOriginal('token')) === $tokenRecebido);
    }
}
