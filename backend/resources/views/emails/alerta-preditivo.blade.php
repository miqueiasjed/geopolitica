<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:24px;background:#f5f7fb;font-family:Arial,sans-serif;color:#111827;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:32px;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#0f766e;">Geopolítica para Investidores</p>

        @php
            $badgeEstilo = match($alerta->nivel) {
                'critical' => 'background-color:#fee2e2;color:#dc2626;',
                'high'     => 'background-color:#ffedd5;color:#ea580c;',
                'medium'   => 'background-color:#fefce8;color:#ca8a04;',
                default    => 'background-color:#f1f5f9;color:#475569;',
            };
            $badgeTexto = match($alerta->nivel) {
                'critical' => '🚨 CRÍTICO',
                'high'     => '⚠️ ALTO',
                'medium'   => '📊 MÉDIO',
                default    => strtoupper($alerta->nivel),
            };
        @endphp

        <span style="{{ $badgeEstilo }}display:inline-block;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.08em;margin-bottom:16px;">{{ $badgeTexto }}</span>

        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">🌍 {{ $alerta->regiao }} &nbsp;·&nbsp; {{ $alerta->created_at->format('d/m/Y') }}</p>

        <h1 style="margin:0 0 24px;font-size:28px;line-height:1.2;">{{ $alerta->titulo }}</h1>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;">

        <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#6b7280;">Análise IA</p>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.7;">{{ $alerta->analise }}</p>

        @if(!empty($alerta->resumo_sinais))
            <p style="margin:0 0 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#6b7280;">Sinais detectados</p>
            @foreach($alerta->resumo_sinais as $sinal)
                <div style="padding:10px 14px;background:#f5f7fb;border-radius:8px;margin-bottom:8px;">
                    <span style="font-size:14px;font-weight:600;display:block;">{{ $sinal['titulo'] ?? 'Sinal sem título' }}</span>
                    <span style="font-size:12px;color:#6b7280;">{{ $sinal['tipo'] ?? '' }}</span>
                </div>
            @endforeach
        @endif

        <p style="margin:24px 0;">
            <a href="{{ config('app.url') }}/dashboard/alertas" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:bold;">Ver no dashboard</a>
        </p>

        <p style="margin:0;font-size:13px;line-height:1.7;color:#9ca3af;">Você recebe este e-mail por ser assinante do plano Reservado.</p>
    </div>
</body>
</html>
