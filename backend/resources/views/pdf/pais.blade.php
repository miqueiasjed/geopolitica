@extends('pdf.layout')

@section('content')
<div>

    {{-- Cabeçalho do país --}}
    <div style="margin-bottom: 20pt;">
        @if (!empty($pais->bandeira_emoji))
            <span style="font-size: 22pt; line-height: 1;">{{ $pais->bandeira_emoji }}</span>
        @endif

        <h1 style="
            font-family: Georgia, serif;
            font-size: 20pt;
            font-weight: bold;
            color: #1a1a1b;
            line-height: 1.3;
            margin-top: 4pt;
            margin-bottom: 2pt;
        ">{{ $pais->nome_pt }}</h1>

        <p style="
            font-size: 8.5pt;
            font-family: Georgia, serif;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #9ca3af;
            margin-bottom: 4pt;
        ">{{ $pais->codigo_pais }}@if (!empty($pais->regiao_geopolitica)) &nbsp;·&nbsp; {{ $pais->regiao_geopolitica }}@endif</p>

        @if (!empty($pais->gerado_em))
            <p style="font-size: 8pt; color: #9ca3af; margin-bottom: 0;">
                Perfil atualizado em {{ \Carbon\Carbon::parse($pais->gerado_em)->locale('pt_BR')->isoFormat('D [de] MMMM [de] YYYY') }}
            </p>
        @endif
    </div>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin-bottom: 20pt;">

    {{-- Seção: Contexto Geopolítico --}}
    @if (!empty($pais->contexto_geopolitico))
        <div style="padding-bottom: 16pt; margin-bottom: 16pt; border-bottom: 0.5px solid #eeeeee;">
            <h2 style="
                font-family: Georgia, serif;
                font-size: 8pt;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: #C9B882;
                margin-bottom: 8pt;
            ">Contexto Geopolítico</h2>
            <div style="
                font-family: Georgia, serif;
                font-size: 10pt;
                line-height: 1.75;
                color: #1a1a1b;
            ">{{ $pais->contexto_geopolitico }}</div>
        </div>
    @endif

    {{-- Seção: Liderança Atual --}}
    @if (!empty($pais->analise_lideranca))
        <div style="padding-bottom: 16pt; margin-bottom: 16pt; border-bottom: 0.5px solid #eeeeee;">
            <h2 style="
                font-family: Georgia, serif;
                font-size: 8pt;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: #C9B882;
                margin-bottom: 8pt;
            ">Liderança Atual</h2>
            <div style="
                font-family: Georgia, serif;
                font-size: 10pt;
                line-height: 1.75;
                color: #1a1a1b;
            ">{{ $pais->analise_lideranca }}</div>
        </div>
    @endif

    {{-- Seção: Indicadores de Risco --}}
    @if (!empty($pais->indicadores_relevantes) && is_array($pais->indicadores_relevantes) && count($pais->indicadores_relevantes) > 0)
        <div style="padding-bottom: 16pt; margin-bottom: 16pt; border-bottom: 0.5px solid #eeeeee;">
            <h2 style="
                font-family: Georgia, serif;
                font-size: 8pt;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: #C9B882;
                margin-bottom: 10pt;
            ">Indicadores de Risco</h2>

            <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt;">
                <thead>
                    <tr>
                        <th style="
                            text-align: left;
                            padding: 4pt 8pt;
                            font-family: Georgia, serif;
                            font-size: 8pt;
                            text-transform: uppercase;
                            letter-spacing: 0.06em;
                            color: #6b7280;
                            border-bottom: 1px solid #e5e7eb;
                        ">Indicador</th>
                        <th style="
                            text-align: right;
                            padding: 4pt 8pt;
                            font-family: Georgia, serif;
                            font-size: 8pt;
                            text-transform: uppercase;
                            letter-spacing: 0.06em;
                            color: #6b7280;
                            border-bottom: 1px solid #e5e7eb;
                        ">Valor</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($pais->indicadores_relevantes as $indicador)
                        <tr>
                            <td style="
                                padding: 5pt 8pt;
                                font-family: Georgia, serif;
                                color: #1a1a1b;
                                border-bottom: 0.5px solid #f3f4f6;
                            ">
                                @if (is_array($indicador))
                                    {{ $indicador['nome'] ?? $indicador['name'] ?? (is_string(array_key_first($indicador)) ? array_key_first($indicador) : 'Indicador') }}
                                @else
                                    {{ $indicador }}
                                @endif
                            </td>
                            <td style="
                                padding: 5pt 8pt;
                                font-family: Georgia, serif;
                                color: #C9B882;
                                font-weight: bold;
                                text-align: right;
                                border-bottom: 0.5px solid #f3f4f6;
                            ">
                                @if (is_array($indicador))
                                    {{ $indicador['valor'] ?? $indicador['value'] ?? '—' }}
                                @endif
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    @endif

    {{-- Seção: Termos de Busca / O Que Monitorar --}}
    @if (!empty($pais->termos_busca) && is_array($pais->termos_busca) && count($pais->termos_busca) > 0)
        <div style="padding-bottom: 16pt; margin-bottom: 16pt; border-bottom: 0.5px solid #eeeeee;">
            <h2 style="
                font-family: Georgia, serif;
                font-size: 8pt;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: #C9B882;
                margin-bottom: 8pt;
            ">O Que Monitorar</h2>

            <ul style="
                list-style: none;
                padding: 0;
                margin: 0;
            ">
                @foreach ($pais->termos_busca as $termo)
                    <li style="
                        font-family: Georgia, serif;
                        font-size: 10pt;
                        color: #1a1a1b;
                        padding: 3pt 0 3pt 12pt;
                        border-left: 2px solid #C9B882;
                        margin-bottom: 4pt;
                    ">{{ $termo }}</li>
                @endforeach
            </ul>
        </div>
    @endif

</div>
@endsection
