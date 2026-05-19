<?php

namespace App\Services;

use App\Models\Assinante;
use App\Models\AssinanteAddon;
use App\Models\Produto;
use App\Models\WebhookOfferPlano;

class AddonService
{
    public function ativar(
        int $userId,
        string $addonKey,
        string $fonte,
        ?string $orderId = null,
        ?string $productId = null,
    ): void {
        $assinante = Assinante::query()->where('user_id', $userId)->firstOrFail();

        $addonsAtuais = $assinante->addons ?? [];

        if (! in_array($addonKey, $addonsAtuais, true)) {
            $addonsAtuais[] = $addonKey;
            $assinante->forceFill(['addons' => $addonsAtuais])->save();
        }

        AssinanteAddon::query()->create([
            'user_id'     => $userId,
            'addon_key'   => $addonKey,
            'status'      => 'ativo',
            'fonte'       => $fonte,
            'order_id'    => $orderId,
            'product_id'  => $productId,
            'iniciado_em' => now(),
        ]);
    }

    public function cancelar(int $userId, string $addonKey, string $motivo): void
    {
        $assinante = Assinante::query()->where('user_id', $userId)->firstOrFail();

        $addonsAtuais = $assinante->addons ?? [];

        if (in_array($addonKey, $addonsAtuais, true)) {
            $assinante->forceFill([
                'addons' => array_values(array_filter(
                    $addonsAtuais,
                    fn (string $key) => $key !== $addonKey,
                )),
            ])->save();
        }

        AssinanteAddon::query()
            ->where('user_id', $userId)
            ->where('addon_key', $addonKey)
            ->where('status', 'ativo')
            ->update(['status' => $motivo]);
    }

    public static function resolverAddonKey(string $productId, string $fonte): ?string
    {
        return Produto::query()
            ->where("product_id_{$fonte}", $productId)
            ->value('chave');
    }

    public static function resolverOuCriarAddonKey(string $productId, string $fonte, ?string $nomeProduto = null): string
    {
        $produto = Produto::query()->where("product_id_{$fonte}", $productId)->first();

        if ($produto) {
            return $produto->chave;
        }

        $base  = substr(rtrim(preg_replace('/[^a-z0-9_-]/', '_', strtolower("{$fonte}_{$productId}")), '_'), 0, 50);
        $chave = $base;
        $i     = 1;

        while (Produto::query()->where('chave', $chave)->exists()) {
            $chave = "{$base}_{$i}";
            $i++;
        }

        $produto = Produto::create([
            'chave'               => $chave,
            'nome'                => $nomeProduto ?? "Addon {$fonte} {$productId}",
            'ativo'               => true,
            'ordem'               => 99,
            "product_id_{$fonte}" => $productId,
        ]);

        return $produto->chave;
    }

    public static function resolverPlanoByOferta(string $ofertaId): ?string
    {
        $registro = WebhookOfferPlano::where('fonte', 'lastlink')
            ->where('offer_id', $ofertaId)
            ->value('plano');

        if ($registro !== null) {
            return $registro;
        }

        // fallback para config/env legado
        $mapa = config('addons.lastlink_offers');

        if (! is_array($mapa)) {
            return null;
        }

        return $mapa[$ofertaId] ?? null;
    }
}
