<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AtualizarEleicaoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    public function rules(): array
    {
        return [
            'pais'                          => ['sometimes', 'string', 'max:100'],
            'codigo_pais'                   => ['sometimes', 'string', 'size:2'],
            'data_eleicao'                  => ['sometimes', 'date'],
            'tipo_eleicao'                  => ['sometimes', 'string', 'max:100'],
            'relevancia'                    => ['sometimes', 'string', 'in:alta,media,baixa'],
            'contexto_geopolitico'          => ['sometimes', 'string'],
            'impacto_brasil'                => ['sometimes', 'string'],
            'candidatos_principais'         => ['sometimes', 'nullable', 'array'],
            'candidatos_principais.*.nome'  => ['required_with:candidatos_principais', 'string'],
            'candidatos_principais.*.partido' => ['nullable', 'string'],
            'content_slug'                  => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }
}
