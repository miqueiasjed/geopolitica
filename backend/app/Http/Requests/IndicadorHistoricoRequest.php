<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class IndicadorHistoricoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'simbolo' => ['required', 'string', 'in:BZ=F,USDBRL=X,NG=F,ZS=F,ZW=F,TIO=F'],
        ];
    }

    public function messages(): array
    {
        return [
            'simbolo.required' => 'Símbolo inválido. Use um dos símbolos permitidos.',
            'simbolo.string'   => 'Símbolo inválido. Use um dos símbolos permitidos.',
            'simbolo.in'       => 'Símbolo inválido. Use um dos símbolos permitidos.',
        ];
    }
}
