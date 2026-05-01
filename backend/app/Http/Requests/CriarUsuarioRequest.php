<?php

namespace App\Http\Requests;

use App\Models\Plano;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class CriarUsuarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    public function rules(): array
    {
        $rolesExistentes = Role::where('guard_name', 'sanctum')->pluck('name');
        $slugsPlanos     = Plano::pluck('slug')->map(fn ($s) => 'assinante_' . $s);
        $rolesValidas    = $rolesExistentes->merge($slugsPlanos)->unique()->values();

        return [
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8'],
            'role'      => ['required', 'string', Rule::in($rolesValidas)],
            'expira_em' => ['nullable', 'date'],
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
