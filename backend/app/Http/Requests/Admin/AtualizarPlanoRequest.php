<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class AtualizarPlanoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nome'         => ['required', 'string', 'max:100'],
            'descricao'    => ['nullable', 'string', 'max:1000'],
            'preco'        => ['required', 'numeric', 'min:0'],
            'ordem'        => ['nullable', 'integer', 'min:0'],
            'ativo'        => ['nullable', 'boolean'],
            'lastlink_url' => ['nullable', 'url', 'max:500'],
            'role'         => ['nullable', 'string', 'max:100'],
        ];
    }
}
