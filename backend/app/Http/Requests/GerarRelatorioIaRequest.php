<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GerarRelatorioIaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'topico' => ['required', 'string', 'max:300'],
            'escopo' => ['nullable', 'string', 'max:500'],
        ];
    }
}
