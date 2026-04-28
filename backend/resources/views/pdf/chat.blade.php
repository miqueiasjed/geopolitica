@extends('pdf.layout')

@section('content')
<div>

    {{-- Cabeçalho do documento --}}
    <div style="margin-bottom: 20pt;">
        <h1 style="
            font-family: Georgia, serif;
            font-size: 16pt;
            font-weight: bold;
            color: #1a1a1b;
            margin-bottom: 4pt;
        ">Consulta ao Assistente</h1>

        @php
            $dataMensagem = $mensagem->created_at
                ?? ($mensagem->sessao->created_at ?? null);
        @endphp

        @if ($dataMensagem)
            <p style="font-size: 8pt; color: #9ca3af; margin-bottom: 0;">
                {{ \Carbon\Carbon::parse($dataMensagem)->locale('pt_BR')->isoFormat('D [de] MMMM [de] YYYY [às] HH:mm') }}
            </p>
        @endif
    </div>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin-bottom: 20pt;">

    {{-- Seção: Pergunta --}}
    @php
        $textoPergunta = $mensagem->pergunta
            ?? ($mensagem->role === 'user' ? $mensagem->conteudo : null);
    @endphp

    @if (!empty($textoPergunta))
        <div style="padding-bottom: 16pt; margin-bottom: 16pt; border-bottom: 0.5px solid #eeeeee;">
            <h2 style="
                font-family: Georgia, serif;
                font-size: 8pt;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: #C9B882;
                margin-bottom: 8pt;
            ">Pergunta</h2>

            <div style="
                border-left: 3px solid #C9B882;
                padding-left: 12pt;
                font-family: Georgia, serif;
                font-size: 11pt;
                font-style: italic;
                color: #1a1a1b;
                line-height: 1.65;
            ">{{ $textoPergunta }}</div>
        </div>
    @endif

    {{-- Seção: Resposta da IA --}}
    @php
        $textoResposta = $mensagem->resposta
            ?? ($mensagem->role === 'assistant' ? $mensagem->conteudo : null)
            ?? $mensagem->conteudo
            ?? null;
    @endphp

    @if (!empty($textoResposta))
        <div style="padding-bottom: 16pt; margin-bottom: 16pt; border-bottom: 0.5px solid #eeeeee;">
            <h2 style="
                font-family: Georgia, serif;
                font-size: 8pt;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: #C9B882;
                margin-bottom: 8pt;
            ">Resposta da IA</h2>

            <div style="
                font-family: Georgia, serif;
                font-size: 10pt;
                line-height: 1.8;
                color: #1a1a1b;
            ">{!! nl2br(e($textoResposta)) !!}</div>
        </div>
    @endif

    {{-- Seção: Fontes Consultadas --}}
    @php
        $fontes = $mensagem->fontes ?? null;
        if (is_string($fontes)) {
            $fontes = json_decode($fontes, true);
        }
    @endphp

    @if (!empty($fontes) && is_array($fontes) && count($fontes) > 0)
        <div style="padding-bottom: 16pt; margin-bottom: 16pt; border-bottom: 0.5px solid #eeeeee;">
            <h2 style="
                font-family: Georgia, serif;
                font-size: 8pt;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: #C9B882;
                margin-bottom: 8pt;
            ">Fontes Consultadas</h2>

            <ul style="list-style: none; padding: 0; margin: 0;">
                @foreach ($fontes as $fonte)
                    <li style="
                        padding: 5pt 0 5pt 12pt;
                        border-left: 2px solid #e5e7eb;
                        margin-bottom: 5pt;
                        font-family: Georgia, serif;
                        font-size: 9pt;
                        color: #1a1a1b;
                    ">
                        @if (is_array($fonte))
                            <span style="font-weight: bold; color: #1a1a1b;">
                                {{ $fonte['titulo'] ?? $fonte['title'] ?? $fonte['nome'] ?? $fonte['name'] ?? 'Fonte' }}
                            </span>
                            @if (!empty($fonte['tipo'] ?? $fonte['type'] ?? null))
                                <span style="
                                    font-size: 7.5pt;
                                    text-transform: uppercase;
                                    letter-spacing: 0.06em;
                                    color: #9ca3af;
                                    margin-left: 5pt;
                                ">{{ $fonte['tipo'] ?? $fonte['type'] }}</span>
                            @endif
                            @if (!empty($fonte['url']))
                                <br><span style="font-size: 8pt; color: #C9B882;">{{ $fonte['url'] }}</span>
                            @endif
                        @else
                            {{ $fonte }}
                        @endif
                    </li>
                @endforeach
            </ul>
        </div>
    @endif

    {{-- Data e hora da conversa (rodapé de seção) --}}
    @if (!empty($mensagem->sessao))
        <p style="
            font-size: 8pt;
            color: #9ca3af;
            margin-top: 8pt;
            letter-spacing: 0.02em;
        ">
            Sessão de
            {{ \Carbon\Carbon::parse($mensagem->sessao->data_sessao)->locale('pt_BR')->isoFormat('D [de] MMMM [de] YYYY') }}
        </p>
    @endif

</div>
@endsection
