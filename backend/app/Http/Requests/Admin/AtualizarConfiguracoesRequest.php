<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class AtualizarConfiguracoesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'configuracoes'   => ['required', 'array'],
            'configuracoes.*' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
