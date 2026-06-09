<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramService
{
    private ?string $botToken;

    public function __construct()
    {
        $this->botToken = config('services.telegram.bot_token');
    }

    /**
     * Envia uma mensagem HTML para um canal configurado (feed, war, elections).
     *
     * Retorna false (sem lançar exceção) quando a integração está desligada
     * ou o canal não está configurado, para nunca quebrar o fluxo que chama.
     */
    public function enviarParaCanal(string $canal, string $texto): bool
    {
        $chatId = config("services.telegram.channels.$canal");

        if (empty($this->botToken) || empty($chatId)) {
            Log::info('TelegramService: envio ignorado (token ou canal não configurado).', [
                'canal' => $canal,
            ]);

            return false;
        }

        return $this->enviar($chatId, $texto);
    }

    private function enviar(string $chatId, string $texto): bool
    {
        try {
            $response = Http::asJson()->post(
                "https://api.telegram.org/bot{$this->botToken}/sendMessage",
                [
                    'chat_id'                  => $chatId,
                    'text'                     => $texto,
                    'parse_mode'               => 'HTML',
                    'disable_web_page_preview' => false,
                ]
            );

            if ($response->successful() && $response->json('ok')) {
                return true;
            }

            Log::warning('TelegramService: falha ao enviar mensagem.', [
                'chat_id' => $chatId,
                'status'  => $response->status(),
                'corpo'   => $response->json('description') ?? $response->body(),
            ]);

            return false;
        } catch (\Throwable $e) {
            Log::error('TelegramService: erro ao enviar mensagem.', [
                'chat_id' => $chatId,
                'erro'    => $e->getMessage(),
            ]);

            return false;
        }
    }
}
