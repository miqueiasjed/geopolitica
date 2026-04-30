<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AbrirTicketSuporteRequest;
use App\Http\Requests\ResponderTicketSuporteRequest;
use App\Http\Resources\SuporteTicketResource;
use App\Models\SuporteTicket;
use App\Services\SuporteService;
use Illuminate\Http\JsonResponse;

class SuporteController extends Controller
{
    public function __construct(private readonly SuporteService $suporteService)
    {
    }

    public function index(): JsonResponse
    {
        $tickets = SuporteTicket::query()
            ->where('user_id', auth()->id())
            ->withCount('mensagens')
            ->orderByDesc('updated_at')
            ->get();

        return response()->json(SuporteTicketResource::collection($tickets));
    }

    public function store(AbrirTicketSuporteRequest $request): JsonResponse
    {
        $ticket = $this->suporteService->abrirTicket(auth()->user(), $request->validated());

        return response()->json(new SuporteTicketResource($ticket), 201);
    }

    public function show(int $id): JsonResponse
    {
        $ticket = SuporteTicket::query()
            ->where('user_id', auth()->id())
            ->with('mensagens.anexos', 'mensagens.user', 'user')
            ->findOrFail($id);

        return response()->json(new SuporteTicketResource($ticket));
    }

    public function responder(ResponderTicketSuporteRequest $request, int $id): JsonResponse
    {
        $ticket = SuporteTicket::query()
            ->where('user_id', auth()->id())
            ->where('status', '!=', 'fechado')
            ->findOrFail($id);

        $ticket = $this->suporteService->responder($ticket, auth()->user(), $request->validated(), false);

        return response()->json(new SuporteTicketResource($ticket));
    }
}
