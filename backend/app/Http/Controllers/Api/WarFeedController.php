<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\EventResource;
use App\Models\Event;
use App\Services\WarFeedService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class WarFeedController extends Controller
{
    public function __construct(
        private readonly WarFeedService $warFeedService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('acessar-vertical', 'war');

        $resultado = $this->warFeedService->buscarFeed([
            'cursor' => $request->query('cursor'),
            'limit'  => $request->query('limit', 20),
        ]);

        return response()->json([
            'events'     => $resultado['events'],
            'nextCursor' => $resultado['nextCursor'],
        ]);
    }

    public function show(int $id): EventResource|JsonResponse
    {
        Gate::authorize('acessar-vertical', 'war');

        $event = Event::find($id);

        if (! $event) {
            return response()->json(['message' => 'Evento não encontrado.'], 404);
        }

        return new EventResource($event);
    }
}
