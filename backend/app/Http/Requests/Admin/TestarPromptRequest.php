<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class TestarPromptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'prompt_sistema'   => 'required|string|max:10000',
            'mensagem_usuario' => 'required|string|max:2000',
            'max_tokens'       => 'nullable|integer|min:1|max:1024',
        ];
    }
}
