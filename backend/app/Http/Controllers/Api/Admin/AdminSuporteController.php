<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ResponderTicketSuporteRequest;
use App\Http\Resources\SuporteTicketResource;
use App\Models\SuporteTicket;
use App\Services\SuporteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSuporteController extends Controller
{
    public function __construct(private readonly SuporteService $suporteService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = SuporteTicket::query()
            ->with('user')
            ->withCount('mensagens')
            ->orderByDesc('updated_at');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $tickets = $query->paginate(25);

        return response()->json(SuporteTicketResource::collection($tickets)->response()->getData());
    }

    public function show(int $id): JsonResponse
    {
        $ticket = SuporteTicket::query()
            ->with('mensagens.anexos', 'mensagens.user', 'user')
            ->findOrFail($id);

        $this->suporteService->marcarLidoAdmin($ticket);

        return response()->json(new SuporteTicketResource($ticket));
    }

    public function responder(ResponderTicketSuporteRequest $request, int $id): JsonResponse
    {
        $ticket = SuporteTicket::findOrFail($id);

        $ticket = $this->suporteService->responder($ticket, auth()->user(), $request->validated(), true);

        return response()->json(new SuporteTicketResource($ticket));
    }

    public function fechar(int $id): JsonResponse
    {
        $ticket = SuporteTicket::findOrFail($id);

        $ticket = $this->suporteService->fecharTicket($ticket);

        return response()->json(new SuporteTicketResource($ticket));
    }

    public function naoLidos(): JsonResponse
    {
        $total = SuporteTicket::query()
            ->whereNull('lido_admin_em')
            ->where('status', '!=', 'fechado')
            ->count();

        return response()->json(['total' => $total]);
    }
}
