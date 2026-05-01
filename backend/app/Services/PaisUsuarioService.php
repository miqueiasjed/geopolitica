<?php

namespace App\Services;

use App\Exceptions\LimitePaisesAtingidoException;
use App\Models\PaisUsuario;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class PaisUsuarioService
{
    public function __construct(
        private readonly PlanoService $planoService,
    ) {}

    public function listar(int $userId): Collection
    {
        return PaisUsuario::where('user_id', $userId)
            ->with('perfil')
            ->get();
    }

    public function adicionar(User $usuario, string $codigoPais): PaisUsuario
    {
        if (! $usuario->hasRole('admin')) {
            $slugPlano = $usuario->assinante?->plano ?? 'essencial';
            $limite    = $this->planoService->limiteInteiro($slugPlano, 'paises_seguidos_limite');

            if ($limite !== null) {
                $totalSeguidos = PaisUsuario::where('user_id', $usuario->id)->count();

                if ($totalSeguidos >= $limite) {
                    throw new LimitePaisesAtingidoException($limite, $slugPlano);
                }
            }
        }

        $paisUsuario = PaisUsuario::create([
            'user_id'       => $usuario->id,
            'codigo_pais'   => $codigoPais,
            'adicionado_em' => now(),
        ]);

        $paisUsuario->load('perfil');

        return $paisUsuario;
    }

    public function remover(int $userId, string $codigoPais): bool
    {
        $paisUsuario = PaisUsuario::where('user_id', $userId)
            ->where('codigo_pais', $codigoPais)
            ->first();

        if (! $paisUsuario) {
            return false;
        }

        $paisUsuario->delete();

        return true;
    }
}
