<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AtualizarProdutoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nome'          => ['sometimes', 'required', 'string', 'max:150'],
            'descricao'     => ['nullable', 'string', 'max:1000'],
            'preco_label'   => ['nullable', 'string', 'max:50'],
            'link_compra'   => ['nullable', 'url', 'max:500'],
            'link_reativar' => ['nullable', 'url', 'max:500'],
            'ativo'               => ['boolean'],
            'ordem'               => ['integer', 'min:0'],
            'product_id_lastlink' => ['nullable', 'string', 'max:100', Rule::unique('produtos', 'product_id_lastlink')->ignore($this->route('produto'))],
            'product_id_hotmart'  => ['nullable', 'string', 'max:100', Rule::unique('produtos', 'product_id_hotmart')->ignore($this->route('produto'))],
        ];
    }
}
