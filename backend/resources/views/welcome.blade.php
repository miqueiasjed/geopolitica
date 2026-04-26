<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Geopolitica para Investidores</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
            --bg: #0a0a0b;
            --blue: #2196F3;
            --sky: #0ea5e9;
            --text: #ecfeff;
            --muted: #94a3b8;
            --card: rgba(255,255,255,0.04);
            --border: rgba(255,255,255,0.07);
        }

        html { scroll-behavior: smooth; }

        body {
            font-family: 'Sora', sans-serif;
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
            overflow-x: hidden;
        }

        .bg-glow {
            position: fixed; inset: 0; pointer-events: none; z-index: 0;
            background:
                radial-gradient(ellipse 80% 50% at 50% -10%, rgba(33,150,243,0.18), transparent),
                radial-gradient(ellipse 60% 40% at 80% 90%, rgba(14,165,233,0.12), transparent),
                radial-gradient(ellipse 40% 30% at 10% 60%, rgba(33,150,243,0.08), transparent);
        }

        .bg-grid {
            position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.025;
            background-image:
                linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px);
            background-size: 60px 60px;
        }

        main { position: relative; z-index: 1; }

        nav {
            display: flex; align-items: center; justify-content: space-between;
            padding: 1.25rem 2rem;
            border-bottom: 1px solid var(--border);
            backdrop-filter: blur(12px);
            background: rgba(10,10,11,0.6);
            position: sticky; top: 0; z-index: 10;
        }

        .nav-logo {
            display: flex; align-items: center; gap: 0.6rem; text-decoration: none;
        }

        .nav-logo-text {
            font-size: 0.95rem; font-weight: 600; color: var(--text);
            letter-spacing: -0.02em;
        }

        .nav-logo-text span { color: var(--sky); }

        .btn-login {
            display: inline-flex; align-items: center; gap: 0.5rem;
            padding: 0.5rem 1.25rem; border-radius: 8px;
            background: rgba(33,150,243,0.12); border: 1px solid rgba(33,150,243,0.3);
            color: var(--sky); font-size: 0.875rem; font-weight: 500;
            text-decoration: none; transition: all 0.2s;
            font-family: 'Sora', sans-serif;
        }
        .btn-login:hover { background: rgba(33,150,243,0.22); border-color: rgba(33,150,243,0.5); }

        .hero {
            display: flex; flex-direction: column; align-items: center; text-align: center;
            padding: 6rem 1.5rem 3rem;
            max-width: 860px; margin: 0 auto;
        }

        .badge {
            display: inline-flex; align-items: center; gap: 0.4rem;
            padding: 0.3rem 0.9rem; border-radius: 999px;
            background: rgba(33,150,243,0.1); border: 1px solid rgba(33,150,243,0.25);
            font-size: 0.78rem; font-weight: 500; color: var(--sky);
            margin-bottom: 1.75rem; letter-spacing: 0.03em;
        }

        .badge-dot {
            width: 6px; height: 6px; border-radius: 50%;
            background: var(--sky); animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
        }

        h1 {
            font-size: clamp(2.2rem, 5vw, 3.6rem);
            font-weight: 700; line-height: 1.12;
            letter-spacing: -0.03em; margin-bottom: 1.5rem;
        }

        h1 .accent {
            background: linear-gradient(135deg, #2196F3, #0ea5e9, #38bdf8);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .hero-sub {
            font-size: 1.1rem; color: var(--muted); line-height: 1.7;
            max-width: 580px; margin-bottom: 2.5rem;
        }

        .hero-cta {
            display: inline-flex; align-items: center; gap: 0.6rem;
            padding: 0.85rem 2rem; border-radius: 10px;
            background: linear-gradient(135deg, #2196F3, #0ea5e9);
            color: #fff; font-size: 1rem; font-weight: 600;
            text-decoration: none; letter-spacing: -0.01em;
            box-shadow: 0 0 32px rgba(33,150,243,0.35);
            transition: all 0.25s; font-family: 'Sora', sans-serif;
        }
        .hero-cta:hover {
            transform: translateY(-2px);
            box-shadow: 0 0 48px rgba(33,150,243,0.5);
        }
        .hero-cta svg { transition: transform 0.2s; }
        .hero-cta:hover svg { transform: translateX(3px); }

        .globe-wrap {
            margin-top: 4rem; position: relative;
            width: min(560px, 100%);
        }

        .globe-wrap::before {
            content: '';
            position: absolute; inset: -40px;
            background: radial-gradient(circle, rgba(33,150,243,0.12), transparent 65%);
            pointer-events: none;
        }

        .globe-svg {
            width: 100%; opacity: 0.7;
            animation: float 8s ease-in-out infinite;
        }

        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-12px); }
        }

        .stats {
            display: flex; justify-content: center; flex-wrap: wrap; gap: 0;
            border-top: 1px solid var(--border);
            border-bottom: 1px solid var(--border);
            margin: 2rem 0;
        }

        .stat-item {
            flex: 1; min-width: 180px;
            padding: 1.75rem 2rem; text-align: center;
            border-right: 1px solid var(--border);
        }
        .stat-item:last-child { border-right: none; }

        .stat-number {
            font-size: 2rem; font-weight: 700;
            background: linear-gradient(135deg, #fff, #94a3b8);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            background-clip: text; letter-spacing: -0.03em;
        }

        .stat-label { font-size: 0.82rem; color: var(--muted); margin-top: 0.3rem; }

        .features {
            max-width: 1100px; margin: 0 auto; padding: 4rem 1.5rem;
        }

        .section-label {
            text-align: center; font-size: 0.8rem; font-weight: 600;
            color: var(--sky); letter-spacing: 0.1em; text-transform: uppercase;
            margin-bottom: 0.75rem;
        }

        .section-title {
            text-align: center; font-size: clamp(1.5rem, 3vw, 2.2rem);
            font-weight: 700; letter-spacing: -0.02em; margin-bottom: 3rem;
        }

        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
            gap: 1.25rem;
        }

        .feature-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 14px; padding: 1.75rem;
            transition: border-color 0.2s, background 0.2s;
        }
        .feature-card:hover {
            border-color: rgba(33,150,243,0.3);
            background: rgba(33,150,243,0.05);
        }

        .feature-icon {
            width: 44px; height: 44px; border-radius: 10px;
            background: rgba(33,150,243,0.12); border: 1px solid rgba(33,150,243,0.2);
            display: flex; align-items: center; justify-content: center;
            margin-bottom: 1.1rem;
        }

        .feature-icon svg { width: 22px; height: 22px; color: var(--sky); }

        .feature-title {
            font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem;
        }

        .feature-desc {
            font-size: 0.875rem; color: var(--muted); line-height: 1.65;
        }

        .cta-section {
            max-width: 700px; margin: 2rem auto 6rem;
            padding: 3rem 2rem;
            background: var(--card); border: 1px solid var(--border);
            border-radius: 20px; text-align: center;
            position: relative; overflow: hidden;
        }

        .cta-section::before {
            content: '';
            position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
            width: 300px; height: 200px;
            background: radial-gradient(circle, rgba(33,150,243,0.2), transparent 70%);
            pointer-events: none;
        }

        .cta-section h2 {
            font-size: 1.75rem; font-weight: 700; letter-spacing: -0.02em;
            margin-bottom: 0.75rem; position: relative;
        }

        .cta-section p {
            color: var(--muted); font-size: 0.95rem; margin-bottom: 2rem; position: relative;
        }

        footer {
            border-top: 1px solid var(--border);
            padding: 1.5rem 2rem;
            text-align: center; color: var(--muted); font-size: 0.8rem;
        }

        @media (max-width: 600px) {
            nav { padding: 1rem; }
            .stat-item { min-width: 140px; padding: 1.25rem 1rem; }
        }
    </style>
</head>
<body>
    <div class="bg-glow"></div>
    <div class="bg-grid"></div>

    <main>
        <nav>
            <a href="/" class="nav-logo">
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="14" stroke="#2196F3" stroke-width="1.5" opacity="0.5"/>
                    <ellipse cx="16" cy="16" rx="6" ry="14" stroke="#0ea5e9" stroke-width="1.5"/>
                    <line x1="2" y1="16" x2="30" y2="16" stroke="#2196F3" stroke-width="1.5" opacity="0.5"/>
                    <line x1="2" y1="10" x2="30" y2="10" stroke="#2196F3" stroke-width="1" opacity="0.3"/>
                    <line x1="2" y1="22" x2="30" y2="22" stroke="#2196F3" stroke-width="1" opacity="0.3"/>
                </svg>
                <span class="nav-logo-text">Geopolitica <span>para Investidores</span></span>
            </a>
            <a href="{{ config('app.frontend_url') }}/login" class="btn-login">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Entrar
            </a>
        </nav>

        <section class="hero">
            <div class="badge">
                <span class="badge-dot"></span>
                Análise geopolítica em tempo real
            </div>

            <h1>
                Entenda o mundo.<br>
                <span class="accent">Proteja seus investimentos.</span>
            </h1>

            <p class="hero-sub">
                Alertas preditivos com IA, cenários de risco geopolítico e análises profundas
                para investidores que precisam antecipar movimentos globais.
            </p>

            <a href="{{ config('app.frontend_url') }}/login" class="hero-cta">
                Acessar a plataforma
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                </svg>
            </a>

            <div class="globe-wrap">
                <svg class="globe-svg" viewBox="0 0 560 340" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="280" cy="170" rx="260" ry="155" stroke="#2196F3" stroke-width="0.8" opacity="0.2"/>
                    <ellipse cx="280" cy="170" rx="200" ry="155" stroke="#2196F3" stroke-width="0.6" opacity="0.15"/>
                    <ellipse cx="280" cy="170" rx="130" ry="155" stroke="#2196F3" stroke-width="0.6" opacity="0.15"/>
                    <ellipse cx="280" cy="170" rx="60" ry="155" stroke="#2196F3" stroke-width="0.6" opacity="0.15"/>
                    <line x1="20" y1="105" x2="540" y2="105" stroke="#2196F3" stroke-width="0.6" opacity="0.15"/>
                    <line x1="20" y1="170" x2="540" y2="170" stroke="#2196F3" stroke-width="0.8" opacity="0.2"/>
                    <line x1="20" y1="235" x2="540" y2="235" stroke="#2196F3" stroke-width="0.6" opacity="0.15"/>
                    <path d="M140 100 L155 90 L170 95 L175 115 L165 130 L160 150 L150 165 L145 185 L135 195 L125 190 L120 175 L125 160 L130 145 L125 130 L128 115 Z" fill="#2196F3" opacity="0.25" stroke="#0ea5e9" stroke-width="0.8"/>
                    <path d="M255 75 L275 70 L290 78 L295 95 L285 108 L280 95 L270 100 L260 92 Z" fill="#2196F3" opacity="0.25" stroke="#0ea5e9" stroke-width="0.8"/>
                    <path d="M265 115 L285 112 L295 120 L298 140 L290 158 L280 170 L268 165 L260 148 L258 130 Z" fill="#2196F3" opacity="0.2" stroke="#0ea5e9" stroke-width="0.8"/>
                    <path d="M310 70 L345 65 L375 72 L395 85 L400 100 L385 112 L360 115 L340 108 L318 105 L308 90 Z" fill="#2196F3" opacity="0.25" stroke="#0ea5e9" stroke-width="0.8"/>
                    <path d="M355 118 L380 115 L400 122 L408 138 L395 150 L375 152 L358 142 L350 130 Z" fill="#2196F3" opacity="0.2" stroke="#0ea5e9" stroke-width="0.8"/>
                    <path d="M390 195 L415 190 L428 200 L425 218 L410 225 L395 220 L388 208 Z" fill="#2196F3" opacity="0.18" stroke="#0ea5e9" stroke-width="0.8"/>
                    <circle cx="148" cy="130" r="3" fill="#0ea5e9" opacity="0.9"/>
                    <circle cx="148" cy="130" r="6" fill="#0ea5e9" opacity="0.2"/>
                    <circle cx="148" cy="130" r="10" fill="#0ea5e9" opacity="0.07"/>
                    <circle cx="275" cy="88" r="3" fill="#0ea5e9" opacity="0.9"/>
                    <circle cx="275" cy="88" r="6" fill="#0ea5e9" opacity="0.2"/>
                    <circle cx="275" cy="88" r="10" fill="#0ea5e9" opacity="0.07"/>
                    <circle cx="360" cy="90" r="3" fill="#2196F3" opacity="0.9"/>
                    <circle cx="360" cy="90" r="6" fill="#2196F3" opacity="0.2"/>
                    <circle cx="360" cy="90" r="10" fill="#2196F3" opacity="0.07"/>
                    <circle cx="408" cy="200" r="2.5" fill="#0ea5e9" opacity="0.7"/>
                    <circle cx="408" cy="200" r="5" fill="#0ea5e9" opacity="0.15"/>
                    <line x1="148" y1="130" x2="275" y2="88" stroke="#0ea5e9" stroke-width="0.8" stroke-dasharray="4 3" opacity="0.35"/>
                    <line x1="275" y1="88" x2="360" y2="90" stroke="#0ea5e9" stroke-width="0.8" stroke-dasharray="4 3" opacity="0.35"/>
                    <line x1="360" y1="90" x2="408" y2="200" stroke="#2196F3" stroke-width="0.8" stroke-dasharray="4 3" opacity="0.25"/>
                    <ellipse cx="280" cy="170" rx="262" ry="157" stroke="url(#glowGrad)" stroke-width="1.5" opacity="0.4"/>
                    <defs>
                        <linearGradient id="glowGrad" x1="0" y1="0" x2="560" y2="340" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stop-color="#2196F3"/>
                            <stop offset="50%" stop-color="#0ea5e9"/>
                            <stop offset="100%" stop-color="#2196F3"/>
                        </linearGradient>
                    </defs>
                </svg>
            </div>
        </section>

        <div class="stats">
            <div class="stat-item">
                <div class="stat-number">180+</div>
                <div class="stat-label">Países monitorados</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">24/7</div>
                <div class="stat-label">Monitoramento contínuo</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">IA</div>
                <div class="stat-label">Alertas preditivos</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">Real-time</div>
                <div class="stat-label">Análises atualizadas</div>
            </div>
        </div>

        <section class="features">
            <p class="section-label">Recursos da plataforma</p>
            <h2 class="section-title">Tudo que você precisa para decidir com confiança</h2>

            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                        </svg>
                    </div>
                    <div class="feature-title">Alertas Preditivos com IA</div>
                    <p class="feature-desc">Nossa IA analisa padrões históricos e sinais geopolíticos para antecipar movimentos de mercado antes que se tornem manchetes.</p>
                </div>

                <div class="feature-card">
                    <div class="feature-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="2" y1="12" x2="22" y2="12"/>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                        </svg>
                    </div>
                    <div class="feature-title">Mapa de Riscos Globais</div>
                    <p class="feature-desc">Visualize em tempo real zonas de conflito, instabilidade política e tensões comerciais que impactam seus ativos e carteiras.</p>
                </div>

                <div class="feature-card">
                    <div class="feature-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                            <polyline points="17 6 23 6 23 12"/>
                        </svg>
                    </div>
                    <div class="feature-title">Cenários de Investimento</div>
                    <p class="feature-desc">Projeções baseadas em análise geopolítica para commodities, moedas e mercados emergentes com diferentes níveis de risco.</p>
                </div>

                <div class="feature-card">
                    <div class="feature-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                    </div>
                    <div class="feature-title">Relatórios Aprofundados</div>
                    <p class="feature-desc">Análises detalhadas sobre regiões estratégicas, com contexto histórico, atores relevantes e implicações para o portfólio.</p>
                </div>

                <div class="feature-card">
                    <div class="feature-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 20V10"/>
                            <path d="M12 20V4"/>
                            <path d="M6 20v-6"/>
                        </svg>
                    </div>
                    <div class="feature-title">Dashboard Personalizado</div>
                    <p class="feature-desc">Configure seu painel de acordo com suas regiões e classes de ativos de interesse para monitorar só o que importa para você.</p>
                </div>

                <div class="feature-card">
                    <div class="feature-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07M8.46 8.46a5 5 0 0 0 0 7.07"/>
                        </svg>
                    </div>
                    <div class="feature-title">Notificações em Tempo Real</div>
                    <p class="feature-desc">Receba alertas imediatos quando eventos geopolíticos relevantes ocorrem em regiões ou setores que você acompanha.</p>
                </div>
            </div>
        </section>

        <section style="padding: 0 1.5rem;">
            <div class="cta-section">
                <h2>Comece a investir com mais inteligência</h2>
                <p>Acesse a plataforma e tenha visibilidade sobre os riscos que movem os mercados.</p>
                <a href="{{ config('app.frontend_url') }}/login" class="hero-cta" style="display: inline-flex;">
                    Acessar minha conta
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12 5 19 12 12 19"/>
                    </svg>
                </a>
            </div>
        </section>

        <footer>
            &copy; {{ date('Y') }} Geopolitica para Investidores. Todos os direitos reservados.
        </footer>
    </main>
</body>
</html>
