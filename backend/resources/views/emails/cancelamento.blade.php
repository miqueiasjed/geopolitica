<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:24px;background:#f5f7fb;font-family:Arial,sans-serif;color:#111827;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:32px;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#b45309;">Assinatura atualizada</p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;">Sua assinatura foi encerrada.</h1>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Olá, {{ $user->name }}. O plano <strong>{{ $assinante->plano }}</strong> agora esta com status <strong>{{ $assinante->status }}</strong>.</p>
        <p style="margin:0;font-size:14px;line-height:1.7;color:#4b5563;">
            @if($assinante->expira_em)
                Seu acesso permanece disponivel ate {{ $assinante->expira_em->timezone(config('app.timezone'))->format('d/m/Y H:i') }}.
            @else
                Caso precise revisar sua assinatura, nosso time pode ajudar pelos canais oficiais.
            @endif
        </p>
    </div>
</body>
</html>
