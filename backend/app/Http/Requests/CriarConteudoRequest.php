<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CriarConteudoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    public function rules(): array
    {
        return [
            'titulo'        => ['required', 'string', 'max:255'],
            'tipo'          => ['required', 'string', 'in:briefing,mapa,tese'],
            'corpo'         => ['required', 'string'],
            'resumo'        => ['required', 'string', 'max:500'],
            'regiao'        => ['nullable', 'string', 'max:100'],
            'tags'          => ['nullable', 'array'],
            'tags.*'        => ['string', 'max:50'],
            'tese_manchete' => [
                Rule::requiredIf($this->input('tipo') === 'tese'),
                'nullable',
                'string',
                'max:255',
            ],
            'plano_minimo'  => ['required', 'string', 'in:essencial,pro,reservado'],
            'publicado'     => ['boolean'],
        ];
    }
}
