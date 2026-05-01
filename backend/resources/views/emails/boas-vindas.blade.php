<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:24px;background:#f5f7fb;font-family:Arial,sans-serif;color:#111827;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:32px;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#0f766e;">Geopolitica para Investidores</p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;">Bem-vindo, {{ $user->name }}.</h1>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Sua assinatura do plano <strong>{{ $plano }}</strong> foi ativada. Use as credenciais abaixo para acessar a plataforma.</p>
        <p style="margin:0 0 4px;font-size:16px;line-height:1.7;"><strong>E-mail:</strong> {{ $user->email }}</p>
        @if(!$reenvio)
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;"><strong>Senha temporária:</strong> {{ $senhaTemporaria }}</p>
        <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#4b5563;">No primeiro acesso voce sera solicitado a criar uma senha pessoal.</p>
        @else
        <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#4b5563;">Use a sua senha atual para acessar a plataforma.</p>
        @endif
        <p style="margin:24px 0;">
            <a href="{{ $linkAcesso }}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:bold;">Acessar agora</a>
        </p>
        <p style="margin:0;font-size:14px;line-height:1.7;color:#4b5563;">Se voce nao reconhece esta assinatura, responda este e-mail para que nosso time investigue.</p>
    </div>
</body>
</html>
