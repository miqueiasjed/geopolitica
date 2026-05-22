@extends('pdf.layout')

@section('content')
<div class="briefing-content">

    {{-- Cabeçalho editorial --}}
    <div style="margin-bottom: 20pt;">
        <div style="
            font-family: Georgia, serif;
            font-size: 9pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.25em;
            color: #C9B882;
            margin-bottom: 4pt;
        ">Geopolítica para Investidores@if (!empty($conteudo->edicao)), Nº {{ str_pad($conteudo->edicao, 3, '0', STR_PAD_LEFT) }}@endif</div>

        <div style="
            font-size: 8pt;
            color: #6b7280;
            letter-spacing: 0.05em;
            margin-bottom: 2pt;
        ">
            @if (!empty($conteudo->publicado_em))
                {{ \Carbon\Carbon::parse($conteudo->publicado_em)->locale('pt_BR')->isoFormat('dddd, D [de] MMMM [de] YYYY') }}
            @else
                {{ \Carbon\Carbon::parse($conteudo->created_at)->locale('pt_BR')->isoFormat('dddd, D [de] MMMM [de] YYYY') }}
            @endif
        </div>

        @if (!empty($conteudo->autor))
        <div style="
            font-size: 8pt;
            color: #6b7280;
            font-style: italic;
        ">Por {{ $conteudo->autor }}</div>
        @endif
    </div>

    <hr style="border: none; border-top: 2px solid #C9B882; margin-bottom: 20pt;">

    {{-- Título --}}
    <h1 style="
        font-family: Georgia, serif;
        font-size: 20pt;
        font-weight: bold;
        color: #1a1a1b;
        line-height: 1.25;
        margin-bottom: 10pt;
    ">{{ $conteudo->titulo }}</h1>

    {{-- Resumo / manchete --}}
    @if (!empty($conteudo->tese_manchete))
        <p style="
            font-family: Georgia, serif;
            font-size: 11pt;
            font-style: italic;
            color: #4b5563;
            margin-bottom: 20pt;
            line-height: 1.5;
        ">{{ $conteudo->tese_manchete }}</p>
    @elseif (!empty($conteudo->resumo))
        <p style="
            font-family: Georgia, serif;
            font-size: 11pt;
            font-style: italic;
            color: #4b5563;
            margin-bottom: 20pt;
            line-height: 1.5;
        ">{{ $conteudo->resumo }}</p>
    @endif

    {{-- Corpo com estilo para seções --}}
    <style>
        .briefing-body h2 {
            font-family: Georgia, serif;
            font-size: 8pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            color: #1a1a1b;
            margin-top: 20pt;
            margin-bottom: 8pt;
            padding-bottom: 4pt;
            border-bottom: 1px solid #e5e7eb;
        }
        .briefing-body p {
            font-family: Georgia, serif;
            font-size: 10pt;
            line-height: 1.85;
            color: #1a1a1b;
            margin-bottom: 8pt;
            text-align: justify;
        }
    </style>

    <div class="briefing-body">
        {!! $conteudo->corpo ?? '' !!}
    </div>

    {{-- Tags --}}
    @if (!empty($conteudo->tags) && is_array($conteudo->tags) && count($conteudo->tags) > 0)
        <div style="margin-top: 24pt; padding-top: 10pt; border-top: 1px solid #e5e7eb;">
            @foreach ($conteudo->tags as $tag)
                <span style="
                    font-size: 7.5pt;
                    color: #C9B882;
                    margin-right: 8pt;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                ">#{{ $tag }}</span>
            @endforeach
        </div>
    @endif

</div>
@endsection
