<?php

namespace App\Services;

use App\Models\Assinante;
use App\Models\AssinanteAddon;

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
        $mapa = config("addons.{$fonte}_products");

        if (! is_array($mapa)) {
            return null;
        }

        return $mapa[$productId] ?? null;
    }

    public static function resolverPlanoByOferta(string $ofertaId): ?string
    {
        $mapa = config('addons.lastlink_offers');

        if (! is_array($mapa)) {
            return null;
        }

        return $mapa[$ofertaId] ?? null;
    }
}
