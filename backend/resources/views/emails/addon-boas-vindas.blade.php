<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:24px;background:#f5f7fb;font-family:Arial,sans-serif;color:#111827;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:32px;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#0f766e;">Geopolitica para Investidores</p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;">{{ $addonLabel }} ativado.</h1>

        @if ($contaNova)
            <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Olá, {{ $nome }}. Sua conta foi criada e o <strong>{{ $addonLabel }}</strong> já está disponível. Defina sua senha para acessar o dashboard.</p>
            <p style="margin:24px 0;">
                <a href="{{ $linkAcesso }}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:bold;">Definir senha</a>
            </p>
        @else
            <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Olá, {{ $nome }}. O <strong>{{ $addonLabel }}</strong> foi adicionado à sua conta e já está disponível no dashboard.</p>
            <p style="margin:24px 0;">
                <a href="{{ $linkAcesso }}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:bold;">Acessar dashboard</a>
            </p>
        @endif

        <p style="margin:0;font-size:14px;line-height:1.7;color:#4b5563;">Se voce nao reconhece esta ativacao, responda este e-mail para que nosso time investigue.</p>
    </div>
</body>
</html>
