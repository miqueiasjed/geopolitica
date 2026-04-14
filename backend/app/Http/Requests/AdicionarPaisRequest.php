<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AdicionarPaisRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'codigo_pais' => 'required|string|size:2|exists:perfis_paises,codigo_pais',
        ];
    }

    public function messages(): array
    {
        return [
            'codigo_pais.required' => 'O código do país é obrigatório.',
            'codigo_pais.string'   => 'O código do país deve ser uma string.',
            'codigo_pais.size'     => 'O código do país deve ter exatamente 2 caracteres.',
            'codigo_pais.exists'   => 'O país informado não existe na base de dados.',
        ];
    }
}
