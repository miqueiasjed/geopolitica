@extends('pdf.layout')

@section('content')
<div class="briefing-content">

    {{-- Categoria e tipo --}}
    <div style="margin-bottom: 12pt;">
        @if (!empty($conteudo->regiao))
            <span style="
                font-size: 7.5pt;
                font-family: Georgia, serif;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.12em;
                color: #C9B882;
                margin-right: 8pt;
            ">{{ $conteudo->regiao }}</span>
        @endif

        @if (!empty($conteudo->tipo))
            <span style="
                font-size: 7.5pt;
                font-family: Georgia, serif;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: #6b7280;
                border: 1px solid #d1d5db;
                padding: 1pt 5pt;
            ">{{ $conteudo->tipo }}</span>
        @endif
    </div>

    {{-- Título --}}
    <h1 style="
        font-family: Georgia, serif;
        font-size: 18pt;
        font-weight: bold;
        color: #1a1a1b;
        line-height: 1.3;
        margin-bottom: 8pt;
    ">{{ $conteudo->titulo }}</h1>

    {{-- Subtítulo / Tese manchete --}}
    @if (!empty($conteudo->tese_manchete))
        <p style="
            font-family: Georgia, serif;
            font-size: 11pt;
            font-style: italic;
            color: #4b5563;
            margin-bottom: 8pt;
            line-height: 1.5;
        ">{{ $conteudo->tese_manchete }}</p>
    @elseif (!empty($conteudo->resumo))
        <p style="
            font-family: Georgia, serif;
            font-size: 11pt;
            font-style: italic;
            color: #4b5563;
            margin-bottom: 8pt;
            line-height: 1.5;
        ">{{ $conteudo->resumo }}</p>
    @endif

    {{-- Data de publicação --}}
    <p style="
        font-size: 8pt;
        color: #9ca3af;
        margin-bottom: 20pt;
        letter-spacing: 0.03em;
    ">
        @if (!empty($conteudo->publicado_em))
            {{ \Carbon\Carbon::parse($conteudo->publicado_em)->locale('pt_BR')->isoFormat('D [de] MMMM [de] YYYY') }}
        @else
            {{ \Carbon\Carbon::parse($conteudo->created_at)->locale('pt_BR')->isoFormat('D [de] MMMM [de] YYYY') }}
        @endif
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin-bottom: 20pt;">

    {{-- Corpo --}}
    <div style="
        font-family: Georgia, serif;
        font-size: 10pt;
        line-height: 1.8;
        color: #1a1a1b;
    ">
        {!! $conteudo->corpo ?? $conteudo->resumo ?? '' !!}
    </div>

    {{-- Tags --}}
    @if (!empty($conteudo->tags) && is_array($conteudo->tags) && count($conteudo->tags) > 0)
        <div style="margin-top: 20pt; padding-top: 12pt; border-top: 1px solid #e5e7eb;">
            <span style="
                font-size: 7.5pt;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: #9ca3af;
                margin-right: 6pt;
            ">Tags:</span>
            @foreach ($conteudo->tags as $tag)
                <span style="
                    font-size: 8pt;
                    color: #C9B882;
                    margin-right: 6pt;
                ">#{{ $tag }}</span>
            @endforeach
        </div>
    @endif

</div>
@endsection
