<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GdeltFetcherService
{
    private const BASE_URL = 'https://api.gdeltproject.org/api/v2/doc/doc';

    private const PARAMS = [
        'query'      => 'conflict war tension military sanctions attack crisis',
        'mode'       => 'ArtList',
        'format'     => 'json',
        'timespan'   => '24h',
        'maxrecords' => '250',
    ];

    private const PAISES = [
        'Afghanistan' => 'AF', 'Albania' => 'AL', 'Algeria' => 'DZ', 'Angola' => 'AO',
        'Argentina' => 'AR', 'Armenia' => 'AM', 'Australia' => 'AU', 'Austria' => 'AT',
        'Azerbaijan' => 'AZ', 'Bahrain' => 'BH', 'Bangladesh' => 'BD', 'Belarus' => 'BY',
        'Belgium' => 'BE', 'Bolivia' => 'BO', 'Bosnia and Herzegovina' => 'BA', 'Brazil' => 'BR',
        'Bulgaria' => 'BG', 'Cambodia' => 'KH', 'Cameroon' => 'CM', 'Canada' => 'CA',
        'Chile' => 'CL', 'China' => 'CN', 'Colombia' => 'CO', 'Congo' => 'CG',
        'Croatia' => 'HR', 'Cuba' => 'CU', 'Czech Republic' => 'CZ', 'Denmark' => 'DK',
        'Ecuador' => 'EC', 'Egypt' => 'EG', 'Ethiopia' => 'ET', 'Finland' => 'FI',
        'France' => 'FR', 'Georgia' => 'GE', 'Germany' => 'DE', 'Ghana' => 'GH',
        'Greece' => 'GR', 'Guatemala' => 'GT', 'Haiti' => 'HT', 'Honduras' => 'HN',
        'Hungary' => 'HU', 'India' => 'IN', 'Indonesia' => 'ID', 'Iran' => 'IR',
        'Iraq' => 'IQ', 'Ireland' => 'IE', 'Israel' => 'IL', 'Italy' => 'IT',
        'Japan' => 'JP', 'Jordan' => 'JO', 'Kazakhstan' => 'KZ', 'Kenya' => 'KE',
        'Kosovo' => 'XK', 'Kuwait' => 'KW', 'Kyrgyzstan' => 'KG', 'Lebanon' => 'LB',
        'Libya' => 'LY', 'Malaysia' => 'MY', 'Mali' => 'ML', 'Mexico' => 'MX',
        'Moldova' => 'MD', 'Morocco' => 'MA', 'Mozambique' => 'MZ', 'Myanmar' => 'MM',
        'Netherlands' => 'NL', 'Nicaragua' => 'NI', 'Niger' => 'NE', 'Nigeria' => 'NG',
        'North Korea' => 'KP', 'Norway' => 'NO', 'Pakistan' => 'PK', 'Palestine' => 'PS',
        'Panama' => 'PA', 'Peru' => 'PE', 'Philippines' => 'PH', 'Poland' => 'PL',
        'Portugal' => 'PT', 'Qatar' => 'QA', 'Romania' => 'RO', 'Russia' => 'RU',
        'Saudi Arabia' => 'SA', 'Senegal' => 'SN', 'Serbia' => 'RS', 'Somalia' => 'SO',
        'South Africa' => 'ZA', 'South Korea' => 'KR', 'South Sudan' => 'SS', 'Spain' => 'ES',
        'Sri Lanka' => 'LK', 'Sudan' => 'SD', 'Sweden' => 'SE', 'Switzerland' => 'CH',
        'Syria' => 'SY', 'Taiwan' => 'TW', 'Tajikistan' => 'TJ', 'Thailand' => 'TH',
        'Tunisia' => 'TN', 'Turkey' => 'TR', 'Turkmenistan' => 'TM', 'Uganda' => 'UG',
        'Ukraine' => 'UA', 'United Arab Emirates' => 'AE', 'United Kingdom' => 'GB',
        'United States' => 'US', 'Uzbekistan' => 'UZ', 'Venezuela' => 'VE', 'Vietnam' => 'VN',
        'Yemen' => 'YE', 'Zimbabwe' => 'ZW',
    ];

    public function fetch(): array
    {
        try {
            $resposta = Http::timeout(30)->get(self::BASE_URL, self::PARAMS);

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

    private function normalizar(array $dados): array
    {
        $artigos = $dados['articles'] ?? [];

        if (empty($artigos)) {
            Log::warning('GdeltFetcherService: nenhum artigo retornado pela API.', [
                'chaves' => array_keys($dados),
            ]);

            return [];
        }

        // Agrega artigos por país de origem
        $contagemPorPais = [];
        foreach ($artigos as $artigo) {
            $pais = $artigo['sourcecountry'] ?? null;
            if (empty($pais)) {
                continue;
            }
            $contagemPorPais[$pais] = ($contagemPorPais[$pais] ?? 0) + 1;
        }

        if (empty($contagemPorPais)) {
            Log::warning('GdeltFetcherService: nenhum artigo com sourcecountry.', [
                'total_artigos' => count($artigos),
                'exemplo'       => $artigos[0] ?? null,
            ]);

            return [];
        }

        $maxContagem = max(array_values($contagemPorPais));
        $agora       = now()->toDateTimeString();
        $registros   = [];

        foreach ($contagemPorPais as $nomePais => $total) {
            $codigoPais = self::PAISES[$nomePais] ?? null;

            if (! $codigoPais) {
                continue;
            }

            $intensidade = $this->calcularIntensidade($total, $maxContagem);

            $registros[] = [
                'codigo_pais'       => $codigoPais,
                'nome_pais'         => $nomePais,
                'total_eventos'     => $total,
                'tom_medio'         => 0.0,
                'intensidade_gdelt' => $intensidade,
                'atualizado_em'     => $agora,
            ];
        }

        Log::info('GdeltFetcherService: normalização concluída.', [
            'total_artigos'  => count($artigos),
            'paises_mapeados' => count($registros),
            'paises_sem_mapa' => count($contagemPorPais) - count($registros),
        ]);

        return $registros;
    }

    private function calcularIntensidade(int $total, int $maxTotal): float
    {
        if ($maxTotal === 0) {
            return 1.0;
        }

        $intensidade = round(($total / $maxTotal) * 9) + 1;

        return (float) max(1, min(10, $intensidade));
    }
}
