<?php

namespace App\Http\Requests\Admin;

use App\Models\AssinanteAddon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdicionarAddonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'produto_chave' => ['required', 'string', Rule::exists('produtos', 'chave')],
            'status'        => ['required', 'string', Rule::in(['ativo', 'cancelado', 'expirado', 'reembolsado'])],
            'data_inicio'   => ['nullable', 'date'],
            'data_fim'      => ['nullable', 'date', 'after_or_equal:data_inicio'],
        ];
    }
}
