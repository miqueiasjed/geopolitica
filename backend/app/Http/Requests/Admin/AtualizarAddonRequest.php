<?php

namespace App\Http\Requests\Admin;

use App\Models\AssinanteAddon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AtualizarAddonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status'      => ['sometimes', 'required', 'string', Rule::in(['ativo', 'cancelado', 'expirado', 'reembolsado'])],
            'fonte'       => ['sometimes', 'required', 'string', Rule::in(AssinanteAddon::FONTES)],
            'iniciado_em' => ['nullable', 'date'],
            'expira_em'   => ['nullable', 'date'],
        ];
    }
}
