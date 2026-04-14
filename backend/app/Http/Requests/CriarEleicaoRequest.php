<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CriarEleicaoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    public function rules(): array
    {
        return [
            'pais'                          => ['required', 'string', 'max:100'],
            'codigo_pais'                   => ['required', 'string', 'size:2'],
            'data_eleicao'                  => ['required', 'date'],
            'tipo_eleicao'                  => ['required', 'string', 'max:100'],
            'relevancia'                    => ['required', 'string', 'in:alta,media,baixa'],
            'contexto_geopolitico'          => ['required', 'string'],
            'impacto_brasil'                => ['required', 'string'],
            'candidatos_principais'         => ['nullable', 'array'],
            'candidatos_principais.*.nome'  => ['required', 'string'],
            'candidatos_principais.*.partido' => ['nullable', 'string'],
            'content_slug'                  => ['nullable', 'string', 'max:255'],
        ];
    }
}
