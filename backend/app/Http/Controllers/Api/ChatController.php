<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChatPerguntarRequest;
use App\Services\ChatService;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ChatController extends Controller
{
    public function __construct(private readonly ChatService $chatService)
    {
    }

    public function perguntar(ChatPerguntarRequest $request): StreamedResponse
    {
        return response()->stream(function () use ($request): void {
            $this->chatService->perguntar(
                auth()->user(),
                $request->validated('pergunta'),
                function (string $token): void {
                    echo 'data: ' . json_encode(['token' => $token]) . "\n\n";
                    ob_flush();
                    flush();
                },
            );

            echo "data: [DONE]\n\n";
            ob_flush();
            flush();
        }, 200, [
            'Content-Type'      => 'text/event-stream',
            'Cache-Control'     => 'no-cache',
            'X-Accel-Buffering' => 'no',
        ]);
    }
}
