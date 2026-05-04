<?php

namespace App\Http\Requests\Admin;

use App\Models\Plano;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ImportarAssinantesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $slugsPlanos = Plano::where('ativo', true)->pluck('slug')->toArray();

        return [
            'plano_padrao' => ['nullable', 'string', Rule::in($slugsPlanos)],
            'senha_padrao' => ['nullable', 'string', 'min:8', 'max:72'],
            'enviar_email' => ['sometimes', 'boolean'],
            'linhas' => ['required', 'array', 'min:1', 'max:1500'],
            'linhas.*.email' => ['required', 'email', 'max:255'],
            'linhas.*.nome' => ['nullable', 'string', 'max:255'],
            'linhas.*.plano' => ['nullable', 'string', Rule::in($slugsPlanos)],
            'linhas.*.status' => ['nullable', 'string', 'max:80'],
            'linhas.*.expira_em' => ['nullable', 'date'],
            'linhas.*.assinado_em' => ['nullable', 'date'],
            'linhas.*.origem' => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'linhas.required' => 'Informe ao menos um assinante para importar.',
            'linhas.*.email.required' => 'Todas as linhas precisam de e-mail.',
            'linhas.*.email.email' => 'Há uma linha com e-mail inválido.',
            'linhas.*.plano.in' => 'Há uma linha com plano inválido.',
            'plano_padrao.in' => 'Plano padrão inválido.',
            'senha_padrao.min' => 'A senha padrão deve ter pelo menos 8 caracteres.',
        ];
    }
}
