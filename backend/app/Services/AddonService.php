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
        $assinante = Assinante::query()->firstOrCreate(
            ['user_id' => $userId],
            ['plano' => null, 'ativo' => true, 'status' => 'ativo'],
        );

        if (! $assinante->ativo) {
            $assinante->forceFill(['ativo' => true])->save();
        }

        AssinanteAddon::query()->updateOrCreate(
            ['user_id' => $userId, 'addon_key' => $addonKey],
            ['status' => 'ativo', 'fonte' => $fonte, 'order_id' => $orderId, 'product_id' => $productId, 'iniciado_em' => now()],
        );
    }

    public function cancelar(int $userId, string $addonKey, string $motivo): void
    {
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
