<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListarWebhookEventosRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $processado = $this->input('processado');

        if ($processado === '') {
            $processado = null;
        }

        $this->merge([
            'type' => $this->string('type')->trim()->value() ?: null,
            'processado' => is_string($processado) ? strtolower($processado) : $processado,
            'page' => $this->integer('page') ?: 1,
        ]);
    }

    public function rules(): array
    {
        return [
            'type' => ['nullable', 'string', 'max:100'],
            'processado' => ['nullable', Rule::in(['true', 'false', '1', '0'])],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
