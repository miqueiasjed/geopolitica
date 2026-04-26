<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CriarPerfilPaisRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    public function rules(): array
    {
        return [
            'codigo_pais'            => ['required', 'string', 'size:2', 'unique:perfis_paises,codigo_pais'],
            'nome_pt'                => ['required', 'string', 'max:100'],
            'bandeira_emoji'         => ['nullable', 'string', 'max:10'],
            'regiao_geopolitica'     => ['nullable', 'string', 'max:100'],
            'contexto_geopolitico'   => ['nullable', 'string'],
            'analise_lideranca'      => ['nullable', 'string'],
            'indicadores_relevantes' => ['nullable', 'array'],
            'indicadores_relevantes.*' => ['string'],
            'termos_busca'           => ['nullable', 'array'],
            'termos_busca.*'         => ['string'],
        ];
    }
}
