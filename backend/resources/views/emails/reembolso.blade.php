<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:24px;background:#f5f7fb;font-family:Arial,sans-serif;color:#111827;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:32px;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#0f766e;">Reembolso confirmado</p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;">Seu reembolso foi processado.</h1>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Olá, {{ $user->name }}. Confirmamos o reembolso da assinatura <strong>{{ $assinante->plano }}</strong>. O status atual e <strong>{{ $assinante->status }}</strong>.</p>
        <p style="margin:0;font-size:14px;line-height:1.7;color:#4b5563;">Se houver qualquer divergencia no repasse financeiro, responda esta mensagem para abrirmos a analise.</p>
    </div>
</body>
</html>
