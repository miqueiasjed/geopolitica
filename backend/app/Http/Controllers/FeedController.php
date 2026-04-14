<?php

namespace App\Http\Controllers;

use App\Http\Requests\FeedFilterRequest;
use App\Http\Resources\EventCollection;
use App\Jobs\ProcessFeedUpdateJob;
use App\Services\FeedConsultaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FeedController extends Controller
{
    public function __construct(
        private readonly FeedConsultaService $feedConsultaService,
    ) {
    }

    public function index(FeedFilterRequest $request): EventCollection
    {
        return new EventCollection(
            $this->feedConsultaService->listar($request->user(), $request->validated())
        );
    }

    public function atualizar(Request $request): JsonResponse
    {
        ProcessFeedUpdateJob::dispatch();

        return response()->json([
            'message' => 'Atualização em andamento.',
        ], 202);
    }
}
