<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PdfTemplateService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ExportPdfController extends Controller
{
    public function __construct(private PdfTemplateService $pdfTemplateService)
    {
    }

    public function exportar(Request $request): Response|\Illuminate\Http\JsonResponse
    {
        // Exceção documentada: validação inline permitida pois o payload é simples
        // e não há lógica de negócio na validação (apenas tipagem/enum de entrada).
        $request->validate([
            'tipo'         => 'required|string|in:briefing,alerta,pais,chat,report,risk_score',
            'id'           => 'required|string',
            'company_slug' => 'nullable|string|max:100',
        ]);

        try {
            $pdf = $this->pdfTemplateService->gerar(
                $request->input('tipo'),
                $request->input('id'),
                $request->input('company_slug'),
                auth()->id(),
            );

            $filename = 'GPI-' . $request->input('tipo') . '-' . substr($request->input('id'), 0, 8) . '.pdf';

            return response($pdf, 200, [
                'Content-Type'        => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Conteúdo não encontrado.'], 404);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Illuminate\Auth\Access\AuthorizationException) {
            return response()->json(['message' => 'Acesso não autorizado.'], 403);
        }
    }
}
