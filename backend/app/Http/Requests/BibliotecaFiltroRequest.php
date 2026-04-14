<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BibliotecaFiltroRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'q'      => ['nullable', 'string', 'max:200'],
            'tipo'   => ['nullable', 'string', 'in:briefing,mapa,tese'],
            'regiao' => ['nullable', 'string', 'max:100'],
            'de'     => ['nullable', 'date'],
            'ate'    => ['nullable', 'date', 'after_or_equal:de'],
            'cursor' => ['nullable', 'integer', 'min:1'],
            'limite' => ['nullable', 'integer', 'min:1', 'max:50'],
        ];
    }
}
