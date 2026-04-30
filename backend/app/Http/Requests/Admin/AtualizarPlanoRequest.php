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
            'nome'     => ['required', 'string', 'max:100'],
            'descricao' => ['nullable', 'string', 'max:1000'],
            'preco'    => ['required', 'numeric', 'min:0'],
        ];
    }
}
