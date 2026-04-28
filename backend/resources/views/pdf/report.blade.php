@extends('pdf.layout')

@section('content')
@php
    /**
     * Converte Markdown básico para HTML.
     * Suporte: cabeçalhos ## e parágrafos.
     */
    function converterMarkdownSimples(string $texto): string
    {
        $linhas    = explode("\n", $texto);
        $html      = '';
        $paragrafo = '';

        foreach ($linhas as $linha) {
            $linha = rtrim($linha);

            // Cabeçalho nível 2 (##)
            if (str_starts_with($linha, '## ')) {
                if ($paragrafo !== '') {
                    $html     .= '<p style="font-family:Georgia,serif;font-size:10pt;line-height:1.8;color:#1a1a1b;margin-bottom:8pt;">'
                        . nl2br(htmlspecialchars($paragrafo, ENT_QUOTES, 'UTF-8')) . '</p>';
                    $paragrafo = '';
                }
                $titulo = htmlspecialchars(substr($linha, 3), ENT_QUOTES, 'UTF-8');
                $html  .= '<h2 style="font-family:Georgia,serif;font-size:13pt;font-weight:bold;color:#1a1a1b;'
                    . 'margin-top:16pt;margin-bottom:6pt;border-bottom:1px solid #e5e7eb;padding-bottom:4pt;">'
                    . $titulo . '</h2>';
                continue;
            }

            // Linha em branco — fechar parágrafo
            if ($linha === '') {
                if ($paragrafo !== '') {
                    $html     .= '<p style="font-family:Georgia,serif;font-size:10pt;line-height:1.8;color:#1a1a1b;margin-bottom:8pt;">'
                        . nl2br(htmlspecialchars($paragrafo, ENT_QUOTES, 'UTF-8')) . '</p>';
                    $paragrafo = '';
                }
                continue;
            }

            // Acumular texto no parágrafo corrente
            $paragrafo .= ($paragrafo !== '' ? "\n" : '') . $linha;
        }

        // Fechar parágrafo pendente
        if ($paragrafo !== '') {
            $html .= '<p style="font-family:Georgia,serif;font-size:10pt;line-height:1.8;color:#1a1a1b;margin-bottom:8pt;">'
                . nl2br(htmlspecialchars($paragrafo, ENT_QUOTES, 'UTF-8')) . '</p>';
        }

        return $html;
    }
@endphp

<div class="report-content">

    {{-- Título --}}
    <h1 style="
        font-family: Georgia, serif;
        font-size: 22pt;
        font-weight: bold;
        color: #1a1a1b;
        line-height: 1.25;
        margin-bottom: 8pt;
    ">{{ $relatorio->title }}</h1>

    {{-- Tema --}}
    @if (!empty($relatorio->topic))
        <p style="
            font-family: Georgia, serif;
            font-size: 11pt;
            font-weight: bold;
            color: #C9B882;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 6pt;
        ">{{ $relatorio->topic }}</p>
    @endif

    {{-- Escopo --}}
    @if (!empty($relatorio->scope))
        <p style="
            font-family: Georgia, serif;
            font-size: 9.5pt;
            font-style: italic;
            color: #4b5563;
            margin-bottom: 16pt;
        ">{{ $relatorio->scope }}</p>
    @endif

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin-bottom: 20pt;">

    {{-- Corpo do relatório (Markdown convertido) --}}
    <div style="margin-bottom: 20pt;">
        {!! converterMarkdownSimples($relatorio->body ?? '') !!}
    </div>

    {{-- Fontes consultadas --}}
    @if (!empty($relatorio->sources_used) && is_array($relatorio->sources_used) && count($relatorio->sources_used) > 0)
        <div style="margin-top: 24pt; padding-top: 14pt; border-top: 2px solid #C9B882;">
            <p style="
                font-size: 8pt;
                font-family: Georgia, serif;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: #C9B882;
                margin-bottom: 8pt;
            ">Fontes consultadas</p>
            <ul style="margin: 0; padding-left: 16pt;">
                @foreach ($relatorio->sources_used as $fonte)
                    <li style="
                        font-family: Georgia, serif;
                        font-size: 9pt;
                        color: #4b5563;
                        margin-bottom: 4pt;
                    ">{{ $fonte }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    {{-- Metadados --}}
    <div style="
        margin-top: 28pt;
        padding-top: 10pt;
        border-top: 1px solid #e5e7eb;
        font-family: Georgia, serif;
        font-size: 8pt;
        color: #9ca3af;
    ">
        @if (!empty($relatorio->word_count))
            {{ number_format($relatorio->word_count) }} palavras
            &nbsp;|&nbsp;
        @endif
        Gerado em {{ \Carbon\Carbon::parse($relatorio->created_at)->locale('pt_BR')->isoFormat('D [de] MMMM [de] YYYY') }}
    </div>

</div>
@endsection
