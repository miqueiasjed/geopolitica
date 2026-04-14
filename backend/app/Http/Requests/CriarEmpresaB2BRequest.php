<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CriarEmpresaB2BRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nome'         => ['required', 'string', 'max:255'],
            'subdominio'   => ['required', 'string', 'max:100', 'alpha_dash'],
            'max_usuarios' => ['required', 'integer', 'min:1'],
            'meses'        => ['sometimes', 'integer', 'min:1'],
            'email_admin'  => ['required', 'email'],
        ];
    }

    public function messages(): array
    {
        return [
            'nome.required'         => 'O nome da empresa é obrigatório.',
            'subdominio.required'   => 'O subdomínio é obrigatório.',
            'subdominio.alpha_dash' => 'O subdomínio deve conter apenas letras, números, hífens e underscores.',
            'max_usuarios.required' => 'O limite de usuários é obrigatório.',
            'max_usuarios.integer'  => 'O limite de usuários deve ser um número inteiro.',
            'email_admin.required'  => 'O e-mail do administrador é obrigatório.',
            'email_admin.email'     => 'Informe um e-mail válido para o administrador.',
        ];
    }
}
