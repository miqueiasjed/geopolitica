<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ChatRecuperacaoService
{
    /**
     * Stopwords em português que devem ser ignoradas na extração de palavras-chave.
     */
    private const STOPWORDS_PT = [
        'de', 'da', 'do', 'das', 'dos', 'que', 'em', 'no', 'na', 'nos', 'nas',
        'um', 'uma', 'uns', 'umas', 'por', 'para', 'com', 'sem', 'sob', 'sobre',
        'entre', 'até', 'após', 'ante', 'como', 'mais', 'mas', 'nem', 'não',
        'sim', 'já', 'foi', 'ser', 'ter', 'seu', 'sua', 'seus', 'suas',
        'esse', 'essa', 'isso', 'este', 'esta', 'isto', 'eles', 'elas',
        'ele', 'ela', 'aos', 'pelo', 'pela', 'pelos', 'pelas', 'num', 'numa',
        'são', 'está', 'pode', 'tem', 'vai', 'era', 'isso',
    ];

    /**
     * Recupera contexto relevante das 4 fontes via busca FULLTEXT.
     * Aplica fallback com LIKE se total de resultados for insuficiente.
     * Retorna string vazia se nenhuma fonte retornar resultados.
     */
    public function recuperarContexto(string $pergunta): string
    {
        $resultados = [];

        try {
            $resultadosConteudos    = $this->buscarConteudos($pergunta);
            $resultadosEventos      = $this->buscarEventos($pergunta);
            $resultadosPaises       = $this->buscarPerfisPaises($pergunta);
            $resultadosCrises       = $this->buscarCrisesHistoricas($pergunta);

            $resultados = array_merge(
                $resultadosConteudos,
                $resultadosEventos,
                $resultadosPaises,
                $resultadosCrises,
            );
        } catch (\Throwable $excecao) {
            Log::warning('ChatRecuperacaoService: erro na busca FULLTEXT', [
                'erro' => $excecao->getMessage(),
            ]);
        }

        if (count($resultados) < 3) {
            $resultados = array_merge($resultados, $this->buscarFallbackLike($pergunta, $resultados));
        }

        if (empty($resultados)) {
            return '';
        }

        $contextoFormatado = implode("\n\n", $resultados);

        $contextoFormatado = mb_substr($contextoFormatado, 0, 4000);

        return "CONTEXTO DO CANAL:\n{$contextoFormatado}\n\nTOTAL: " . count($resultados) . " fontes encontradas.";
    }

    // -------------------------------------------------------------------------
    // Buscas FULLTEXT por fonte
    // -------------------------------------------------------------------------

    /**
     * Busca FULLTEXT na tabela conteudos (titulo + corpo).
     *
     * @return string[]
     */
    private function buscarConteudos(string $pergunta): array
    {
        $linhas = DB::select(
            'SELECT titulo, corpo FROM conteudos
             WHERE MATCH(titulo, corpo) AGAINST(? IN BOOLEAN MODE)
             ORDER BY publicado_em DESC
             LIMIT 3',
            [$pergunta],
        );

        return array_map(function (object $linha): string {
            $corpo = mb_substr((string) ($linha->corpo ?? ''), 0, 300);

            return "[Biblioteca] {$linha->titulo}: {$corpo}";
        }, $linhas);
    }

    /**
     * Busca FULLTEXT na tabela events (titulo + resumo).
     *
     * @return string[]
     */
    private function buscarEventos(string $pergunta): array
    {
        $linhas = DB::select(
            'SELECT titulo, resumo, impact_label FROM events
             WHERE MATCH(titulo, resumo) AGAINST(? IN BOOLEAN MODE)
             ORDER BY created_at DESC
             LIMIT 3',
            [$pergunta],
        );

        return array_map(function (object $linha): string {
            $nivel   = $linha->impact_label ?? 'desconhecido';
            $resumo  = mb_substr((string) ($linha->resumo ?? ''), 0, 200);

            return "[Evento - {$nivel}] {$linha->titulo}: {$resumo}";
        }, $linhas);
    }

    /**
     * Busca FULLTEXT na tabela perfis_paises (contexto_geopolitico + analise_lideranca).
     *
     * @return string[]
     */
    private function buscarPerfisPaises(string $pergunta): array
    {
        $linhas = DB::select(
            'SELECT nome_pt, contexto_geopolitico FROM perfis_paises
             WHERE MATCH(contexto_geopolitico, analise_lideranca) AGAINST(? IN BOOLEAN MODE)
             AND contexto_geopolitico IS NOT NULL
             LIMIT 2',
            [$pergunta],
        );

        return array_map(function (object $linha): string {
            $contexto = mb_substr((string) ($linha->contexto_geopolitico ?? ''), 0, 200);

            return "[País: {$linha->nome_pt}] {$contexto}";
        }, $linhas);
    }

    /**
     * Busca FULLTEXT na tabela crises_historicas (titulo + contexto_geopolitico).
     *
     * @return string[]
     */
    private function buscarCrisesHistoricas(string $pergunta): array
    {
        $linhas = DB::select(
            'SELECT titulo, contexto_geopolitico FROM crises_historicas
             WHERE MATCH(titulo, contexto_geopolitico) AGAINST(? IN BOOLEAN MODE)
             LIMIT 2',
            [$pergunta],
        );

        return array_map(function (object $linha): string {
            $contexto = mb_substr((string) ($linha->contexto_geopolitico ?? ''), 0, 200);

            return "[Crise Histórica] {$linha->titulo}: {$contexto}";
        }, $linhas);
    }

    // -------------------------------------------------------------------------
    // Fallback LIKE
    // -------------------------------------------------------------------------

    /**
     * Extrai palavras-chave da pergunta (sem stopwords, com 4+ chars) e realiza
     * busca LIKE nas 4 fontes para complementar resultados insuficientes.
     *
     * @param  string[] $jaEncontrados Resultados já obtidos via FULLTEXT (para evitar duplicatas).
     * @return string[]
     */
    private function buscarFallbackLike(string $pergunta, array $jaEncontrados): array
    {
        $palavrasChave = $this->extrairPalavrasChave($pergunta);

        if (empty($palavrasChave)) {
            return [];
        }

        $resultados = [];

        foreach ($palavrasChave as $palavra) {
            $termo = "%{$palavra}%";

            $resultados = array_merge(
                $resultados,
                $this->fallbackConteudos($termo, $jaEncontrados),
                $this->fallbackEventos($termo, $jaEncontrados),
                $this->fallbackPerfisPaises($termo, $jaEncontrados),
                $this->fallbackCrisesHistoricas($termo, $jaEncontrados),
            );

            if (count($jaEncontrados) + count($resultados) >= 3) {
                break;
            }
        }

        return $resultados;
    }

    /**
     * Fallback LIKE para conteudos.
     *
     * @param  string[] $jaEncontrados
     * @return string[]
     */
    private function fallbackConteudos(string $termo, array $jaEncontrados): array
    {
        $linhas = DB::select(
            'SELECT titulo, corpo FROM conteudos
             WHERE titulo LIKE ? OR corpo LIKE ?
             ORDER BY publicado_em DESC
             LIMIT 2',
            [$termo, $termo],
        );

        $novasEntradas = [];

        foreach ($linhas as $linha) {
            $formatado = "[Biblioteca] {$linha->titulo}: " . mb_substr((string) ($linha->corpo ?? ''), 0, 300);

            if (! in_array($formatado, $jaEncontrados, true)) {
                $novasEntradas[] = $formatado;
            }
        }

        return $novasEntradas;
    }

    /**
     * Fallback LIKE para events.
     *
     * @param  string[] $jaEncontrados
     * @return string[]
     */
    private function fallbackEventos(string $termo, array $jaEncontrados): array
    {
        $linhas = DB::select(
            'SELECT titulo, resumo, impact_label FROM events
             WHERE titulo LIKE ? OR resumo LIKE ?
             ORDER BY created_at DESC
             LIMIT 2',
            [$termo, $termo],
        );

        $novasEntradas = [];

        foreach ($linhas as $linha) {
            $nivel     = $linha->impact_label ?? 'desconhecido';
            $formatado = "[Evento - {$nivel}] {$linha->titulo}: " . mb_substr((string) ($linha->resumo ?? ''), 0, 200);

            if (! in_array($formatado, $jaEncontrados, true)) {
                $novasEntradas[] = $formatado;
            }
        }

        return $novasEntradas;
    }

    /**
     * Fallback LIKE para perfis_paises.
     *
     * @param  string[] $jaEncontrados
     * @return string[]
     */
    private function fallbackPerfisPaises(string $termo, array $jaEncontrados): array
    {
        $linhas = DB::select(
            'SELECT nome_pt, contexto_geopolitico FROM perfis_paises
             WHERE (contexto_geopolitico LIKE ? OR analise_lideranca LIKE ?)
             AND contexto_geopolitico IS NOT NULL
             LIMIT 1',
            [$termo, $termo],
        );

        $novasEntradas = [];

        foreach ($linhas as $linha) {
            $contexto  = mb_substr((string) ($linha->contexto_geopolitico ?? ''), 0, 200);
            $formatado = "[País: {$linha->nome_pt}] {$contexto}";

            if (! in_array($formatado, $jaEncontrados, true)) {
                $novasEntradas[] = $formatado;
            }
        }

        return $novasEntradas;
    }

    /**
     * Fallback LIKE para crises_historicas.
     *
     * @param  string[] $jaEncontrados
     * @return string[]
     */
    private function fallbackCrisesHistoricas(string $termo, array $jaEncontrados): array
    {
        $linhas = DB::select(
            'SELECT titulo, contexto_geopolitico FROM crises_historicas
             WHERE titulo LIKE ? OR contexto_geopolitico LIKE ?
             LIMIT 1',
            [$termo, $termo],
        );

        $novasEntradas = [];

        foreach ($linhas as $linha) {
            $contexto  = mb_substr((string) ($linha->contexto_geopolitico ?? ''), 0, 200);
            $formatado = "[Crise Histórica] {$linha->titulo}: {$contexto}";

            if (! in_array($formatado, $jaEncontrados, true)) {
                $novasEntradas[] = $formatado;
            }
        }

        return $novasEntradas;
    }

    // -------------------------------------------------------------------------
    // Extração de palavras-chave
    // -------------------------------------------------------------------------

    /**
     * Extrai as 3 primeiras palavras com 4+ caracteres, excluindo stopwords PT.
     *
     * @return string[]
     */
    private function extrairPalavrasChave(string $pergunta): array
    {
        $palavras = preg_split('/\s+/', mb_strtolower(trim($pergunta)));

        if ($palavras === false) {
            return [];
        }

        $filtradas = array_filter(
            $palavras,
            fn (string $palavra): bool =>
                mb_strlen($palavra) >= 4 &&
                ! in_array($palavra, self::STOPWORDS_PT, true),
        );

        return array_slice(array_values($filtradas), 0, 3);
    }
}
