<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ChatPerguntarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'pergunta' => ['required', 'string', 'max:500'],
        ];
    }
}
