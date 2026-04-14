<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:24px;background:#f5f7fb;font-family:Arial,sans-serif;color:#111827;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:32px;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#0f766e;">Geopolitica para Investidores</p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;">Você foi convidado!</h1>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">
            A empresa <strong>{{ $empresa->nome }}</strong> convidou você para acessar o
            <strong>Geopolítica para Investidores</strong> como <strong>{{ $roleB2B }}</strong>.
        </p>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.7;">
            Clique no botão abaixo para criar sua conta e começar a usar a plataforma.
        </p>
        <p style="margin:24px 0;">
            <a href="{{ $linkConvite }}"
               style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:bold;">
                Aceitar convite
            </a>
        </p>
        <p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#6b7280;">
            Ou copie e cole este link no navegador:<br>
            <span style="color:#0f766e;word-break:break-all;">{{ $linkConvite }}</span>
        </p>
        <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;">
        <p style="margin:0;font-size:13px;line-height:1.7;color:#9ca3af;">
            Se você não esperava este convite, ignore este e-mail com segurança.
        </p>
    </div>
</body>
</html>
