<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AtualizarConteudoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    public function rules(): array
    {
        return [
            'titulo'           => ['nullable', 'string', 'max:255'],
            'tipo'             => ['nullable', 'string', 'in:briefing,mapa,tese'],
            'edicao'           => ['nullable', 'integer', 'min:1'],
            'autor'            => ['nullable', 'string', 'max:150'],
            'corpo'            => ['nullable', 'string'],
            'resumo'           => ['nullable', 'string', 'max:500'],
            'regiao'           => ['nullable', 'string', 'max:100'],
            'tags'             => ['nullable', 'array'],
            'tags.*'           => ['string', 'max:50'],
            'tese_manchete'    => [
                Rule::requiredIf(fn () => $this->input('tipo') === 'tese'),
                'nullable',
                'string',
                'max:255',
            ],
            'vertical_conteudo' => ['nullable', 'string', 'in:elections,war'],
            'publicado'        => ['nullable', 'boolean'],
        ];
    }
}
