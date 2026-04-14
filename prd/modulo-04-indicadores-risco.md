# PRD — Módulo 4: Indicadores de Risco
**Projeto:** Geopolítica para Investidores — Dashboard de Inteligência Geopolítica
**Versão:** 2.0 (reescrito para Laravel 13 + React SPA)
**Data:** Abril 2026
**Depende de:** Módulo 1 concluído (autenticação)
**Status:** Aprovado para desenvolvimento

---

## 1. Visão Geral

O Módulo 4 é a **barra de Indicadores de Risco** — uma faixa fixa no topo do dashboard que exibe em tempo real os seis commodities e ativos com maior relevância geopolítica para o Brasil:

| # | Indicador | Por quê importa |
|---|-----------|-----------------|
| 1 | Petróleo Brent | Proxy direto de tensão geopolítica no Oriente Médio e energia global |
| 2 | Câmbio BRL/USD | Termômetro imediato de risco emergente e apetite por dólar |
| 3 | Gás Natural | Sensível a conflitos na Europa e política energética global |
| 4 | Soja | Brasil é o maior exportador mundial — tensão com China impacta diretamente |
| 5 | Trigo | Ucrânia e Rússia controlam 30% da oferta global |
| 6 | Minério de Ferro | Proxy da demanda industrial chinesa e saúde da economia asiática |

Para cada indicador o assinante vê: **valor atual**, **variação percentual das últimas 24h** e um **minigráfico SVG dos últimos 7 dias**.

A barra é **persistente** — aparece em todas as páginas do dashboard sem ocupar espaço do conteúdo principal. Transforma o dashboard num ambiente que o assinante quer manter aberto durante o dia — não só consultar pontualmente.

---

## 2. Stack Tecnológico

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Backend | Laravel 13 (reusa Módulos anteriores) | — |
| Coleta de dados | Laravel HTTP Client (nativo) | Sem biblioteca extra para Yahoo Finance e BCB |
| Cache histórico | MySQL (tabela nova) | Armazena 7 dias de histórico para os minigráficos |
| Cache valores atuais | Redis (TTL 15 min) | Evita queries repetidas ao banco para a barra |
| Agendamento | Laravel Scheduler (já configurado) | Nova rota adicionada ao Kernel.php |
| Frontend | React + TypeScript (reusa projeto SPA) | — |
| Minigráficos | SVG inline (sem biblioteca) | Ultraleve, sem dependência extra, totalmente customizável |

**Todas as fontes de dados são gratuitas e não requerem cadastro:**

| Indicador | Fonte | Símbolo / Endpoint | Frequência |
|-----------|-------|-------------------|------------|
| Petróleo Brent | Yahoo Finance | `BZ=F` | A cada 15 min |
| Câmbio BRL/USD | Banco Central do Brasil (PTAX) | `olinda.bcb.gov.br` | Diária (dias úteis) |
| Gás Natural | Yahoo Finance | `NG=F` | A cada 15 min |
| Soja | Yahoo Finance | `ZS=F` | A cada 15 min |
| Trigo | Yahoo Finance | `ZW=F` | A cada 15 min |
| Minério de Ferro | Yahoo Finance | `TIO=F` | A cada 15 min |

> **Nota sobre Yahoo Finance:** O endpoint `https://query1.finance.yahoo.com/v8/finance/chart/{symbol}` é não-oficial mas amplamente estável para o MVP. Para produção de longo prazo, considerar Alpha Vantage (25 req/dia grátis) ou Twelve Data (800 req/dia grátis).

---

## 3. Dependências de Outros Módulos

| Módulo | Dependência | Tipo |
|--------|-------------|------|
| Módulo 1 | Sistema de autenticação (Sanctum + roles) | Obrigatória |
| Módulo 1 | Laravel Scheduler já configurado | Obrigatória |
| Módulos 2 e 3 | Nenhuma | — |

> O Módulo 4 pode ser desenvolvido **em paralelo** com os Módulos 2 e 3. Não depende de dados da tabela `events` — usa fontes externas próprias.

---

## 4. Prazo MVP e Custo Estimado

| Item | Valor |
|------|-------|
| Prazo MVP | 2 dias de desenvolvimento |
| Custo estimado | R$ 2.000 – R$ 5.000 |
| Custo mensal adicional | R$ 0 (todas as fontes são gratuitas) |

**Cronograma:**

| Dia | Foco | Entregáveis |
|-----|------|-------------|
| Dia 1 | Dados e backend | Tabelas criadas, `MarketFetcherService` funcionando para todos os símbolos, endpoints respondendo, job agendado |
| Dia 2 | Interface e integração | `IndicatorCard` com minigráfico SVG, `IndicatorsBar` montada, integrada no layout, testada em todas as páginas |

---

## 5. Arquitetura Laravel

### 5.1 Estrutura de Arquivos

```
app/
├── Http/
│   ├── Controllers/
│   │   └── Api/
│   │       ├── IndicadoresController.php        ← valores atuais (GET)
│   │       └── IndicadoresHistoricoController.php ← histórico 7 dias (GET)
│   └── Resources/
│       └── IndicadorResource.php
├── Models/
│   ├── Indicador.php
│   └── IndicadorHistorico.php
├── Services/
│   ├── MarketFetcherService.php                 ← cliente Yahoo Finance + BCB
│   └── IndicadoresService.php                   ← orquestra coleta e persistência
└── Jobs/
    └── AtualizarIndicadoresJob.php              ← job assíncrono de coleta

database/
├── migrations/
│   ├── 2026_04_01_000006_create_indicadores_table.php
│   └── 2026_04_01_000007_create_indicadores_historico_table.php
└── seeders/
    └── IndicadoresSeeder.php                    ← registros iniciais dos 6 indicadores
```

### 5.2 Models e Migrations

#### Migration: `create_indicadores_table`
```php
Schema::create('indicadores', function (Blueprint $table) {
    $table->id();
    $table->string('simbolo')->unique();   // BZ=F, BRLUSD, NG=F, ZS=F, ZW=F, TIO=F
    $table->string('nome');                // Petróleo Brent, Câmbio BRL/USD, ...
    $table->float('valor');
    $table->string('moeda', 3);            // USD ou BRL
    $table->string('unidade')->nullable(); // barril, MMBtu, bushel, tonelada
    $table->float('variacao_pct')->nullable();
    $table->float('variacao_abs')->nullable();
    $table->timestamp('atualizado_em')->useCurrent();
    $table->timestamps();
});
```

#### Migration: `create_indicadores_historico_table`
```php
Schema::create('indicadores_historico', function (Blueprint $table) {
    $table->id();
    $table->string('simbolo');
    $table->float('valor');
    $table->timestamp('registrado_em')->useCurrent();

    $table->index(['simbolo', 'registrado_em']);
});
```

#### Seeder: `IndicadoresSeeder`
```php
// database/seeders/IndicadoresSeeder.php
$indicadores = [
    ['simbolo' => 'BZ=F',   'nome' => 'Petróleo Brent',   'moeda' => 'USD', 'unidade' => 'barril',   'valor' => 0],
    ['simbolo' => 'BRLUSD', 'nome' => 'Câmbio BRL/USD',   'moeda' => 'BRL', 'unidade' => null,       'valor' => 0],
    ['simbolo' => 'NG=F',   'nome' => 'Gás Natural',      'moeda' => 'USD', 'unidade' => 'MMBtu',    'valor' => 0],
    ['simbolo' => 'ZS=F',   'nome' => 'Soja',             'moeda' => 'USD', 'unidade' => 'bushel',   'valor' => 0],
    ['simbolo' => 'ZW=F',   'nome' => 'Trigo',            'moeda' => 'USD', 'unidade' => 'bushel',   'valor' => 0],
    ['simbolo' => 'TIO=F',  'nome' => 'Minério de Ferro', 'moeda' => 'USD', 'unidade' => 'tonelada', 'valor' => 0],
];
```

#### Model: `Indicador`
```php
// app/Models/Indicador.php
class Indicador extends Model
{
    protected $table    = 'indicadores';
    protected $fillable = ['simbolo', 'nome', 'valor', 'moeda', 'unidade', 'variacao_pct', 'variacao_abs', 'atualizado_em'];

    protected $casts = [
        'valor'        => 'float',
        'variacao_pct' => 'float',
        'variacao_abs' => 'float',
        'atualizado_em' => 'datetime',
    ];

    // Ordem de exibição na barra
    public static array $ordemExibicao = ['BZ=F', 'BRLUSD', 'NG=F', 'ZS=F', 'ZW=F', 'TIO=F'];
}
```

#### Model: `IndicadorHistorico`
```php
// app/Models/IndicadorHistorico.php
class IndicadorHistorico extends Model
{
    protected $table    = 'indicadores_historico';
    protected $fillable = ['simbolo', 'valor', 'registrado_em'];

    protected $casts = [
        'valor'        => 'float',
        'registrado_em' => 'datetime',
    ];
}
```

### 5.3 Services

#### `MarketFetcherService`
```php
// app/Services/MarketFetcherService.php
namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MarketFetcherService
{
    private array $simbolosYahoo = ['BZ=F', 'NG=F', 'ZS=F', 'ZW=F', 'TIO=F'];

    /**
     * Busca dados de um símbolo no Yahoo Finance.
     * Retorna: ['simbolo', 'valor', 'variacao_pct', 'variacao_abs'] ou null.
     */
    public function buscarYahooFinance(string $simbolo): ?array
    {
        $url = "https://query1.finance.yahoo.com/v8/finance/chart/{$simbolo}?interval=1d&range=2d";

        $response = Http::timeout(15)
            ->withHeaders(['User-Agent' => 'Mozilla/5.0'])
            ->get($url);

        if ($response->failed()) {
            Log::warning("Yahoo Finance falhou para {$simbolo}", ['status' => $response->status()]);
            return null;
        }

        $resultado = $response->json('chart.result.0');
        if (!$resultado) return null;

        $fechamentos = $resultado['indicators']['quote'][0]['close'] ?? [];
        $atual    = end($fechamentos);
        $anterior = prev($fechamentos);

        if (!$atual || !$anterior) return null;

        $variacaoAbs = $atual - $anterior;
        $variacaoPct = ($variacaoAbs / $anterior) * 100;

        return [
            'simbolo'      => $simbolo,
            'valor'        => round($atual, 2),
            'variacao_pct' => round($variacaoPct, 2),
            'variacao_abs' => round($variacaoAbs, 2),
        ];
    }

    /**
     * Busca cotação BRL/USD no Banco Central do Brasil (PTAX).
     * Retorna: ['simbolo', 'valor', 'variacao_pct', 'variacao_abs'] ou null.
     */
    public function buscarBCBCambio(): ?array
    {
        $fmt = fn($d) => sprintf('%02d-%02d-%04d',
            $d->format('m'), $d->format('d'), $d->format('Y')
        );

        $hoje   = now();
        $ontem  = now()->subDay();

        $url = "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/"
            . "CotacaoDolarPeriodo(dataInicial=@di,dataFinalCotacao=@df)"
            . "?@di=%27{$fmt($ontem)}%27&@df=%27{$fmt($hoje)}%27"
            . "&\$top=2&\$orderby=dataHoraCotacao%20desc&\$format=json";

        $response = Http::timeout(15)->get($url);

        if ($response->failed()) {
            Log::warning('BCB PTAX indisponível', ['status' => $response->status()]);
            return null;
        }

        $cotacoes = $response->json('value', []);
        if (count($cotacoes) < 2) return null;

        $atual    = $cotacoes[0]['cotacaoVenda'];
        $anterior = $cotacoes[1]['cotacaoVenda'];
        $variacaoAbs = $atual - $anterior;
        $variacaoPct = ($variacaoAbs / $anterior) * 100;

        return [
            'simbolo'      => 'BRLUSD',
            'valor'        => round($atual, 4),
            'variacao_pct' => round($variacaoPct, 4),
            'variacao_abs' => round($variacaoAbs, 4),
        ];
    }

    /**
     * Busca todos os indicadores em paralelo.
     * Retorna array de resultados não-nulos.
     */
    public function buscarTodos(): array
    {
        // Yahoo Finance em paralelo via HTTP concurrent requests
        $resultados = collect($this->simbolosYahoo)
            ->map(fn($s) => $this->buscarYahooFinance($s))
            ->filter()
            ->values()
            ->toArray();

        // BCB separado (API diferente)
        $cambio = $this->buscarBCBCambio();
        if ($cambio) {
            $resultados[] = $cambio;
        }

        return $resultados;
    }
}
```

#### `IndicadoresService`
```php
// app/Services/IndicadoresService.php
namespace App\Services;

use App\Models\Indicador;
use App\Models\IndicadorHistorico;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class IndicadoresService
{
    public function __construct(private MarketFetcherService $fetcher) {}

    /**
     * Orquestra a coleta e persistência:
     * 1. Busca todos os indicadores via APIs externas
     * 2. Upsert na tabela indicadores (valores atuais)
     * 3. Insere no histórico
     * 4. Limpa histórico com mais de 8 dias
     * 5. Invalida cache Redis
     * Retorna: número de indicadores atualizados
     */
    public function atualizar(): int
    {
        $dados = $this->fetcher->buscarTodos();

        if (empty($dados)) return 0;

        // Upsert valores atuais
        foreach ($dados as $item) {
            Indicador::where('simbolo', $item['simbolo'])->update([
                'valor'        => $item['valor'],
                'variacao_pct' => $item['variacao_pct'],
                'variacao_abs' => $item['variacao_abs'],
                'atualizado_em' => now(),
            ]);
        }

        // Insere no histórico
        $historico = array_map(fn($item) => [
            'simbolo'      => $item['simbolo'],
            'valor'        => $item['valor'],
            'registrado_em' => now(),
        ], $dados);

        IndicadorHistorico::insert($historico);

        // Limpa histórico com mais de 8 dias
        IndicadorHistorico::where('registrado_em', '<', now()->subDays(8))->delete();

        // Invalida cache
        Cache::forget('indicadores_atuais');

        return count($dados);
    }

    /**
     * Retorna valores atuais de todos os indicadores na ordem correta.
     * Cache Redis de 15 minutos.
     */
    public function obterAtuais(): array
    {
        return Cache::remember('indicadores_atuais', 900, function () {
            $indicadores = Indicador::all()->keyBy('simbolo');

            return collect(Indicador::$ordemExibicao)
                ->map(fn($s) => $indicadores->get($s))
                ->filter()
                ->values()
                ->toArray();
        });
    }

    /**
     * Retorna histórico de 7 dias para um indicador específico.
     * Máx. 168 pontos (1 por hora se atualizado a cada hora).
     */
    public function obterHistorico(string $simbolo): array
    {
        return IndicadorHistorico::where('simbolo', $simbolo)
            ->where('registrado_em', '>=', now()->subDays(7))
            ->orderBy('registrado_em')
            ->limit(168)
            ->pluck('valor', 'registrado_em')
            ->toArray();
    }
}
```

### 5.4 FormRequests

```php
// app/Http/Requests/IndicadorHistoricoRequest.php
class IndicadorHistoricoRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'simbolo' => ['required', 'string', 'in:BZ=F,BRLUSD,NG=F,ZS=F,ZW=F,TIO=F'],
        ];
    }
}
```

### 5.5 Controllers e Rotas

```php
// app/Http/Controllers/Api/IndicadoresController.php
class IndicadoresController extends Controller
{
    public function __construct(private IndicadoresService $servico) {}

    /**
     * Retorna valores atuais dos 6 indicadores na ordem de exibição.
     * Cache de 15 min via Redis.
     */
    public function index(): JsonResponse
    {
        $indicadores = $this->servico->obterAtuais();

        return response()->json([
            'indicadores'  => IndicadorResource::collection(collect($indicadores)),
            'atualizado_em' => $indicadores[0]['atualizado_em'] ?? null,
        ]);
    }
}

// app/Http/Controllers/Api/IndicadoresHistoricoController.php
class IndicadoresHistoricoController extends Controller
{
    public function __construct(private IndicadoresService $servico) {}

    /**
     * Retorna histórico de 7 dias para um símbolo específico.
     * Usado para renderizar o minigráfico SVG.
     */
    public function index(IndicadorHistoricoRequest $request): JsonResponse
    {
        $simbolo  = $request->validated('simbolo');
        $historico = $this->servico->obterHistorico($simbolo);

        return response()->json(['historico' => $historico]);
    }
}
```

```php
// routes/api.php — adições do Módulo 4
Route::middleware('auth:sanctum')->group(function () {
    // Módulo 4 — Indicadores
    Route::get('/indicadores',            [IndicadoresController::class, 'index']);
    Route::get('/indicadores/historico',  [IndicadoresHistoricoController::class, 'index']);
});
```

---

## 6. Endpoints da API

| Método | Path | Auth | Params | Response |
|--------|------|------|--------|----------|
| GET | `/api/indicadores` | Sanctum (qualquer role) | — | `{ indicadores: Indicador[], atualizado_em }` |
| GET | `/api/indicadores/historico` | Sanctum (qualquer role) | `simbolo` (obrigatório) | `{ historico: { "timestamp": valor, ... } }` |

### Response: Indicador
```json
{
  "simbolo": "BZ=F",
  "nome": "Petróleo Brent",
  "valor": 87.43,
  "moeda": "USD",
  "unidade": "barril",
  "variacao_pct": 1.24,
  "variacao_abs": 1.07,
  "atualizado_em": "2026-04-14T15:30:00Z"
}
```

### Response: Histórico
```json
{
  "historico": {
    "2026-04-07T00:00:00Z": 85.10,
    "2026-04-08T00:00:00Z": 86.22,
    "2026-04-09T00:00:00Z": 84.98,
    "2026-04-10T00:00:00Z": 87.43
  }
}
```

---

## 7. Frontend React

### 7.1 Estrutura de Componentes e Páginas

```
src/
├── components/
│   ├── indicadores/
│   │   ├── IndicatorsBar.tsx          ← barra fixa no topo do dashboard (layout)
│   │   └── IndicatorCard.tsx          ← card individual com minigráfico SVG
│   └── layout/
│       └── DashboardLayout.tsx        ← layout atualizado com IndicatorsBar no topo
├── hooks/
│   ├── useIndicadores.ts              ← React Query hook para valores atuais
│   └── useIndicadorHistorico.ts       ← React Query hook para histórico por símbolo
└── types/
    └── indicadores.ts                 ← interfaces TypeScript
```

### 7.2 Componentes Principais

**IndicatorCard** — exibe para cada indicador:
- Nome do indicador (ex.: "Petróleo Brent") em `text-[10px] tracking-wider uppercase text-white/30`
- Valor atual formatado: `USD: "US$ 87.43"` | `BRL: "R$ 5.8420"`
- Variação percentual: verde `#4ade80` se positiva, vermelho `#f87171` se negativa
- Minigráfico SVG inline (sem biblioteca) — 64×28px, `polyline` com `stroke` na cor da variação

**Minigráfico SVG inline:**
```typescript
// Lógica de renderização do sparkline
const renderSparkline = (valores: number[]) => {
  if (valores.length < 2) return null;
  const min   = Math.min(...valores);
  const max   = Math.max(...valores);
  const range = max - min || 1;
  const W = 64, H = 28;

  const pontos = valores.map((v, i) => {
    const x = (i / (valores.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={W} height={H} className="flex-shrink-0">
      <polyline
        points={pontos}
        fill="none"
        stroke={corVariacao}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
```

**IndicatorsBar** — barra horizontal fixa:
- Fundo: `bg-[#0d0d0f]`
- Altura: `h-16` (`64px`)
- Overflow: `overflow-x-auto` para scroll horizontal em telas menores
- Label "Mercados" na extremidade esquerda
- 6 `IndicatorCard` em sequência: `BZ=F | BRLUSD | NG=F | ZS=F | ZW=F | TIO=F`
- Timestamp "atualizado X min atrás" na extremidade direita
- Atualização automática: `refetchInterval: 5 * 60 * 1000` (5 minutos)

### 7.3 Integração no Layout do Dashboard

```tsx
// src/components/layout/DashboardLayout.tsx
// A IndicatorsBar é inserida no topo do layout principal,
// acima da navegação entre módulos.

// Layout final com 4 módulos:
// ┌────────────────────────────────────────────────────────────┐
// │ INDICADORES (M4) — Brent | BRL/USD | Gás | Soja | Trigo  │  h-16
// ├────────────────────────────────────────────────────────────┤
// │ NAV — Feed de Tensões | Mapa de Calor | Biblioteca        │
// ├────────────────────────────────────────────────────────────┤
// │                                                            │
// │               CONTEÚDO DA PÁGINA ATIVA                    │
// │   (Feed M1 | Mapa M2 | Biblioteca M3)                     │
// │                                                            │
// └────────────────────────────────────────────────────────────┘

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col">
      <IndicatorsBar />     {/* Módulo 4 — barra de indicadores */}
      <TopNav />            {/* navegação entre módulos */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

### 7.4 Fluxo do Usuário
1. Usuário autentica e acessa qualquer página do dashboard
2. `IndicatorsBar` é renderizada no topo via `DashboardLayout`
3. Hook `useIndicadores` carrega `GET /api/indicadores` (cache React Query 5 min)
4. Cada `IndicatorCard` monta e chama `GET /api/indicadores/historico?simbolo=...`
5. Minigráfico SVG é renderizado com os pontos dos últimos 7 dias
6. Variação positiva → verde | Variação negativa → vermelho
7. Barra atualiza automaticamente a cada 5 minutos
8. Em telas menores que 1280px: scroll horizontal na barra

---

## 8. Agendamentos (Laravel Scheduler)

```php
// app/Console/Kernel.php — scheduler consolidado com todos os módulos
protected function schedule(Schedule $schedule): void
{
    // Módulo 1 — Feed de Tensões (a cada hora, minuto :00)
    $schedule->job(new ProcessFeedUpdateJob())
        ->hourly()
        ->withoutOverlapping();

    // Módulo 2 — GDELT (a cada hora, minuto :30)
    $schedule->job(new AtualizarGdeltJob())
        ->cron('30 * * * *')
        ->withoutOverlapping();

    // Módulo 4 — Indicadores de Risco (a cada 15 minutos)
    $schedule->job(new AtualizarIndicadoresJob())
        ->everyFifteenMinutes()
        ->withoutOverlapping()
        ->onFailure(function () {
            Log::error('AtualizarIndicadoresJob falhou no scheduler.');
        });

    // Limpeza de histórico antigo — diariamente às 2h
    $schedule->call(function () {
        IndicadorHistorico::where('registrado_em', '<', now()->subDays(8))->delete();
    })->dailyAt('02:00');
}
```

> **Distribuição de carga:** Feed M1 dispara nos minutos :00, GDELT M2 nos :30, e Indicadores M4 a cada 15 min (:00, :15, :30, :45). Sem sobreposição significativa.

---

## 9. Jobs e Queues

### `AtualizarIndicadoresJob`
```php
// app/Jobs/AtualizarIndicadoresJob.php
class AtualizarIndicadoresJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 60;
    public int $backoff = 30; // segundos entre retries

    public function handle(IndicadoresService $servico): void
    {
        $atualizados = $servico->atualizar();
        Log::info("Indicadores atualizados: {$atualizados}/6");
    }

    public function failed(Throwable $e): void
    {
        Log::error('AtualizarIndicadoresJob falhou', [
            'erro' => $e->getMessage(),
        ]);
    }
}
```

**Fila recomendada:** `redis` (mesmo worker dos Módulos 1 e 2, sem necessidade de worker separado).

---

## 10. Controle de Acesso (Spatie Roles)

| Role | Permissões no Módulo 4 |
|------|------------------------|
| `assinante_essencial` | Visualização da barra de indicadores (todos os 6 indicadores) |
| `assinante_pro` | Idem |
| `assinante_reservado` | Idem |
| `admin` | Idem + visibilidade de metadados de diagnóstico (timestamp da última coleta, número de pontos no histórico) |

> A barra de indicadores é o único componente do dashboard que **não** possui diferenciação por plano — é acessível a todos os assinantes autenticados como elemento de valor universal.

---

## 11. Error Handling

| Cenário | Tratamento |
|---------|-----------|
| Yahoo Finance offline | Log de warning, indicador mantém último valor no banco, minigráfico exibe dados anteriores |
| BCB PTAX offline (finais de semana, feriados) | Mantém última cotação, `variacao_pct` permanece do último dia útil |
| Yahoo Finance retorna payload incompleto | Função retorna `null`, indicador é saltado no upsert |
| Todos os 6 indicadores falham na coleta | Job falha com `failed()`, alerta no log, retry automático em 30s |
| Banco indisponível durante upsert | Job falha e é re-enfileirado automaticamente |
| Redis indisponível (cache) | Laravel cai para sem cache — query direta ao banco para cada request |
| Frontend sem dados (API fora) | `IndicatorCard` renderiza skeleton com `--` no lugar do valor |
| Símbolo inválido no endpoint de histórico | HTTP 422 via `FormRequest` (lista de valores válidos definida na validação) |

---

## 12. Checklist de Entrega

### Banco de Dados
- [ ] Tabela `indicadores` criada com os 6 registros iniciais inseridos (seeder)
- [ ] Tabela `indicadores_historico` criada com índice composto `(simbolo, registrado_em)`
- [ ] Verificar que `simbolo` em `indicadores` tem constraint `UNIQUE`

### Coleta de Dados
- [ ] `MarketFetcherService::buscarYahooFinance()` retornando dados para os 5 símbolos Yahoo
- [ ] `MarketFetcherService::buscarBCBCambio()` retornando cotação do BCB corretamente
- [ ] Testar em dias úteis (BCB) e finais de semana (deve manter último valor)
- [ ] `IndicadoresService::atualizar()` fazendo upsert em `indicadores` sem erros
- [ ] Histórico sendo registrado em `indicadores_historico` a cada execução
- [ ] Limpeza automática de registros com mais de 8 dias funcionando

### Jobs e Scheduler
- [ ] `AtualizarIndicadoresJob` executando sem erros (testar manualmente: `artisan dispatch:job`)
- [ ] Scheduler configurado para `everyFifteenMinutes` (testar com `artisan schedule:run`)
- [ ] `withoutOverlapping()` ativo — sem jobs duplicados rodando ao mesmo tempo
- [ ] Retry automático (3x, 30s de backoff) em caso de falha de API

### API Laravel
- [ ] `GET /api/indicadores` retornando 6 indicadores na ordem: Brent, BRL/USD, Gás, Soja, Trigo, Minério
- [ ] Cache Redis de 15 minutos funcionando (verificar com `redis-cli: GET indicadores_atuais`)
- [ ] `GET /api/indicadores/historico?simbolo=BZ=F` retornando histórico correto
- [ ] Validação rejeita símbolos inválidos com HTTP 422
- [ ] HTTP 401 para requisições sem autenticação

### Interface React
- [ ] `IndicatorCard` renderizando nome, valor formatado, variação e minigráfico SVG
- [ ] Cor verde para variação positiva (`#4ade80`), vermelha para negativa (`#f87171`)
- [ ] Skeleton/placeholder quando dados ainda estão carregando
- [ ] `IndicatorsBar` exibindo os 6 cards na ordem correta
- [ ] Barra visível em todas as páginas do dashboard (Feed, Mapa, Biblioteca)
- [ ] Atualização automática a cada 5 minutos (React Query `refetchInterval`)
- [ ] Timestamp "atualizado X min atrás" visível na barra
- [ ] Scroll horizontal funciona em telas menores que 1280px

### Layout Final
- [ ] `IndicatorsBar` posicionada acima da navegação de módulos em `DashboardLayout`
- [ ] Altura da barra é `h-16` (64px) sem ocupar espaço do conteúdo principal
- [ ] Layout testado em todas as 3 páginas: Feed (M1), Mapa (M2), Biblioteca (M3)
- [ ] Nenhum regressão visual nos módulos anteriores após adicionar a barra
