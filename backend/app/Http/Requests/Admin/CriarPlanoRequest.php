<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CriarPlanoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'slug'                => ['required', 'string', 'max:50', 'regex:/^[a-z0-9_-]+$/', Rule::unique('planos', 'slug')],
            'nome'                => ['required', 'string', 'max:100'],
            'descricao'           => ['nullable', 'string', 'max:1000'],
            'preco'               => ['required', 'numeric', 'min:0'],
            'ordem'               => ['required', 'integer', 'min:0'],
            'ativo'               => ['boolean'],
            'lastlink_url'        => ['nullable', 'url', 'max:500'],
            'role'                => ['nullable', 'string', 'max:100'],
            'product_id_hotmart'  => ['nullable', 'string', 'max:100', Rule::unique('planos', 'product_id_hotmart')],
            'product_id_lastlink' => ['nullable', 'string', 'max:100', Rule::unique('planos', 'product_id_lastlink')],
        ];
    }
}
