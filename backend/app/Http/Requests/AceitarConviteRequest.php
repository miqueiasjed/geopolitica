<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AceitarConviteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nome'                  => ['required', 'string', 'max:255'],
            'password'              => ['required', 'string', 'min:8', 'confirmed'],
            'password_confirmation' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'nome.required'                  => 'O nome é obrigatório.',
            'password.required'              => 'A senha é obrigatória.',
            'password.min'                   => 'A senha deve ter no mínimo 8 caracteres.',
            'password.confirmed'             => 'A confirmação de senha não confere.',
            'password_confirmation.required' => 'A confirmação de senha é obrigatória.',
        ];
    }
}
