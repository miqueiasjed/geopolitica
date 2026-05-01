<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class CriarSourceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nome'      => ['required', 'string', 'max:255'],
            'rss_url'   => ['required', 'url', 'max:500', 'unique:sources,rss_url'],
            'categoria' => ['required', 'in:geopolitica,economia,defesa,mercados'],
            'tier'      => ['sometimes', 'in:A,B'],
            'ativo'     => ['boolean'],
        ];
    }
}
