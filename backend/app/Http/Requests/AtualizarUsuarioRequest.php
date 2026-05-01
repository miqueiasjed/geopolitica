<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class AtualizarUsuarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    public function rules(): array
    {
        $usuarioId = $this->route('usuario');

        return [
            'name'  => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($usuarioId)],
            'role'      => ['sometimes', 'string', Rule::in(Role::where('guard_name', 'sanctum')->pluck('name'))],
            'expira_em' => ['sometimes', 'nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'Este e-mail já está em uso por outro usuário.',
            'email.email'  => 'Informe um endereço de e-mail válido.',
            'role.in'      => 'O perfil informado não é válido.',
        ];
    }
}
