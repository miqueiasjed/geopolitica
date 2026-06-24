<?php

namespace App\Services;

use App\Models\Automacao;
use Illuminate\Support\Collection;

class AutomacaoService
{
    /**
     * Rótulos amigáveis dos grupos, na ordem de exibição.
     */
    public const GRUPOS = [
        'conteudo'     => 'Conteúdo',
        'inteligencia' => 'Inteligência',
        'dados'        => 'Dados de mercado e mapa',
    ];

    /**
     * Retorna todas as automações agrupadas, prontas para o painel admin.
     *
     * @return array<string, array<int, array<string, mixed>>>
     */
    public function todas(): array
    {
        $porGrupo = Automacao::query()
            ->orderBy('id')
            ->get()
            ->groupBy('grupo')
            ->map(fn (Collection $itens) => $itens->map(fn (Automacao $a) => [
                'chave'     => $a->chave,
                'grupo'     => $a->grupo,
                'label'     => $a->label,
                'descricao' => $a->descricao,
                'ativa'     => $a->ativa,
            ])->values()->all());

        // Mantém a ordem definida em GRUPOS.
        $resultado = [];
        foreach (array_keys(self::GRUPOS) as $grupo) {
            if (isset($porGrupo[$grupo])) {
                $resultado[$grupo] = $porGrupo[$grupo];
            }
        }

        return $resultado;
    }

    public function definir(string $chave, bool $ativa): Automacao
    {
        $automacao = Automacao::query()->where('chave', $chave)->firstOrFail();

        $automacao->update(['ativa' => $ativa]);

        Automacao::limparCache();

        return $automacao;
    }
}
