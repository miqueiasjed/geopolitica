<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RenovarLicencaB2BRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'meses' => ['sometimes', 'integer', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'meses.integer' => 'O número de meses deve ser um inteiro.',
            'meses.min'     => 'O número de meses deve ser ao menos 1.',
        ];
    }
}
