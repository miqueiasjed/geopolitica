<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ChatService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ChatController extends Controller
{
    public function __construct(private ChatService $chatService)
    {
    }

    public function perguntar(Request $request): StreamedResponse
    {
        $request->validate(['pergunta' => 'required|string|max:500']);

        return response()->stream(function () use ($request): void {
            $this->chatService->perguntar(
                auth()->user(),
                $request->input('pergunta'),
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
