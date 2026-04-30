<?php

namespace App\Http\Controllers;

use App\Http\Requests\FeedFilterRequest;
use App\Http\Resources\EventCollection;
use App\Http\Resources\EventResource;
use App\Jobs\ProcessFeedUpdateJob;
use App\Models\Event;
use App\Services\EditorialService;
use App\Services\FeedConsultaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FeedController extends Controller
{
    public function __construct(
        private readonly FeedConsultaService $feedConsultaService,
        private readonly EditorialService $editorialService,
    ) {}

    public function index(FeedFilterRequest $request): EventCollection
    {
        return new EventCollection(
            $this->feedConsultaService->listar($request->user(), $request->validated())
        );
    }

    public function show(int $id): EventResource|JsonResponse
    {
        $event = Event::find($id);

        if (! $event) {
            return response()->json(['message' => 'Evento não encontrado.'], 404);
        }

        return new EventResource($event);
    }

    public function gerarEditorial(int $id): JsonResponse
    {
        $event = Event::find($id);

        if (! $event) {
            return response()->json(['message' => 'Evento não encontrado.'], 404);
        }

        try {
            $editorial = $this->editorialService->gerar($event);

            return response()->json([
                'headline' => $editorial['headline'],
                'legenda'  => $editorial['legenda'],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao gerar editorial. Verifique a configuração da API de IA.',
                'erro'    => $e->getMessage(),
            ], 500);
        }
    }

    public function atualizar(Request $request): JsonResponse
    {
        ProcessFeedUpdateJob::dispatch();

        return response()->json([
            'message' => 'Atualização em andamento.',
        ], 202);
    }
}
