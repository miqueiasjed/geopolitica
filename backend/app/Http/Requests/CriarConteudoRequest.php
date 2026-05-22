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
            'titulo'           => ['required', 'string', 'max:255'],
            'tipo'             => ['required', 'string', 'in:briefing,mapa,tese'],
            'edicao'           => ['nullable', 'integer', 'min:1'],
            'autor'            => ['nullable', 'string', 'max:150'],
            'corpo'            => ['required', 'string'],
            'resumo'           => ['nullable', 'string', 'max:500'],
            'regiao'           => ['nullable', 'string', 'max:100'],
            'tags'             => ['nullable', 'array'],
            'tags.*'           => ['string', 'max:50'],
            'tese_manchete'    => [
                Rule::requiredIf($this->input('tipo') === 'tese'),
                'nullable',
                'string',
                'max:255',
            ],
            'vertical_conteudo' => ['nullable', 'string', 'in:elections,war'],
            'publicado'        => ['boolean'],
        ];
    }
}
