<?php

namespace App\Exceptions;

class LimitePaisesAtingidoException extends \RuntimeException
{
    public function __construct(int $limite, string $plano)
    {
        parent::__construct("Limite de {$limite} países atingido no plano {$plano}. Faça upgrade para adicionar mais.");
    }
}
