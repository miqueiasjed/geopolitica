<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AbrirTicketSuporteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'assunto'       => ['required', 'string', 'max:255'],
            'corpo'         => ['required', 'string', 'max:5000'],
            'anexos'        => ['nullable', 'array', 'max:5'],
            'anexos.*'      => ['file', 'max:10240', 'mimes:jpg,jpeg,png,gif,webp,pdf,doc,docx,txt'],
        ];
    }
}
