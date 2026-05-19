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
            'addon_key'   => ['required', 'string', Rule::exists('produtos', 'chave')],
            'status'      => ['required', 'string', Rule::in(['ativo', 'cancelado', 'expirado', 'reembolsado'])],
            'fonte'       => ['required', 'string', Rule::in(AssinanteAddon::FONTES)],
            'iniciado_em' => ['nullable', 'date'],
            'expira_em'   => ['nullable', 'date', 'after_or_equal:iniciado_em'],
        ];
    }
}
