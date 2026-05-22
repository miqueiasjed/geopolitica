<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\Ai\AiProviderFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminEnriquecerBriefingController extends Controller
{
    public function enriquecer(Request $request): JsonResponse
    {
        $request->validate([
            'corpo' => ['required', 'string', 'min:100'],
        ]);

        if (! AiProviderFactory::hasApiKey()) {
            return response()->json(['message' => 'IA não configurada no servidor.'], 503);
        }

        $corpo = strip_tags($request->string('corpo')->toString());
        $corpo = mb_substr($corpo, 0, 8000);

        $sistema = <<<'SYS'
Você é um editor especialista em geopolítica e macroeconomia.
Analise o texto de um briefing e retorne um JSON com os campos abaixo.
Responda SOMENTE com o JSON, sem markdown, sem explicações.

Campos:
- titulo: string curta e objetiva (máx 120 chars) que capture o tema central
- regiao: região geográfica principal em português (ex: "América Latina", "Europa", "Oriente Médio")
- tags: array de 3 a 6 palavras-chave relevantes em português, minúsculas, sem acentos especiais
- resumo: parágrafo único de 2 a 3 frases resumindo o briefing (máx 400 chars)
SYS;

        $mensagens = [
            ['role' => 'user', 'content' => "Texto do briefing:\n\n{$corpo}"],
        ];

        try {
            $resposta = AiProviderFactory::make()->complete($sistema, $mensagens, 512, 0.3);
            $dados    = json_decode($resposta, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return response()->json(['message' => 'Resposta inválida da IA.'], 502);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erro ao consultar a IA: ' . $e->getMessage()], 502);
        }

        return response()->json([
            'titulo'  => $dados['titulo']  ?? null,
            'regiao'  => $dados['regiao']  ?? null,
            'tags'    => $dados['tags']    ?? [],
            'resumo'  => $dados['resumo']  ?? null,
        ]);
    }
}
