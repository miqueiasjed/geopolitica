<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\ImportarAssinantesLastlinkJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class ImportarAssinantesController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'arquivo' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
        ]);

        $caminho = $request->file('arquivo')->getRealPath();
        $handle  = fopen($caminho, 'r');

        if (! $handle) {
            return response()->json(['message' => 'Não foi possível ler o arquivo.'], 422);
        }

        $conteudo = stream_get_contents($handle);
        fclose($handle);

        if (! $conteudo) {
            return response()->json(['message' => 'Arquivo vazio.'], 422);
        }

        $separador  = $this->detectarSeparador(strtok($conteudo, "\n") ?: '');
        $linhasRaw  = array_filter(explode("\n", str_replace("\r\n", "\n", $conteudo)));
        $linhasRaw  = array_values($linhasRaw);

        if (empty($linhasRaw)) {
            return response()->json(['message' => 'Arquivo CSV inválido ou vazio.'], 422);
        }

        $cabecalhos = array_map(
            fn ($h) => mb_strtolower(trim(trim((string) $h, "\xEF\xBB\xBF"))),
            str_getcsv(array_shift($linhasRaw), $separador, '"')
        );

        $linhas = [];
        foreach ($linhasRaw as $raw) {
            $linha = str_getcsv($raw, $separador, '"');
            if (array_filter($linha)) {
                $linhas[] = $linha;
            }
        }

        if (empty($linhas)) {
            return response()->json(['message' => 'Nenhuma linha de dados encontrada no arquivo.'], 422);
        }

        $importacaoId = Str::uuid()->toString();
        $total        = count($linhas);
        $ttl          = now()->addHours(2);

        Cache::put("importacao:lastlink:{$importacaoId}:total",       $total, $ttl);
        Cache::put("importacao:lastlink:{$importacaoId}:processados",  0,      $ttl);
        Cache::put("importacao:lastlink:{$importacaoId}:erros_count",  0,      $ttl);
        Cache::put("importacao:lastlink:{$importacaoId}:erros",        [],     $ttl);

        foreach ($linhas as $linha) {
            ImportarAssinantesLastlinkJob::dispatch($linha, $cabecalhos, $importacaoId);
        }

        return response()->json([
            'importacao_id' => $importacaoId,
            'total'         => $total,
            'message'       => "{$total} registros enfileirados para importação.",
        ], 202);
    }

    public function status(string $id): JsonResponse
    {
        $total       = (int) Cache::get("importacao:lastlink:{$id}:total",       0);
        $processados = (int) Cache::get("importacao:lastlink:{$id}:processados",  0);
        $errosCount  = (int) Cache::get("importacao:lastlink:{$id}:erros_count",  0);
        $erros       = (array) Cache::get("importacao:lastlink:{$id}:erros",      []);

        if ($total === 0) {
            return response()->json(['message' => 'Importação não encontrada.'], 404);
        }

        $sucesso = $processados - $errosCount;

        return response()->json([
            'total'       => $total,
            'processados' => $processados,
            'sucesso'     => max(0, $sucesso),
            'erros_count' => $errosCount,
            'erros'       => $erros,
            'concluido'   => $processados >= $total,
            'percentual'  => (int) round(($processados / $total) * 100),
        ]);
    }

    private function detectarSeparador(string $linha): string
    {
        return substr_count($linha, ';') > substr_count($linha, ',') ? ';' : ',';
    }
}
