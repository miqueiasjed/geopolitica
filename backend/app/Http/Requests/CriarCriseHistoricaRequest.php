<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CriarCriseHistoricaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    public function rules(): array
    {
        return [
            'titulo'               => ['required', 'string', 'max:255'],
            'slug'                 => ['required', 'string', 'max:255', 'unique:crises_historicas,slug'],
            'ano'                  => ['required', 'integer', 'min:1900', 'max:2100'],
            'data_inicio'          => ['required', 'date'],
            'data_fim'             => ['nullable', 'date', 'after_or_equal:data_inicio'],
            'contexto_geopolitico' => ['required', 'string'],
            'impacto_global'       => ['required', 'string'],
            'impacto_brasil'       => ['required', 'string'],
            'metricas_globais'     => ['nullable', 'array'],
            'metricas_globais.*.label' => ['required_with:metricas_globais', 'string'],
            'metricas_globais.*.valor' => ['required_with:metricas_globais', 'string'],
            'metricas_brasil'      => ['nullable', 'array'],
            'metricas_brasil.*.label'  => ['required_with:metricas_brasil', 'string'],
            'metricas_brasil.*.valor'  => ['required_with:metricas_brasil', 'string'],
            'categorias'           => ['required', 'array', 'min:1'],
            'categorias.*'         => ['string', 'max:100'],
            'content_slug'         => ['nullable', 'string', 'max:255'],
        ];
    }
}
