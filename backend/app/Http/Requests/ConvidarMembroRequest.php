<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ConvidarMembroRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email'    => ['required', 'email'],
            'role_b2b' => ['required', 'in:company_admin,reader'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required'    => 'O e-mail é obrigatório.',
            'email.email'       => 'Informe um e-mail válido.',
            'role_b2b.required' => 'O papel (role_b2b) é obrigatório.',
            'role_b2b.in'       => 'O papel deve ser company_admin ou reader.',
        ];
    }
}
