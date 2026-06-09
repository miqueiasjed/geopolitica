<?php

namespace App\Jobs;

use App\Services\TelegramService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class EnviarTelegramJob implements ShouldQueue
{
    use Queueable;

    public int $tries   = 3;
    public int $timeout = 60;
    public array $backoff = [30, 120, 300];

    /**
     * @param  string  $canal  Chave do canal (feed, war, elections)
     * @param  string  $texto  Mensagem já formatada em HTML
     */
    public function __construct(
        public string $canal,
        public string $texto,
    ) {
        $this->onQueue('telegram');
    }

    public function handle(TelegramService $telegram): void
    {
        $telegram->enviarParaCanal($this->canal, $this->texto);
    }
}
