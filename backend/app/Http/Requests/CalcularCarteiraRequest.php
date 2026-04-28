<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CalcularCarteiraRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ativos'          => 'required|array|min:1|max:20',
            'ativos.*.ticker' => 'required|string|max:20',
            'ativos.*.peso'   => 'required|numeric|min:0.01|max:1',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('ativos') && is_array($this->input('ativos'))) {
            $ativos = collect($this->input('ativos'))
                ->map(fn ($ativo) => array_merge($ativo, [
                    'ticker' => strtoupper($ativo['ticker'] ?? ''),
                    'peso'   => isset($ativo['peso']) ? (float) $ativo['peso'] : null,
                ]))
                ->toArray();

            $this->merge(['ativos' => $ativos]);
        }
    }
}
