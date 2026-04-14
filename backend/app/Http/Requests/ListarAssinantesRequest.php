<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ListarAssinantesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'search' => $this->string('search')->trim()->value() ?: null,
            'plano' => $this->string('plano')->trim()->value() ?: null,
            'status' => $this->string('status')->trim()->value() ?: null,
            'page' => $this->integer('page') ?: 1,
        ]);
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'plano' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
