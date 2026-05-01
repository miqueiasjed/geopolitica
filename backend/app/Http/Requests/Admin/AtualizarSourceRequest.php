<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AtualizarSourceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $sourceId = $this->route('source')?->id;

        return [
            'nome'      => ['sometimes', 'string', 'max:255'],
            'rss_url'   => ['sometimes', 'url', 'max:500', Rule::unique('sources', 'rss_url')->ignore($sourceId)],
            'categoria' => ['sometimes', 'in:geopolitica,economia,defesa,mercados'],
            'tier'      => ['sometimes', 'in:A,B'],
            'ativo'     => ['sometimes', 'boolean'],
        ];
    }
}
