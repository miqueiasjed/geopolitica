<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $alerta->titulo }}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0f172a; padding: 40px 20px;">
        <tr>
            <td align="center">

                {{-- Container principal --}}
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #1e293b; border-radius: 12px; overflow: hidden;">

                    {{-- Cabeçalho --}}
                    <tr>
                        <td style="background-color: #0f172a; padding: 24px 32px; border-bottom: 1px solid #334155;">
                            <p style="margin: 0; color: #94a3b8; font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase;">Geopolítica para Investidores</p>
                        </td>
                    </tr>

                    {{-- Corpo --}}
                    <tr>
                        <td style="padding: 32px;">

                            {{-- Badge de nível --}}
                            @php
                                $badgeEstilo = match($alerta->nivel) {
                                    'critical' => 'background-color: #fee2e2; color: #dc2626;',
                                    'high'     => 'background-color: #ffedd5; color: #ea580c;',
                                    'medium'   => 'background-color: #fefce8; color: #ca8a04;',
                                    default    => 'background-color: #f1f5f9; color: #475569;',
                                };
                                $badgeTexto = match($alerta->nivel) {
                                    'critical' => '🚨 CRÍTICO',
                                    'high'     => '⚠️ ALTO',
                                    'medium'   => '📊 MÉDIO',
                                    default    => strtoupper($alerta->nivel),
                                };
                            @endphp

                            <span style="{{ $badgeEstilo }} display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; margin-bottom: 20px;">
                                {{ $badgeTexto }}
                            </span>

                            {{-- Região e data --}}
                            <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 13px;">
                                🌍 {{ $alerta->regiao }}
                                &nbsp;&nbsp;·&nbsp;&nbsp;
                                {{ $alerta->created_at->format('d/m/Y') }}
                            </p>

                            {{-- Título --}}
                            <h1 style="margin: 0 0 24px 0; color: #f1f5f9; font-size: 20px; font-weight: 700; line-height: 1.4;">
                                {{ $alerta->titulo }}
                            </h1>

                            {{-- Divisor --}}
                            <hr style="border: none; border-top: 1px solid #334155; margin: 0 0 24px 0;">

                            {{-- Análise IA --}}
                            <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em;">Análise IA</p>
                            <p style="margin: 0 0 28px 0; color: #cbd5e1; font-size: 15px; line-height: 1.7;">
                                {{ $alerta->analise }}
                            </p>

                            {{-- Sinais detectados --}}
                            @if(!empty($alerta->resumo_sinais))
                                <p style="margin: 0 0 12px 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em;">Sinais detectados</p>

                                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
                                    @foreach($alerta->resumo_sinais as $sinal)
                                        <tr>
                                            <td style="padding: 8px 0; border-bottom: 1px solid #1e293b;">
                                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                    <tr>
                                                        <td style="padding: 10px 14px; background-color: #0f172a; border-radius: 6px;">
                                                            <span style="color: #f1f5f9; font-size: 14px; font-weight: 600; display: block; margin-bottom: 2px;">
                                                                {{ $sinal['titulo'] ?? 'Sinal sem título' }}
                                                            </span>
                                                            <span style="color: #64748b; font-size: 12px;">
                                                                {{ $sinal['tipo'] ?? '' }}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    @endforeach
                                </table>
                            @endif

                            {{-- CTA --}}
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" style="padding-top: 8px;">
                                        <a href="{{ config('app.url') }}/dashboard/alertas"
                                           style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; letter-spacing: 0.02em;">
                                            Ver no dashboard
                                        </a>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    {{-- Rodapé --}}
                    <tr>
                        <td style="background-color: #0f172a; padding: 20px 32px; border-top: 1px solid #334155; text-align: center;">
                            <p style="margin: 0; color: #475569; font-size: 12px; line-height: 1.6;">
                                Geopolítica para Investidores — Você recebe este e-mail por ser assinante Reservado.
                            </p>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
