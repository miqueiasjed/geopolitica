<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:24px;background:#f5f7fb;font-family:Arial,sans-serif;color:#111827;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:32px;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#0f766e;">Acesso reativado</p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;">Seu plano {{ $plano }} voltou a ficar disponivel.</h1>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Olá, {{ $user->name }}. Seu acesso foi liberado novamente e a plataforma ja esta pronta para uso.</p>
        <p style="margin:24px 0;">
            <a href="{{ $linkAcesso }}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:bold;">Entrar na plataforma</a>
        </p>
    </div>
</body>
</html>
