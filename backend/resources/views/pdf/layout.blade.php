<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <title>Geopolítica para Investidores</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Georgia, serif;
            font-size: 10pt;
            color: #1a1a1b;
            background: #ffffff;
            line-height: 1.6;
        }

        h1, h2, h3, h4, h5, h6 {
            font-family: Georgia, serif;
            color: #1a1a1b;
        }

        a {
            color: #C9B882;
            text-decoration: none;
        }

        p {
            margin-bottom: 8pt;
        }

        .page-wrapper {
            padding: 40pt 48pt 80pt 48pt;
        }

        /* Header */
        .header {
            display: table;
            width: 100%;
            padding-bottom: 12pt;
            margin-bottom: 24pt;
            border-bottom: 2px solid #C9B882;
        }

        .header-left {
            display: table-cell;
            vertical-align: middle;
        }

        .header-right {
            display: table-cell;
            vertical-align: middle;
            text-align: right;
            font-size: 8pt;
            color: #6b7280;
            white-space: nowrap;
        }

        .header-brand {
            font-family: Georgia, serif;
            font-size: 13pt;
            font-weight: bold;
            color: #1a1a1b;
            letter-spacing: 0.02em;
        }

        .header-brand span {
            color: #C9B882;
        }

        /* Footer */
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 10pt 48pt;
            border-top: 1px solid #e5e7eb;
            background: #ffffff;
            font-size: 7pt;
            color: #9ca3af;
            line-height: 1.4;
        }

        /* Content area */
        .content {
            min-height: 500pt;
        }

        /* Utility */
        .text-dourado {
            color: #C9B882;
        }

        .uppercase {
            text-transform: uppercase;
        }

        .tracking {
            letter-spacing: 0.1em;
        }

        .bold {
            font-weight: bold;
        }

        .mt-4 {
            margin-top: 4pt;
        }

        .mt-8 {
            margin-top: 8pt;
        }

        .mt-12 {
            margin-top: 12pt;
        }

        .mt-16 {
            margin-top: 16pt;
        }

        .mb-4 {
            margin-bottom: 4pt;
        }

        .mb-8 {
            margin-bottom: 8pt;
        }

        .divider {
            border: none;
            border-top: 1px solid #e5e7eb;
            margin: 16pt 0;
        }
    </style>
</head>
<body>
    <div class="footer">
        Este documento tem caráter exclusivamente analítico e informativo. Não constitui recomendação de investimento, consultoria financeira ou indicação de compra e venda de ativos. © Geopolítica para Investidores.
    </div>

    <div class="page-wrapper">
        <div class="header">
            <div class="header-left">
                @if (!empty($companyLogo))
                    <img src="{{ $companyLogo }}" style="height:28px; display:block;">
                @else
                    <div class="header-brand">Geopolítica <span>para Investidores</span></div>
                @endif
            </div>
            <div class="header-right">
                Gerado em {{ \Carbon\Carbon::now()->locale('pt_BR')->isoFormat('D [de] MMMM [de] YYYY') }}
            </div>
        </div>

        <div class="content">
            @yield('content')
        </div>
    </div>
</body>
</html>
