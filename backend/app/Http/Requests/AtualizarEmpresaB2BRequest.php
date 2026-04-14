<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AtualizarEmpresaB2BRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nome'         => ['sometimes', 'string', 'max:255'],
            'logo_url'     => ['sometimes', 'nullable', 'url'],
            'max_usuarios' => ['sometimes', 'integer', 'min:1'],
            'ativo'        => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'logo_url.url'         => 'A URL do logo deve ser uma URL válida.',
            'max_usuarios.integer' => 'O limite de usuários deve ser um número inteiro.',
            'ativo.boolean'        => 'O campo ativo deve ser verdadeiro ou falso.',
        ];
    }
}
