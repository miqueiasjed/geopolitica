<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReceberWebhookHotmartRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'event' => ['nullable', 'string'],
            'event_type' => ['nullable', 'string'],
        ];
    }
}
