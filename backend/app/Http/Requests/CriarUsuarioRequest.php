<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CriarUsuarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    public function rules(): array
    {
        return [
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8'],
            'role'     => ['required', 'string', Rule::in(['admin', 'assinante_essencial', 'assinante_pro', 'assinante_reservado', 'company_admin'])],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'     => 'O nome é obrigatório.',
            'email.required'    => 'O e-mail é obrigatório.',
            'email.unique'      => 'Este e-mail já está em uso.',
            'email.email'       => 'Informe um endereço de e-mail válido.',
            'password.required' => 'A senha é obrigatória.',
            'password.min'      => 'A senha deve ter no mínimo 8 caracteres.',
            'role.required'     => 'O perfil é obrigatório.',
            'role.in'           => 'O perfil informado não é válido.',
        ];
    }
}
