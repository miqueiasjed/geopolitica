<?php

namespace App\Services;

use App\Models\Source;
use Illuminate\Database\Eloquent\Collection;

class SourceService
{
    public function listar(): Collection
    {
        return Source::orderBy('categoria')->orderBy('nome')->get();
    }

    public function criar(array $dados): Source
    {
        return Source::create($dados);
    }

    public function atualizar(Source $source, array $dados): Source
    {
        $source->update($dados);

        return $source->fresh();
    }

    public function excluir(Source $source): void
    {
        $source->delete();
    }
}
