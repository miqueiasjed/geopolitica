<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class Configuracao extends Model
{
    protected $table = 'configuracoes';

    protected $fillable = [
        'chave',
        'valor',
        'grupo',
        'label',
        'descricao',
        'tipo',
        'sensivel',
    ];

    protected $casts = [
        'sensivel' => 'boolean',
    ];

    public function getValorDecriptadoAttribute(): ?string
    {
        if ($this->valor === null) {
            return null;
        }

        if (! $this->sensivel) {
            return $this->valor;
        }

        try {
            return Crypt::decryptString($this->valor);
        } catch (\Exception) {
            return null;
        }
    }

    public function setValor(string $valor): void
    {
        $this->valor = $this->sensivel
            ? Crypt::encryptString($valor)
            : $valor;

        $this->save();
    }
}
