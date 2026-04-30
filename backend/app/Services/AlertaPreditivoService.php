<?php

namespace App\Services;

use App\Models\AlertaLeitura;
use App\Models\AlertaPreditivo;

class AlertaPreditivoService
{
    public function alertasNaoLidos(int $userId, string $nivelPermitido): array
    {
        $alertas = AlertaPreditivo::visivelPara($nivelPermitido)
            ->naoLidosPor($userId)
            ->orderByDesc('created_at')
            ->get();

        return [
            'alertas'        => $alertas->toArray(),
            'total_nao_lidos' => $alertas->count(),
        ];
    }

    public function marcarLido(int $alertaId, int $userId): array
    {
        $jaExiste = AlertaLeitura::where('user_id', $userId)
            ->where('alerta_id', $alertaId)
            ->exists();

        if ($jaExiste) {
            return [
                'sucesso'   => false,
                'mensagem'  => 'Alerta já marcado como lido',
            ];
        }

        AlertaLeitura::create([
            'user_id'  => $userId,
            'alerta_id' => $alertaId,
            'lido_em'  => now(),
        ]);

        return ['sucesso' => true];
    }
}
