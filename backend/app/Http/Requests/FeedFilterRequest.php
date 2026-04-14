<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FeedFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'categoria' => $this->string('categoria')->trim()->value() ?: null,
            'regiao' => $this->string('regiao')->trim()->value() ?: null,
            'label' => $this->string('label')->trim()->value() ?: null,
            'cursor' => $this->string('cursor')->trim()->value() ?: null,
            'limite' => $this->integer('limite') ?: 20,
        ]);
    }

    public function rules(): array
    {
        return [
            'categoria' => ['nullable', 'string', Rule::in(['energia', 'alimentos', 'cambio', 'conflitos', 'sancoes', 'eleicoes', 'commodities'])],
            'regiao' => ['nullable', 'string', 'max:120'],
            'label' => ['nullable', 'string', Rule::in(['CRÍTICO', 'ALTO', 'MÉDIO', 'MONITORAR'])],
            'cursor' => ['nullable', 'string'],
            'limite' => ['nullable', 'integer', 'between:5,50'],
        ];
    }
}
