<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GdeltFetcherService
{
    private const ENDPOINT = 'https://api.gdeltproject.org/api/v2/summary/summary?d=web&t=summary&k=&ts=custom&sdt=&edt=&svt=zoom&stab=1&mode=pointdata&fmt=json';

    /**
     * Busca eventos da GDELT API v2 e retorna array normalizado por país.
     *
     * @return array<int, array{codigo_pais: string, nome_pais: string, total_eventos: int, tom_medio: float, intensidade_gdelt: float, atualizado_em: string}>
     */
    public function fetch(): array
    {
        try {
            $resposta = Http::timeout(30)->get(self::ENDPOINT);

            if ($resposta->failed()) {
                Log::warning('GdeltFetcherService: resposta com falha da API.', [
                    'status' => $resposta->status(),
                ]);

                return [];
            }

            $dados = $resposta->json();

            if (empty($dados)) {
                Log::warning('GdeltFetcherService: resposta vazia ou inválida da API.');

                return [];
            }

            return $this->normalizar($dados);
        } catch (\Throwable $e) {
            Log::warning('GdeltFetcherService: erro ao buscar dados da GDELT.', [
                'erro' => $e->getMessage(),
            ]);

            return [];
        }
    }

    /**
     * Normaliza a resposta bruta da GDELT para o formato do GdeltCache.
     */
    private function normalizar(array $dados): array
    {
        $registros = [];
        $agora     = now()->toDateTimeString();

        // A GDELT pointdata retorna um array de pontos com campos variados.
        // Tentamos extrair os campos conhecidos de cada entrada.
        $pontos = $dados['pointdata'] ?? $dados['data'] ?? $dados ?? [];

        if (! is_array($pontos)) {
            Log::warning('GdeltFetcherService: formato de resposta desconhecido.', [
                'chaves' => array_keys($dados),
            ]);

            return [];
        }

        foreach ($pontos as $ponto) {
            if (! is_array($ponto)) {
                continue;
            }

            $codigoPais = $ponto['countrycode'] ?? $ponto['country'] ?? $ponto['geo_countrycode'] ?? null;
            $nomePais   = $ponto['countryname'] ?? $ponto['name'] ?? $ponto['geo_fullname'] ?? $codigoPais;
            $totalEventos = (int) ($ponto['count'] ?? $ponto['numarts'] ?? $ponto['eventcount'] ?? 0);
            $tomMedio     = (float) ($ponto['tone'] ?? $ponto['avgtone'] ?? $ponto['tonemean'] ?? 0.0);

            if (empty($codigoPais)) {
                continue;
            }

            $intensidade = $this->calcularIntensidade($tomMedio);

            $registros[] = [
                'codigo_pais'      => strtoupper(trim($codigoPais)),
                'nome_pais'        => $nomePais ?? strtoupper(trim($codigoPais)),
                'total_eventos'    => $totalEventos,
                'tom_medio'        => $tomMedio,
                'intensidade_gdelt' => $intensidade,
                'atualizado_em'    => $agora,
            ];
        }

        return $registros;
    }

    /**
     * Normaliza o tom médio para escala de intensidade 1–10.
     * Fórmula: round(((tom * -1) + 100) / 20) + 1, clampado entre 1 e 10.
     */
    private function calcularIntensidade(float $tom): float
    {
        $intensidade = round((($tom * -1) + 100) / 20) + 1;

        return (float) max(1, min(10, $intensidade));
    }
}
