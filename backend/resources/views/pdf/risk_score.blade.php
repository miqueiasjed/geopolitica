@extends('pdf.layout')

@section('content')
@php
    $score    = $carteira['ultimo_score'];
    $total    = $score['total'];
    $breakdown = $score['breakdown'] ?? [];
    $alertas  = $score['alertas']   ?? [];
    $topRiscos = $score['top_riscos'] ?? [];

    $corTotal   = $total >= 70 ? '#EF4444' : ($total >= 40 ? '#FACC15' : '#4ade80');
    $labelTotal = $total >= 70 ? 'ALTO'    : ($total >= 40 ? 'MÉDIO'   : 'BAIXO');

    $nomesCategorias = [
        'energia'   => 'Energia',
        'alimentos' => 'Alimentos',
        'cambio'    => 'Câmbio',
        'militar'   => 'Militar',
    ];

    function nivelScore(int $valor): string
    {
        if ($valor >= 70) return 'ALTO';
        if ($valor >= 40) return 'MÉDIO';
        return 'BAIXO';
    }

    function corScore(int $valor): string
    {
        if ($valor >= 70) return '#EF4444';
        if ($valor >= 40) return '#FACC15';
        return '#4ade80';
    }
@endphp

<div class="risk-score-content">

    {{-- Cabeçalho --}}
    <h1 style="
        font-family: Georgia, serif;
        font-size: 18pt;
        font-weight: bold;
        color: #1a1a1b;
        line-height: 1.3;
        margin-bottom: 6pt;
    ">Risk Score do Portfólio — {{ $carteira['nome'] ?? 'Minha Carteira' }}</h1>

    {{-- Data de cálculo --}}
    @if (!empty($score['calculado_em']))
        <p style="
            font-family: Georgia, serif;
            font-size: 8.5pt;
            color: #9ca3af;
            margin-bottom: 20pt;
        ">
            Calculado em {{ \Carbon\Carbon::parse($score['calculado_em'])->locale('pt_BR')->isoFormat('D [de] MMMM [de] YYYY[,] HH:mm') }}
        </p>
    @endif

    {{-- Score Total --}}
    <div style="
        display: table;
        width: 100%;
        margin-bottom: 24pt;
        padding: 16pt 20pt;
        background-color: #f9fafb;
        border-left: 5px solid {{ $corTotal }};
    ">
        <div style="display: table-cell; vertical-align: middle;">
            <p style="
                font-family: Georgia, serif;
                font-size: 8pt;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: #6b7280;
                margin-bottom: 4pt;
            ">Score Total de Risco Geopolítico</p>
            <p style="
                font-family: Georgia, serif;
                font-size: 36pt;
                font-weight: bold;
                color: {{ $corTotal }};
                line-height: 1;
                margin-bottom: 4pt;
            ">{{ $total }}<span style="font-size:16pt;color:#9ca3af;">/100</span></p>
        </div>
        <div style="display: table-cell; vertical-align: middle; text-align: right;">
            <span style="
                font-family: Georgia, serif;
                font-size: 14pt;
                font-weight: bold;
                color: {{ $corTotal }};
                border: 2px solid {{ $corTotal }};
                padding: 6pt 14pt;
                text-transform: uppercase;
                letter-spacing: 0.08em;
            ">{{ $labelTotal }}</span>
        </div>
    </div>

    {{-- Tabela de Composição da Carteira --}}
    @if (!empty($carteira['ativos']) && is_array($carteira['ativos']))
        <div style="margin-bottom: 20pt;">
            <p style="
                font-family: Georgia, serif;
                font-size: 9pt;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: #C9B882;
                margin-bottom: 8pt;
            ">Composição da Carteira</p>

            <table style="
                width: 100%;
                border-collapse: collapse;
                font-family: Georgia, serif;
                font-size: 9.5pt;
            ">
                <thead>
                    <tr style="background-color: #1a1a1b;">
                        <th style="
                            text-align: left;
                            padding: 7pt 10pt;
                            color: #C9B882;
                            font-size: 8pt;
                            text-transform: uppercase;
                            letter-spacing: 0.08em;
                        ">Ativo</th>
                        <th style="
                            text-align: right;
                            padding: 7pt 10pt;
                            color: #C9B882;
                            font-size: 8pt;
                            text-transform: uppercase;
                            letter-spacing: 0.08em;
                        ">Peso</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($carteira['ativos'] as $i => $ativo)
                        <tr style="background-color: {{ $i % 2 === 0 ? '#ffffff' : '#f9fafb' }};">
                            <td style="
                                padding: 6pt 10pt;
                                color: #1a1a1b;
                                font-weight: bold;
                            ">{{ $ativo['ticker'] ?? '—' }}</td>
                            <td style="
                                padding: 6pt 10pt;
                                color: #4b5563;
                                text-align: right;
                            ">{{ number_format(($ativo['peso'] ?? 0) * 100, 0) }}%</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    @endif

    {{-- Breakdown por Categoria --}}
    @if (!empty($breakdown))
        <div style="margin-bottom: 20pt;">
            <p style="
                font-family: Georgia, serif;
                font-size: 9pt;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: #C9B882;
                margin-bottom: 8pt;
            ">Breakdown por Categoria</p>

            <table style="
                width: 100%;
                border-collapse: collapse;
                font-family: Georgia, serif;
                font-size: 9.5pt;
            ">
                <thead>
                    <tr style="background-color: #1a1a1b;">
                        <th style="
                            text-align: left;
                            padding: 7pt 10pt;
                            color: #C9B882;
                            font-size: 8pt;
                            text-transform: uppercase;
                            letter-spacing: 0.08em;
                        ">Categoria</th>
                        <th style="
                            text-align: center;
                            padding: 7pt 10pt;
                            color: #C9B882;
                            font-size: 8pt;
                            text-transform: uppercase;
                            letter-spacing: 0.08em;
                        ">Score</th>
                        <th style="
                            text-align: center;
                            padding: 7pt 10pt;
                            color: #C9B882;
                            font-size: 8pt;
                            text-transform: uppercase;
                            letter-spacing: 0.08em;
                        ">Nível</th>
                    </tr>
                </thead>
                <tbody>
                    @php $idxCat = 0; @endphp
                    @foreach ($nomesCategorias as $chave => $nomeCat)
                        @if (isset($breakdown[$chave]))
                            @php
                                $valCat  = (int) $breakdown[$chave];
                                $corCat  = corScore($valCat);
                                $lblCat  = nivelScore($valCat);
                            @endphp
                            <tr style="background-color: {{ $idxCat % 2 === 0 ? '#ffffff' : '#f9fafb' }};">
                                <td style="padding: 6pt 10pt; color: #1a1a1b;">{{ $nomeCat }}</td>
                                <td style="
                                    padding: 6pt 10pt;
                                    text-align: center;
                                    font-weight: bold;
                                    color: {{ $corCat }};
                                ">{{ $valCat }}</td>
                                <td style="
                                    padding: 6pt 10pt;
                                    text-align: center;
                                    font-size: 8pt;
                                    font-weight: bold;
                                    color: {{ $corCat }};
                                    text-transform: uppercase;
                                    letter-spacing: 0.06em;
                                ">{{ $lblCat }}</td>
                            </tr>
                            @php $idxCat++; @endphp
                        @endif
                    @endforeach
                </tbody>
            </table>
        </div>
    @endif

    {{-- Alertas Preditivos --}}
    @if (!empty($alertas) && is_array($alertas) && count($alertas) > 0)
        <div style="margin-bottom: 20pt;">
            <p style="
                font-family: Georgia, serif;
                font-size: 9pt;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: #C9B882;
                margin-bottom: 10pt;
            ">Alertas Preditivos</p>

            @foreach ($alertas as $alerta)
                @php
                    $nivelAlerta = strtolower($alerta['level'] ?? 'medium');
                    $corAlerta   = match($nivelAlerta) {
                        'high', 'critical' => '#EF4444',
                        'medium'           => '#FACC15',
                        default            => '#4ade80',
                    };
                    $lblAlerta = match($nivelAlerta) {
                        'high', 'critical' => 'ALTO',
                        'medium'           => 'MÉDIO',
                        default            => 'BAIXO',
                    };
                @endphp
                <div style="
                    display: table;
                    width: 100%;
                    margin-bottom: 8pt;
                    padding: 8pt 12pt;
                    border-left: 4px solid {{ $corAlerta }};
                    background-color: #f9fafb;
                ">
                    <div style="display: table-cell; vertical-align: middle;">
                        <p style="
                            font-family: Georgia, serif;
                            font-size: 9.5pt;
                            color: #1a1a1b;
                            margin: 0;
                        ">{{ $alerta['title'] ?? '—' }}</p>
                    </div>
                    <div style="display: table-cell; vertical-align: middle; text-align: right; white-space: nowrap;">
                        <span style="
                            font-family: Georgia, serif;
                            font-size: 7.5pt;
                            font-weight: bold;
                            color: {{ $corAlerta }};
                            text-transform: uppercase;
                            letter-spacing: 0.06em;
                        ">{{ $lblAlerta }}</span>
                    </div>
                </div>
            @endforeach
        </div>
    @endif

    {{-- Top riscos --}}
    @if (!empty($topRiscos) && is_array($topRiscos) && count($topRiscos) > 0)
        <div style="
            margin-top: 16pt;
            padding-top: 10pt;
            border-top: 1px solid #e5e7eb;
            font-family: Georgia, serif;
            font-size: 8pt;
            color: #9ca3af;
        ">
            Principais vetores de risco:
            @foreach ($topRiscos as $risco)
                <span style="color: #C9B882; font-weight: bold;">{{ $risco }}</span>@if (!$loop->last), @endif
            @endforeach
        </div>
    @endif

</div>
@endsection
