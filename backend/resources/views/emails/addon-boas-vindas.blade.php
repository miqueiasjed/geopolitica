<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:24px;background:#f5f7fb;font-family:Arial,sans-serif;color:#111827;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:32px;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#0f766e;">Geopolitica para Investidores</p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;">{{ $addonLabel }} ativado.</h1>

        @if ($contaNova)
            <p style="margin:0 0 24px;font-size:16px;line-height:1.7;">Olá, {{ $nome }}. Sua conta foi criada e o <strong>{{ $addonLabel }}</strong> já está disponível. Acesse com as credenciais abaixo e crie sua senha no primeiro acesso.</p>

            <div style="background:#f5f7fb;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
                <p style="margin:0 0 8px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em;">Seu login</p>
                <p style="margin:0 0 4px;font-size:15px;"><span style="color:#6b7280;">E-mail:</span> <strong>{{ $email }}</strong></p>
                <p style="margin:0;font-size:15px;"><span style="color:#6b7280;">Senha temporária:</span> <strong>12345678</strong></p>
            </div>

            <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#4b5563;">Ao fazer login pela primeira vez, você será solicitado a criar uma senha pessoal.</p>
        @else
            <p style="margin:0 0 24px;font-size:16px;line-height:1.7;">Olá, {{ $nome }}. O <strong>{{ $addonLabel }}</strong> foi adicionado à sua conta e já está disponível no dashboard.</p>
        @endif

        <p style="margin:0 0 24px;">
            <a href="{{ $linkAcesso }}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:bold;">Acessar dashboard</a>
        </p>

        <p style="margin:0;font-size:14px;line-height:1.7;color:#4b5563;">Se voce nao reconhece esta ativacao, responda este e-mail para que nosso time investigue.</p>
    </div>
</body>
</html>
