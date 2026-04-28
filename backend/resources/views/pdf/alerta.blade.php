@extends('pdf.layout')

@section('content')
@php
    $coresNivel = [
        'crítico'  => '#dc2626',
        'critico'  => '#dc2626',
        'high'     => '#ea580c',
        'alto'     => '#ea580c',
        'medium'   => '#ca8a04',
        'moderado' => '#ca8a04',
        'low'      => '#16a34a',
        'baixo'    => '#16a34a',
    ];

    $nivelNormalizado = mb_strtolower($alerta->nivel ?? '');
    $corNivel = $coresNivel[$nivelNormalizado] ?? '#6b7280';

    $labelNivel = match ($nivelNormalizado) {
        'crítico', 'critico' => 'Crítico',
        'high', 'alto'       => 'Alto',
        'medium', 'moderado' => 'Moderado',
        'low', 'baixo'       => 'Baixo',
        default              => ucfirst($alerta->nivel ?? 'Indefinido'),
    };

    $sinais = $alerta->resumo_sinais ?? [];
    if (is_string($sinais)) {
        $sinaisDecodificados = json_decode($sinais, true);
        $sinais = is_array($sinaisDecodificados) ? $sinaisDecodificados : [$sinais];
    }
@endphp

<div class="alerta-content">

    {{-- Badge de nível --}}
    <div style="margin-bottom: 16pt;">
        <span style="
            display: inline-block;
            background-color: {{ $corNivel }};
            color: #ffffff;
            font-size: 7.5pt;
            font-family: Georgia, serif;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            padding: 3pt 10pt;
        ">{{ $labelNivel }}</span>

        @if (!empty($alerta->regiao))
            <span style="
                font-size: 7.5pt;
                font-family: Georgia, serif;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: #6b7280;
                margin-left: 8pt;
            ">{{ $alerta->regiao }}</span>
        @endif
    </div>

    {{-- Título --}}
    <h1 style="
        font-family: Georgia, serif;
        font-size: 16pt;
        font-weight: bold;
        color: #1a1a1b;
        line-height: 1.3;
        margin-bottom: 6pt;
    ">{{ $alerta->titulo }}</h1>

    {{-- Data --}}
    <p style="
        font-size: 8pt;
        color: #9ca3af;
        margin-bottom: 20pt;
        letter-spacing: 0.03em;
    ">
        {{ \Carbon\Carbon::parse($alerta->created_at)->locale('pt_BR')->isoFormat('D [de] MMMM [de] YYYY') }}
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin-bottom: 20pt;">

    {{-- Sinais detectados --}}
    @if (!empty($sinais) && count($sinais) > 0)
        <div style="margin-bottom: 20pt;">
            <h3 style="
                font-family: Georgia, serif;
                font-size: 9pt;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: #C9B882;
                margin-bottom: 10pt;
            ">Sinais Detectados</h3>

            <table style="width: 100%; border-collapse: collapse;">
                @foreach ($sinais as $sinal)
                    <tr>
                        <td style="
                            padding: 5pt 8pt 5pt 0;
                            vertical-align: top;
                            font-size: 9pt;
                            color: #1a1a1b;
                            border-bottom: 1px solid #f3f4f6;
                            line-height: 1.5;
                        ">
                            <span style="color: #C9B882; margin-right: 5pt; font-weight: bold;">—</span>
                            @if (is_array($sinal))
                                {{ $sinal['descricao'] ?? $sinal['texto'] ?? $sinal['sinal'] ?? json_encode($sinal) }}
                            @else
                                {{ $sinal }}
                            @endif
                        </td>
                    </tr>
                @endforeach
            </table>
        </div>
    @endif

    {{-- Análise --}}
    @if (!empty($alerta->analise))
        <div style="margin-bottom: 20pt;">
            <h3 style="
                font-family: Georgia, serif;
                font-size: 9pt;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: #C9B882;
                margin-bottom: 10pt;
            ">Análise</h3>

            <div style="
                font-family: Georgia, serif;
                font-size: 10pt;
                line-height: 1.8;
                color: #1a1a1b;
            ">
                {!! nl2br(e($alerta->analise)) !!}
            </div>
        </div>
    @endif

    {{-- Peso total / confiança --}}
    @if (!empty($alerta->peso_total))
        <div style="
            margin-bottom: 20pt;
            padding: 12pt 16pt;
            background-color: #f9fafb;
            border-left: 3px solid #C9B882;
        ">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 2pt 0; font-size: 8.5pt; color: #6b7280; width: 50%;">
                        <strong style="color: #1a1a1b;">Peso Total dos Sinais:</strong>
                        {{ $alerta->peso_total }}
                    </td>
                    @if (!empty($alerta->tipos_padrao) && is_array($alerta->tipos_padrao))
                        <td style="padding: 2pt 0; font-size: 8.5pt; color: #6b7280; width: 50%; text-align: right;">
                            <strong style="color: #1a1a1b;">Padrões:</strong>
                            {{ implode(', ', $alerta->tipos_padrao) }}
                        </td>
                    @endif
                </tr>
            </table>
        </div>
    @endif

    {{-- Data de notificação --}}
    @if (!empty($alerta->notificado_em))
        <p style="
            font-size: 8pt;
            color: #9ca3af;
            margin-top: 16pt;
        ">
            Alerta notificado em: {{ \Carbon\Carbon::parse($alerta->notificado_em)->locale('pt_BR')->isoFormat('D [de] MMMM [de] YYYY[,] HH:mm') }}
        </p>
    @endif

</div>
@endsection
