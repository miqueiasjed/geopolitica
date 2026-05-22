<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use PhpOffice\PhpWord\IOFactory;
use Smalot\PdfParser\Parser as PdfParser;

class AdminImportarBriefingController extends Controller
{
    public function parsear(Request $request): JsonResponse
    {
        $request->validate([
            'arquivo' => ['required', 'file', 'mimes:docx,pdf', 'max:10240'],
        ]);

        $arquivo  = $request->file('arquivo');
        $caminho  = $arquivo->getPathname();
        $extensao = strtolower($arquivo->getClientOriginalExtension());

        try {
            if ($extensao === 'pdf') {
                $resultado = $this->parsearPdf($caminho);
            } else {
                $phpWord    = IOFactory::load($caminho, 'Word2007');
                $paragrafos = $this->extrairParagrafos($phpWord);
                $resultado  = $this->parsearEstrutura($paragrafos);
            }
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Não foi possível processar o arquivo.'], 422);
        }

        return response()->json($resultado);
    }

    private function parsearPdf(string $caminho): array
    {
        $parser = new PdfParser();
        $pdf    = $parser->parseFile($caminho);
        $texto  = $pdf->getText();

        $linhas     = array_filter(array_map('trim', explode("\n", $texto)), fn ($l) => $l !== '');
        $paragrafos = array_values($linhas);

        $resultado = $this->parsearEstrutura($paragrafos);

        if ($resultado['corpo'] === '') {
            $html = implode('', array_map(fn ($p) => '<p>' . e($p) . '</p>', $paragrafos));
            $resultado['corpo'] = $html;
        }

        return $resultado;
    }

    private function extrairParagrafos(\PhpOffice\PhpWord\PhpWord $phpWord): array
    {
        $paragrafos = [];

        foreach ($phpWord->getSections() as $secao) {
            foreach ($secao->getElements() as $elemento) {
                if ($elemento instanceof \PhpOffice\PhpWord\Element\TextRun ||
                    $elemento instanceof \PhpOffice\PhpWord\Element\Title) {
                    $texto = $this->textoDoElemento($elemento);
                    $paragrafos[] = trim($texto);
                } elseif ($elemento instanceof \PhpOffice\PhpWord\Element\Text) {
                    $paragrafos[] = trim($elemento->getText());
                }
            }
        }

        return array_values(array_filter($paragrafos, fn ($p) => $p !== ''));
    }

    private function textoDoElemento(object $elemento): string
    {
        $texto = '';

        if (method_exists($elemento, 'getElements')) {
            foreach ($elemento->getElements() as $filho) {
                if ($filho instanceof \PhpOffice\PhpWord\Element\Text) {
                    $texto .= $filho->getText();
                } elseif ($filho instanceof \PhpOffice\PhpWord\Element\TextRun) {
                    $texto .= $this->textoDoElemento($filho);
                } elseif (method_exists($filho, 'getText')) {
                    $texto .= $filho->getText();
                }
            }
        } elseif (method_exists($elemento, 'getText')) {
            $texto = $elemento->getText();
        }

        return $texto;
    }

    private function parsearEstrutura(array $paragrafos): array
    {
        $edicao = null;
        $autor  = null;
        $secoes = [];
        $secaoAtual = null;
        $conteudoAtual = [];

        $headingsConhecidos = [
            'O FATO',
            'O QUE ESTÁ POR TRÁS',
            'IMPLICAÇÕES ECONÔMICAS',
            'IMPLICAÇÕES ECONÔMICAS, GLOBAL E BRASIL',
            'O QUE MONITORAR',
        ];

        $isSeparador = fn (string $p) => preg_match('/^[─━—\-]{3,}$/', $p);
        $isDisclaimer = fn (string $p) => str_contains(strtolower($p), 'exclusivamente analítico') ||
            str_contains(strtolower($p), 'não constitui recomendação');

        foreach ($paragrafos as $p) {
            if ($isSeparador($p) || $isDisclaimer($p)) {
                continue;
            }

            if ($edicao === null && preg_match('/Nº\s*(\d+)/u', $p, $m)) {
                $edicao = (int) $m[1];
                continue;
            }

            if ($autor === null && preg_match('/^Por\s+(.+)$/u', $p, $m)) {
                $autor = trim($m[1]);
                continue;
            }

            // Linha de data — ignora
            if (preg_match('/^\w+feira,\s+\d+\s+de\s+\w+\s+de\s+\d{4}$/u', $p)) {
                continue;
            }

            $ehHeading = false;
            foreach ($headingsConhecidos as $h) {
                if (mb_strtoupper($p) === mb_strtoupper($h)) {
                    $ehHeading = true;
                    break;
                }
            }

            if (! $ehHeading && mb_strtoupper($p) === $p && mb_strlen($p) <= 80 && mb_strlen($p) >= 3) {
                $ehHeading = true;
            }

            if ($ehHeading) {
                if ($secaoAtual !== null) {
                    $secoes[] = ['heading' => $secaoAtual, 'paragrafos' => $conteudoAtual];
                }
                $secaoAtual    = $p;
                $conteudoAtual = [];
            } else {
                $conteudoAtual[] = $p;
            }
        }

        if ($secaoAtual !== null) {
            $secoes[] = ['heading' => $secaoAtual, 'paragrafos' => $conteudoAtual];
        }

        $html = '';
        foreach ($secoes as $secao) {
            $html .= '<h2>' . e($secao['heading']) . '</h2>';
            foreach ($secao['paragrafos'] as $pg) {
                $html .= '<p>' . e($pg) . '</p>';
            }
        }

        return [
            'edicao' => $edicao,
            'autor'  => $autor,
            'corpo'  => $html,
        ];
    }
}
