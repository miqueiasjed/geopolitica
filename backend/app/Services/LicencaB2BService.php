<?php

namespace App\Services;

use App\Models\Empresa;
use App\Models\LicencaB2B;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LicencaB2BService
{
    public function criarEmpresaComLicenca(array $dados): Empresa
    {
        $subdominio = Str::slug($dados['subdominio']);

        if (Empresa::query()->where('subdominio', $subdominio)->exists()) {
            throw new \InvalidArgumentException("O subdomínio '{$subdominio}' já está em uso.");
        }

        return DB::transaction(function () use ($dados, $subdominio): Empresa {
            $empresa = Empresa::query()->create([
                'nome'         => $dados['nome'],
                'subdominio'   => $subdominio,
                'logo_url'     => $dados['logo_url'] ?? null,
                'ativo'        => true,
                'max_usuarios' => $dados['max_usuarios'] ?? 10,
                'expira_em'    => now()->addYear(),
            ]);

            LicencaB2B::query()->create([
                'empresa_id'   => $empresa->id,
                'tipo'         => $dados['tipo'] ?? 'b2b',
                'ativa'        => true,
                'contratado_em' => now(),
                'expira_em'    => now()->addYear(),
            ]);

            return $empresa;
        });
    }

    public function renovarLicenca(Empresa $empresa, int $meses = 12): LicencaB2B
    {
        return DB::transaction(function () use ($empresa, $meses): LicencaB2B {
            $licenca = $empresa->licenca;

            if ($licenca) {
                $novaExpiracao = $licenca->expira_em && $licenca->expira_em->isFuture()
                    ? $licenca->expira_em->addMonths($meses)
                    : now()->addMonths($meses);

                $licenca->update([
                    'ativa'     => true,
                    'expira_em' => $novaExpiracao,
                ]);
            } else {
                $licenca = LicencaB2B::query()->create([
                    'empresa_id'    => $empresa->id,
                    'tipo'          => 'b2b',
                    'ativa'         => true,
                    'contratado_em' => now(),
                    'expira_em'     => now()->addMonths($meses),
                ]);
            }

            $empresa->update([
                'ativo'     => true,
                'expira_em' => $licenca->expira_em,
            ]);

            return $licenca->fresh();
        });
    }

    public function desativarLicenca(Empresa $empresa): void
    {
        $empresa->update(['ativo' => false]);
    }
}
