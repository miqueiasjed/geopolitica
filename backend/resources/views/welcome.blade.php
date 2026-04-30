<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Geopolítica para Investidores</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
            --bg: #050606;
            --surface: #0d0e0e;
            --lime: #bfff3c;
            --lime-soft: #d7ff69;
            --orange: #ff5b20;
            --text: #ffffff;
            --muted: #a1a1aa;
            --border: rgba(191, 255, 60, 0.16);
        }

        html { scroll-behavior: smooth; }

        body {
            min-height: 100vh;
            overflow-x: hidden;
            background: var(--bg);
            color: var(--text);
            font-family: 'Sora', sans-serif;
        }

        .page {
            position: relative;
            min-height: 100vh;
            overflow: hidden;
            background: var(--bg);
        }

        .ambient,
        .grid,
        .planet,
        .vignette {
            position: absolute;
            inset: 0;
            pointer-events: none;
        }

        .ambient {
            background:
                linear-gradient(90deg, rgba(5, 6, 6, 0.98) 0%, rgba(5, 6, 6, 0.88) 35%, rgba(5, 6, 6, 0.48) 63%, rgba(5, 6, 6, 0.88) 100%),
                radial-gradient(circle at 72% 18%, rgba(255, 91, 32, 0.34), transparent 24%),
                radial-gradient(circle at 54% 38%, rgba(191, 255, 60, 0.16), transparent 28%),
                linear-gradient(180deg, #071018 0%, #050606 82%);
        }

        .grid {
            opacity: 0.16;
            background-image:
                linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
            background-size: 32px 32px;
        }

        .planet {
            left: auto;
            right: 0;
            width: 64vw;
            min-width: 720px;
            opacity: 0.72;
        }

        .planet::before {
            content: '';
            position: absolute;
            right: 2%;
            top: 4%;
            width: 48rem;
            height: 48rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            background:
                radial-gradient(circle at 44% 36%, rgba(255, 255, 255, 0.12), transparent 9%),
                radial-gradient(circle at 67% 31%, rgba(191, 255, 60, 0.12), transparent 10%),
                radial-gradient(circle at 52% 58%, rgba(255, 91, 32, 0.14), transparent 14%),
                linear-gradient(145deg, rgba(22, 25, 27, 0.88), rgba(6, 8, 10, 0.92));
            box-shadow: 0 0 100px rgba(0, 0, 0, 0.75);
        }

        .orbit {
            position: absolute;
            border: 1px solid rgba(191, 255, 60, 0.1);
            border-radius: 50%;
        }

        .orbit.one { right: 7%; top: 10%; width: 42rem; height: 42rem; }
        .orbit.two { right: 12%; top: 16%; width: 36rem; height: 36rem; border-color: rgba(255, 255, 255, 0.08); }
        .orbit.three { right: 18%; top: 22%; width: 30rem; height: 30rem; border-color: rgba(255, 255, 255, 0.07); }

        .land {
            position: absolute;
            border-radius: 48%;
            background: rgba(17, 22, 26, 0.86);
            box-shadow: inset 0 0 42px rgba(255, 255, 255, 0.05);
        }

        .land.one { right: 27%; top: 18%; width: 18rem; height: 28rem; transform: rotate(-12deg); }
        .land.two { right: 9%; top: 18%; width: 16rem; height: 30rem; transform: rotate(10deg); background: rgba(23, 16, 13, 0.86); box-shadow: inset 0 0 54px rgba(255, 91, 32, 0.12); }
        .land.three { right: 34%; top: 31%; width: 5rem; height: 8rem; transform: rotate(-28deg); background: #23313a; }

        .line {
            position: absolute;
            height: 1px;
            background: rgba(191, 255, 60, 0.2);
        }

        .line.one { right: 46%; top: 50%; width: 18rem; transform: rotate(-18deg); }
        .line.two { right: 18%; top: 48%; width: 24rem; transform: rotate(22deg); background: rgba(255, 255, 255, 0.1); }

        .vignette {
            background: radial-gradient(circle at 26% 38%, transparent 0%, rgba(5, 6, 6, 0.34) 46%, rgba(5, 6, 6, 0.92) 100%);
        }

        .site-header,
        .hero,
        .metrics,
        .features,
        .final-cta,
        footer {
            position: relative;
            z-index: 1;
        }

        .site-header {
            border-bottom: 1px solid rgba(191, 255, 60, 0.1);
            background: rgba(7, 8, 8, 0.82);
            backdrop-filter: blur(16px);
        }

        .header-inner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            width: min(1500px, 100%);
            margin: 0 auto;
            padding: 1rem 2rem;
        }

        .brand,
        .login-button,
        .hero-button,
        .ghost-button {
            display: inline-flex;
            align-items: center;
            text-decoration: none;
        }

        .brand {
            min-width: 0;
            gap: 0.75rem;
            color: var(--text);
        }

        .brand-icon {
            display: grid;
            width: 2.5rem;
            height: 2.5rem;
            flex: 0 0 auto;
            place-items: center;
            border: 1px solid rgba(191, 255, 60, 0.3);
            border-radius: 50%;
            background: rgba(191, 255, 60, 0.1);
            color: var(--lime-soft);
        }

        .brand-name {
            display: block;
            font-size: 1.1rem;
            font-weight: 900;
            line-height: 1.1;
            white-space: nowrap;
        }

        .brand-name span { color: var(--lime-soft); }

        .brand-sub {
            display: block;
            margin-top: 0.25rem;
            color: #71717a;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 0.63rem;
            letter-spacing: 0.22em;
            text-transform: uppercase;
        }

        .login-button {
            height: 2.75rem;
            gap: 0.5rem;
            border: 1px solid rgba(191, 255, 60, 0.25);
            border-radius: 0.375rem;
            background: rgba(191, 255, 60, 0.1);
            padding: 0 1rem;
            color: var(--lime-soft);
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 0.75rem;
            font-weight: 800;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            transition: background 0.2s, transform 0.2s;
        }

        .login-button:hover {
            background: rgba(191, 255, 60, 0.18);
            transform: translateY(-1px);
        }

        .hero {
            display: grid;
            min-height: calc(100vh - 73px);
            align-items: center;
            width: min(1500px, 100%);
            margin: 0 auto;
            padding: 4rem 2rem 5rem;
        }

        .hero-content { max-width: 72rem; }

        .eyebrow {
            display: inline-flex;
            max-width: 100%;
            align-items: center;
            gap: 0.55rem;
            border: 1px solid rgba(191, 255, 60, 0.3);
            border-radius: 999px;
            background: rgba(191, 255, 60, 0.08);
            padding: 0.65rem 1rem;
            color: var(--lime-soft);
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 0.72rem;
            font-weight: 800;
            letter-spacing: 0.22em;
            text-transform: uppercase;
        }

        h1 {
            max-width: 68rem;
            margin-top: 1.75rem;
            color: var(--text);
            font-size: clamp(3.2rem, 8vw, 8.7rem);
            font-weight: 900;
            letter-spacing: 0;
            line-height: 0.92;
        }

        h1 span {
            display: block;
            color: var(--lime);
        }

        .hero-copy {
            max-width: 43rem;
            margin-top: 1.75rem;
            color: #d4d4d8;
            font-size: clamp(1rem, 1.6vw, 1.25rem);
            font-weight: 700;
            line-height: 1.6;
        }

        .hero-copy strong { color: var(--text); }

        .hero-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 0.85rem;
            margin-top: 2rem;
        }

        .hero-button,
        .ghost-button {
            min-height: 3.5rem;
            justify-content: center;
            gap: 0.75rem;
            border-radius: 0.375rem;
            padding: 0 1.75rem;
            font-size: 1rem;
            font-weight: 900;
            transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.2s;
        }

        .hero-button {
            background: var(--orange);
            color: var(--text);
            box-shadow: 0 0 38px rgba(255, 91, 32, 0.36);
        }

        .hero-button:hover {
            background: #ff6b34;
            transform: translateY(-2px);
        }

        .ghost-button {
            border: 1px solid rgba(255, 255, 255, 0.12);
            background: rgba(255, 255, 255, 0.04);
            color: #f4f4f5;
            backdrop-filter: blur(14px);
        }

        .ghost-button:hover {
            border-color: rgba(191, 255, 60, 0.35);
            color: var(--lime-soft);
        }

        .checks {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem 2rem;
            margin-top: 2rem;
            color: #a1a1aa;
            font-size: 0.9rem;
            font-weight: 800;
        }

        .checks span {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
        }

        .metrics {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            border-top: 1px solid rgba(191, 255, 60, 0.1);
            border-bottom: 1px solid rgba(191, 255, 60, 0.1);
            background: rgba(7, 8, 8, 0.62);
            backdrop-filter: blur(16px);
        }

        .metric {
            min-height: 7rem;
            padding: 1.5rem 1rem;
            text-align: center;
            border-right: 1px solid rgba(191, 255, 60, 0.1);
        }

        .metric:last-child { border-right: 0; }

        .metric-number {
            color: var(--lime);
            font-size: clamp(1.8rem, 3vw, 2.65rem);
            font-weight: 900;
            line-height: 1;
        }

        .metric-label {
            margin-top: 0.55rem;
            color: var(--muted);
            font-size: 0.85rem;
            font-weight: 700;
        }

        .features {
            width: min(1180px, 100%);
            margin: 0 auto;
            padding: 5rem 2rem;
        }

        .section-label {
            color: var(--lime);
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 0.72rem;
            font-weight: 800;
            letter-spacing: 0.22em;
            text-align: center;
            text-transform: uppercase;
        }

        .section-title {
            max-width: 50rem;
            margin: 0.85rem auto 2rem;
            color: var(--text);
            font-size: clamp(1.8rem, 4vw, 3.2rem);
            font-weight: 900;
            line-height: 1.05;
            text-align: center;
        }

        .features-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 1rem;
        }

        .feature-card {
            min-height: 13rem;
            border: 1px solid rgba(191, 255, 60, 0.13);
            border-radius: 0.375rem;
            background: rgba(13, 14, 14, 0.78);
            padding: 1.35rem;
            box-shadow: 0 24px 90px rgba(0, 0, 0, 0.22);
            backdrop-filter: blur(14px);
            transition: border-color 0.2s, background 0.2s, transform 0.2s;
        }

        .feature-card:hover {
            border-color: rgba(191, 255, 60, 0.3);
            background: rgba(16, 18, 18, 0.9);
            transform: translateY(-2px);
        }

        .feature-icon {
            display: grid;
            width: 2.75rem;
            height: 2.75rem;
            place-items: center;
            border: 1px solid rgba(191, 255, 60, 0.18);
            border-radius: 0.375rem;
            background: rgba(191, 255, 60, 0.08);
            color: var(--lime-soft);
        }

        .feature-title {
            margin-top: 1rem;
            color: var(--text);
            font-size: 1rem;
            font-weight: 900;
        }

        .feature-desc {
            margin-top: 0.55rem;
            color: var(--muted);
            font-size: 0.9rem;
            font-weight: 600;
            line-height: 1.65;
        }

        .final-cta {
            width: min(760px, calc(100% - 2rem));
            margin: 0 auto 5rem;
            border: 1px solid rgba(191, 255, 60, 0.15);
            border-radius: 0.375rem;
            background: rgba(13, 14, 14, 0.88);
            padding: 2rem;
            text-align: center;
            box-shadow: 0 24px 90px rgba(0, 0, 0, 0.42);
            backdrop-filter: blur(16px);
        }

        .final-cta h2 {
            color: var(--text);
            font-size: clamp(1.6rem, 4vw, 2.4rem);
            font-weight: 900;
            line-height: 1.1;
        }

        .final-cta p {
            max-width: 36rem;
            margin: 0.85rem auto 1.5rem;
            color: var(--muted);
            font-size: 1rem;
            font-weight: 600;
            line-height: 1.65;
        }

        .final-actions {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 0.85rem;
        }

        footer {
            border-top: 1px solid rgba(191, 255, 60, 0.1);
            padding: 1.5rem 2rem;
            color: #71717a;
            font-size: 0.8rem;
            font-weight: 600;
            text-align: center;
        }

        svg { display: block; }

        @media (max-width: 980px) {
            .planet { right: -24rem; min-width: 680px; opacity: 0.38; }
            .hero { min-height: auto; padding-top: 3rem; }
            .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .metric:nth-child(2) { border-right: 0; }
            .metric:nth-child(-n+2) { border-bottom: 1px solid rgba(191, 255, 60, 0.1); }
            .features-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 640px) {
            .header-inner { padding: 0.9rem 1rem; }
            .brand-icon { width: 2.25rem; height: 2.25rem; }
            .brand-name { font-size: 0.92rem; }
            .brand-sub { display: none; }
            .login-button { width: 2.75rem; padding: 0; justify-content: center; }
            .login-button span { display: none; }
            .hero { padding: 2.5rem 1rem 3.25rem; }
            .eyebrow { font-size: 0.65rem; letter-spacing: 0.14em; }
            h1 { font-size: clamp(2.9rem, 14vw, 4.6rem); line-height: 0.95; }
            .hero-button, .ghost-button { width: 100%; }
            .checks { gap: 0.75rem; }
            .metrics { grid-template-columns: 1fr; }
            .metric { border-right: 0; border-bottom: 1px solid rgba(191, 255, 60, 0.1); }
            .metric:last-child { border-bottom: 0; }
            .features { padding: 4rem 1rem; }
            .features-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    @php
        $loginUrl = rtrim((string) config('app.frontend_url'), '/') . '/login';
        $checkoutUrl = 'https://lp.danuzioneto.com.br/geopolitica-investidor';
    @endphp

    <main class="page">
        <div class="ambient" aria-hidden="true"></div>
        <div class="grid" aria-hidden="true"></div>
        <div class="planet" aria-hidden="true">
            <span class="orbit one"></span>
            <span class="orbit two"></span>
            <span class="orbit three"></span>
            <span class="land one"></span>
            <span class="land two"></span>
            <span class="land three"></span>
            <span class="line one"></span>
            <span class="line two"></span>
        </div>
        <div class="vignette" aria-hidden="true"></div>

        <header class="site-header">
            <div class="header-inner">
                <a href="/" class="brand" aria-label="Geopolítica para Investidores">
                    <span class="brand-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <circle cx="12" cy="12" r="9.5" stroke="currentColor" stroke-width="1.7"/>
                            <path d="M3 12h18M12 2.5c2.5 2.7 3.8 5.9 3.8 9.5s-1.3 6.8-3.8 9.5M12 2.5C9.5 5.2 8.2 8.4 8.2 12s1.3 6.8 3.8 9.5" stroke="currentColor" stroke-width="1.35" stroke-linecap="round"/>
                        </svg>
                    </span>
                    <span>
                        <span class="brand-name">Geopolítica <span>para Investidores</span></span>
                        <span class="brand-sub">inteligência geopolítica aplicada</span>
                    </span>
                </a>

                <a href="{{ $loginUrl }}" class="login-button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                        <path d="m10 17 5-5-5-5"/>
                        <path d="M15 12H3"/>
                    </svg>
                    <span>Já sou assinante</span>
                </a>
            </div>
        </header>

        <section class="hero">
            <div class="hero-content">
                <div class="eyebrow">
                    <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path d="M10 1.7l2.4 5 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4-3.9-3.8 5.4-.8L10 1.7z"/>
                    </svg>
                    Plataforma de inteligência geopolítica aplicada
                </div>

                <h1>
                    O mundo não para.
                    <span>E você não pode</span>
                    ficar para trás.
                </h1>

                <p class="hero-copy">
                    Enquanto a maioria lê manchetes, uma minoria entende o que está por trás delas e age antes que o resto perceba.
                    <strong>Geopolítica para Investidores</strong> existe para quem quer estar nessa minoria.
                </p>

                <div class="hero-actions">
                    <a href="{{ $checkoutUrl }}" class="hero-button">
                        Assinar
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M5 12h14"/>
                            <path d="m12 5 7 7-7 7"/>
                        </svg>
                    </a>
                    <a href="{{ $loginUrl }}" class="ghost-button">Já sou assinante</a>
                </div>

                <div class="checks">
                    <span>
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m4 10 4 4 8-8"/></svg>
                        Briefing diário
                    </span>
                    <span>
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m4 10 4 4 8-8"/></svg>
                        Alertas por IA
                    </span>
                    <span>
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m4 10 4 4 8-8"/></svg>
                        Cenários de risco
                    </span>
                </div>
            </div>
        </section>

        <section class="metrics" aria-label="Indicadores da plataforma">
            <div class="metric">
                <div class="metric-number">180+</div>
                <div class="metric-label">Países monitorados</div>
            </div>
            <div class="metric">
                <div class="metric-number">24/7</div>
                <div class="metric-label">Monitoramento contínuo</div>
            </div>
            <div class="metric">
                <div class="metric-number">IA</div>
                <div class="metric-label">Alertas preditivos</div>
            </div>
            <div class="metric">
                <div class="metric-number">Real-time</div>
                <div class="metric-label">Análises atualizadas</div>
            </div>
        </section>

        <section class="features">
            <p class="section-label">Recursos da plataforma</p>
            <h2 class="section-title">Tudo que você precisa para decidir antes do consenso</h2>

            <div class="features-grid">
                <article class="feature-card">
                    <div class="feature-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    </div>
                    <h3 class="feature-title">Alertas preditivos com IA</h3>
                    <p class="feature-desc">Sinais geopolíticos monitorados continuamente para antecipar riscos antes que virem manchete.</p>
                </article>

                <article class="feature-card">
                    <div class="feature-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20"/></svg>
                    </div>
                    <h3 class="feature-title">Mapa de riscos globais</h3>
                    <p class="feature-desc">Conflitos, instabilidade política e tensões comerciais organizados por impacto para investidores.</p>
                </article>

                <article class="feature-card">
                    <div class="feature-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m23 6-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>
                    </div>
                    <h3 class="feature-title">Cenários de investimento</h3>
                    <p class="feature-desc">Análises sobre commodities, moedas e mercados emergentes com contexto estratégico claro.</p>
                </article>

                <article class="feature-card">
                    <div class="feature-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/></svg>
                    </div>
                    <h3 class="feature-title">Relatórios aprofundados</h3>
                    <p class="feature-desc">Briefings com contexto histórico, atores relevantes e implicações práticas para portfólio.</p>
                </article>

                <article class="feature-card">
                    <div class="feature-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                    </div>
                    <h3 class="feature-title">Dashboard personalizado</h3>
                    <p class="feature-desc">Acompanhe regiões e classes de ativos relevantes para sua tomada de decisão.</p>
                </article>

                <article class="feature-card">
                    <div class="feature-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07M8.46 8.46a5 5 0 0 0 0 7.07"/></svg>
                    </div>
                    <h3 class="feature-title">Notificações em tempo real</h3>
                    <p class="feature-desc">Receba alertas quando eventos relevantes surgirem em regiões ou setores acompanhados.</p>
                </article>
            </div>
        </section>

        <section class="final-cta">
            <h2>Escolha como quer acessar a plataforma</h2>
            <p>Assinantes entram direto na área privada. Quem ainda não tem acesso pode assinar pela página oficial.</p>
            <div class="final-actions">
                <a href="{{ $checkoutUrl }}" class="hero-button">
                    Assinar
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M5 12h14"/>
                        <path d="m12 5 7 7-7 7"/>
                    </svg>
                </a>
                <a href="{{ $loginUrl }}" class="ghost-button">Já sou assinante</a>
            </div>
        </section>

        <footer>
            &copy; {{ date('Y') }} Geopolítica para Investidores. Todos os direitos reservados.
        </footer>
    </main>
</body>
</html>
