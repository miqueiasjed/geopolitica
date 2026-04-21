<?php

namespace Database\Seeders;

use App\Models\AlertaLeitura;
use App\Models\AlertaPreditivo;
use App\Models\Assinante;
use App\Models\ChatSessao;
use App\Models\Conteudo;
use App\Models\Empresa;
use App\Models\Event;
use App\Models\GdeltCache;
use App\Models\Indicador;
use App\Models\LicencaB2B;
use App\Models\MembroB2B;
use App\Models\PaisUsuario;
use App\Models\PerfilPais;
use App\Models\SinalPadrao;
use App\Models\Source;
use App\Models\User;
use App\Models\WebhookEvento;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class DadosProducaoFakeSeeder extends Seeder
{
    public function run(): void
    {
        $this->garantirRoles();

        $usuarios = $this->seedUsuariosEAssinaturas();
        $this->seedPerfisPaises();
        $eventos = $this->seedEventos();
        $this->seedGdelt();
        $this->seedSinaisEAlertas($eventos, $usuarios);
        $this->seedIndicadores();
        $this->seedConteudos();
        $this->seedPaisesFavoritos($usuarios);
        $this->seedChat($usuarios);
        $this->seedB2B();
        $this->seedWebhooks($usuarios);
        $this->atualizarFontes();
        Cache::flush();
    }

    private function garantirRoles(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach ([
            'assinante_essencial',
            'assinante_pro',
            'assinante_reservado',
            'admin',
            'company_admin',
            'reader',
        ] as $role) {
            Role::query()->firstOrCreate([
                'name' => $role,
                'guard_name' => 'sanctum',
            ]);
        }
    }

    private function seedUsuariosEAssinaturas(): array
    {
        $usuarios = [
            'essencial' => [
                'name' => 'Marina Torres',
                'email' => 'marina.essencial@geopolitica.test',
                'plano' => 'essencial',
                'role' => 'assinante_essencial',
                'status' => 'ativo',
                'ativo' => true,
                'assinado_em' => now()->subMonths(2),
                'expira_em' => now()->addMonths(10),
            ],
            'pro' => [
                'name' => 'Rafael Nogueira',
                'email' => 'rafael.pro@geopolitica.test',
                'plano' => 'pro',
                'role' => 'assinante_pro',
                'status' => 'ativo',
                'ativo' => true,
                'assinado_em' => now()->subMonths(5),
                'expira_em' => now()->addMonths(7),
            ],
            'reservado' => [
                'name' => 'Helena Andrade',
                'email' => 'helena.reservado@geopolitica.test',
                'plano' => 'reservado',
                'role' => 'assinante_reservado',
                'status' => 'ativo',
                'ativo' => true,
                'assinado_em' => now()->subYear(),
                'expira_em' => now()->addYear(),
            ],
            'cancelado' => [
                'name' => 'Bruno Sampaio',
                'email' => 'bruno.cancelado@geopolitica.test',
                'plano' => 'pro',
                'role' => null,
                'status' => 'cancelado',
                'ativo' => false,
                'assinado_em' => now()->subMonths(9),
                'expira_em' => now()->subDays(12),
            ],
            'expirado' => [
                'name' => 'Camila Duarte',
                'email' => 'camila.expirado@geopolitica.test',
                'plano' => 'essencial',
                'role' => null,
                'status' => 'expirado',
                'ativo' => false,
                'assinado_em' => now()->subYear(),
                'expira_em' => now()->subMonth(),
            ],
        ];

        $retorno = [];

        foreach ($usuarios as $chave => $dados) {
            $usuario = User::query()->updateOrCreate(
                ['email' => $dados['email']],
                [
                    'name' => $dados['name'],
                    'email_verified_at' => now(),
                    'password' => 'password',
                ],
            );

            if ($dados['role']) {
                $usuario->syncRoles([$dados['role']]);
            } else {
                $usuario->syncRoles([]);
            }

            Assinante::query()->updateOrCreate(
                ['user_id' => $usuario->id],
                [
                    'plano' => $dados['plano'],
                    'ativo' => $dados['ativo'],
                    'status' => $dados['status'],
                    'hotmart_subscriber_code' => 'HM-' . strtoupper($chave) . '-' . str_pad((string) $usuario->id, 5, '0', STR_PAD_LEFT),
                    'assinado_em' => $dados['assinado_em'],
                    'expira_em' => $dados['expira_em'],
                ],
            );

            $retorno[$chave] = $usuario;
        }

        return $retorno;
    }

    private function seedPerfisPaises(): void
    {
        $perfis = [
            'US' => ['Estados Unidos', 'América do Norte', 'Política fiscal, juros do Fed e competição tecnológica com a China continuam guiando fluxos globais de capital.', 'A liderança americana combina pressão eleitoral interna, protecionismo seletivo e prioridade estratégica em semicondutores, defesa e energia.'],
            'CN' => ['China', 'Ásia-Pacífico', 'A desaceleração imobiliária, o controle estatal sobre tecnologia e a disputa por Taiwan moldam o prêmio de risco asiático.', 'Pequim busca preservar crescimento com estímulos calibrados sem abrir mão de controle político e soberania industrial.'],
            'BR' => ['Brasil', 'América do Sul', 'Política fiscal, commodities e posicionamento diplomático entre EUA, China e Sul Global impactam câmbio e bolsa.', 'A liderança brasileira alterna pragmatismo comercial e agenda doméstica de investimento público, com atenção elevada ao Congresso.'],
            'AR' => ['Argentina', 'América do Sul', 'A estabilização macroeconômica e a relação com FMI e Mercosul seguem como vetores de risco regional.', 'O governo argentino prioriza ajuste fiscal e liberalização, mas depende de sustentação social e parlamentar.'],
            'RU' => ['Rússia', 'Europa Oriental', 'Sanções, guerra de atrito e receitas energéticas continuam conectando segurança europeia a commodities.', 'Moscou preserva centralização política e usa energia, defesa e alianças alternativas para reduzir isolamento ocidental.'],
            'DE' => ['Alemanha', 'Europa Ocidental', 'A reindustrialização, energia cara e coalizões frágeis pressionam o motor econômico europeu.', 'Berlim busca equilibrar disciplina fiscal, defesa europeia e competitividade industrial em um ambiente de baixo crescimento.'],
            'IR' => ['Irã', 'Oriente Médio', 'Sanções, programa nuclear e redes regionais de influência elevam risco para petróleo e rotas marítimas.', 'Teerã sustenta uma estratégia de dissuasão assimétrica e negociações táticas para preservar margem econômica.'],
            'IN' => ['Índia', 'Ásia-Pacífico', 'Crescimento, energia barata e rivalidade com a China tornam a Índia peça central nas cadeias alternativas de produção.', 'Nova Delhi mantém autonomia estratégica, atraindo investimento ocidental sem romper canais com Rússia e Sul Global.'],
            'MX' => ['México', 'América do Norte', 'Nearshoring, segurança pública e relação comercial com EUA puxam investimento industrial.', 'A liderança mexicana tenta combinar política social, soberania energética e integração pragmática ao USMCA.'],
            'NG' => ['Nigéria', 'África', 'Reformas cambiais, segurança no norte e petróleo determinam o apetite por risco na maior economia africana.', 'Abuja busca estabilizar moeda e arrecadação enquanto enfrenta custos sociais de ajustes econômicos.'],
        ];

        foreach ($perfis as $codigo => [$nome, $regiao, $contexto, $lideranca]) {
            PerfilPais::query()->updateOrCreate(
                ['codigo_pais' => $codigo],
                [
                    'nome_pt' => $nome,
                    'regiao_geopolitica' => $regiao,
                    'contexto_geopolitico' => $contexto,
                    'analise_lideranca' => $lideranca,
                    'gerado_em' => now()->subDays(rand(1, 12)),
                ],
            );
        }
    }

    private function seedEventos(): array
    {
        $eventos = [
            ['Estados Unidos', 'ALTO', 7, ['cambio', 'eleicoes'], 'Fed sinaliza cautela em cortes de juros após novos dados de inflação', 'Dados de serviços mantêm pressão sobre Treasuries e fortalecem o dólar contra moedas emergentes.', 'Reuters Markets', 2],
            ['China', 'CRÍTICO', 9, ['commodities', 'sancoes'], 'China amplia inspeções sobre exportações de minerais críticos', 'Medida reforça controle sobre cadeias de terras raras e afeta fornecedores de tecnologia e defesa.', 'Financial Times', 5],
            ['Brasil', 'MÉDIO', 5, ['commodities', 'cambio'], 'Debate fiscal no Brasil pressiona curva de juros antes de votação no Congresso', 'Investidores monitoram impacto sobre Selic terminal, câmbio e fluxo para renda variável local.', 'Valor Econômico', 7],
            ['Argentina', 'ALTO', 6, ['cambio', 'eleicoes'], 'Argentina negocia novo cronograma de desembolsos com credores multilaterais', 'Acordo pode aliviar reservas internacionais, mas depende de manutenção do ajuste fiscal.', 'Bloomberg', 10],
            ['Oriente Médio', 'CRÍTICO', 9, ['energia', 'conflitos'], 'Tensão no Estreito de Ormuz eleva prêmio de risco do petróleo', 'Seguradoras revisam custos de frete e mesas de energia ampliam hedge de Brent.', 'Al Jazeera', 12],
            ['Ucrânia', 'ALTO', 8, ['conflitos', 'alimentos'], 'Ataques a infraestrutura portuária reacendem risco para trigo no Mar Negro', 'Exportadores avaliam rotas alternativas enquanto contratos futuros de trigo avançam.', 'BBC World', 18],
            ['Alemanha', 'MÉDIO', 5, ['energia'], 'Alemanha aprova pacote para reduzir custo de energia industrial', 'Medida busca proteger margens da indústria química e metalúrgica em meio à concorrência asiática.', 'The Economist', 20],
            ['Índia', 'ALTO', 6, ['commodities', 'energia'], 'Índia aumenta compras de petróleo com desconto e amplia estoques estratégicos', 'Refinarias indianas elevam margens enquanto mantêm postura diplomática independente.', 'CNBC World', 22],
            ['México', 'MÉDIO', 5, ['eleicoes', 'cambio'], 'Nearshoring sustenta investimento no norte do México apesar de ruído eleitoral', 'Novos parques industriais ampliam demanda por energia e infraestrutura logística.', 'Reuters World', 26],
            ['Nigéria', 'ALTO', 7, ['energia', 'conflitos'], 'Interrupções em oleodutos reduzem exportações de petróleo da Nigéria', 'Mercado revisa oferta atlântica e acompanha efeitos sobre receitas fiscais nigerianas.', 'Bloomberg Energy', 30],
            ['Irã', 'CRÍTICO', 9, ['sancoes', 'energia'], 'Novas sanções financeiras contra o Irã elevam risco em bancos regionais', 'Instituições do Golfo revisam exposição e contratos de petróleo ganham volatilidade.', 'Foreign Policy', 34],
            ['França', 'MÉDIO', 4, ['eleicoes'], 'Protestos contra reforma orçamentária aumentam pressão sobre governo francês', 'Mercado acompanha capacidade de aprovação fiscal e reflexos em spreads soberanos europeus.', 'Le Monde', 38],
            ['Japão', 'MONITORAR', 3, ['cambio'], 'Iene volta ao radar após comentários do Banco do Japão', 'Investidores reduzem posições vendidas e monitoram chance de nova normalização monetária.', 'Nikkei Asia', 42],
            ['Chile', 'MÉDIO', 5, ['commodities', 'eleicoes'], 'Chile debate royalties do lítio antes de novo ciclo eleitoral', 'Mineradoras avaliam expansão de projetos frente à demanda por baterias e veículos elétricos.', 'América Economía', 47],
            ['Turquia', 'ALTO', 6, ['cambio'], 'Banco central turco mantém juros elevados para conter inflação persistente', 'Lira estabiliza no curto prazo, mas custo de crédito pesa sobre empresas domésticas.', 'Reuters Markets', 55],
            ['Venezuela', 'ALTO', 7, ['energia', 'sancoes'], 'Negociações sobre sanções venezuelanas reacendem expectativa para produção de petróleo', 'Operadoras internacionais aguardam clareza regulatória antes de ampliar investimentos.', 'Bloomberg', 63],
        ];

        $retorno = [];

        foreach ($eventos as $indice => [$regiao, $label, $score, $categorias, $titulo, $resumo, $fonte, $horas]) {
            $evento = Event::query()->updateOrCreate(
                ['fonte_url' => 'https://fake.geopolitica.test/noticias/' . Str::slug($titulo)],
                [
                    'titulo' => $titulo,
                    'resumo' => $resumo,
                    'analise_ia' => $this->analiseEvento($regiao, $label),
                    'fonte' => $fonte,
                    'regiao' => $regiao,
                    'impact_score' => $score,
                    'impact_label' => $label,
                    'categorias' => $categorias,
                    'relevante' => true,
                    'publicado_em' => now()->subHours($horas),
                    'created_at' => now()->subHours($horas),
                    'updated_at' => now()->subHours(max(1, $horas - 1)),
                ],
            );

            $retorno[$indice] = $evento;
        }

        return $retorno;
    }

    private function seedGdelt(): void
    {
        $paises = [
            ['US', 'Estados Unidos', 183, -0.8, 5.4],
            ['CA', 'Canadá', 44, 0.1, 2.8],
            ['CU', 'Cuba', 37, -0.9, 4.7],
            ['GB', 'Reino Unido', 72, -0.4, 4.1],
            ['FR', 'França', 83, -0.6, 4.6],
            ['CN', 'China', 241, -1.7, 7.6],
            ['BR', 'Brasil', 96, -0.3, 4.2],
            ['AR', 'Argentina', 78, -1.1, 5.8],
            ['CL', 'Chile', 54, -0.5, 4.4],
            ['CO', 'Colômbia', 49, -0.7, 4.9],
            ['RU', 'Rússia', 210, -2.8, 8.1],
            ['DE', 'Alemanha', 88, -0.5, 4.7],
            ['IT', 'Itália', 51, -0.2, 3.8],
            ['ES', 'Espanha', 46, -0.1, 3.4],
            ['PL', 'Polônia', 69, -1.2, 6.1],
            ['IR', 'Irã', 134, -2.4, 8.6],
            ['IQ', 'Iraque', 82, -2.1, 7.4],
            ['IL', 'Israel', 112, -2.6, 8.2],
            ['SA', 'Arábia Saudita', 91, -1.3, 6.4],
            ['TR', 'Turquia', 77, -1.0, 5.9],
            ['IN', 'Índia', 119, -0.6, 5.5],
            ['JP', 'Japão', 63, -0.2, 3.6],
            ['KR', 'Coreia do Sul', 58, -0.5, 4.8],
            ['KP', 'Coreia do Norte', 92, -2.7, 8.0],
            ['TW', 'Taiwan', 108, -1.9, 7.8],
            ['PK', 'Paquistão', 74, -1.8, 6.7],
            ['ID', 'Indonésia', 53, -0.3, 4.0],
            ['AU', 'Austrália', 41, 0.0, 2.9],
            ['MX', 'México', 69, -0.2, 3.9],
            ['NG', 'Nigéria', 104, -1.9, 6.9],
            ['ZA', 'África do Sul', 61, -0.8, 5.1],
            ['EG', 'Egito', 66, -1.2, 5.7],
            ['ET', 'Etiópia', 58, -1.6, 6.0],
            ['UA', 'Ucrânia', 176, -3.2, 8.9],
            ['VE', 'Venezuela', 71, -1.6, 6.2],
        ];

        foreach ($paises as [$codigo, $nome, $total, $tom, $intensidade]) {
            GdeltCache::query()->updateOrCreate(
                ['codigo_pais' => $codigo],
                [
                    'nome_pais' => $nome,
                    'total_eventos' => $total,
                    'tom_medio' => $tom,
                    'intensidade_gdelt' => $intensidade,
                    'atualizado_em' => now()->subMinutes(rand(8, 55)),
                ],
            );
        }
    }

    private function seedSinaisEAlertas(array $eventos, array $usuarios): void
    {
        $sinais = [
            [1, 'supply', 'Restrição de minerais críticos', 'China', 9, 0.88],
            [4, 'military', 'Risco em rota marítima energética', 'Oriente Médio', 10, 0.91],
            [5, 'supply', 'Interrupção em exportações agrícolas', 'Ucrânia', 8, 0.84],
            [10, 'diplomatic', 'Rodada de sanções financeiras', 'Irã', 9, 0.89],
            [9, 'supply', 'Queda em produção de petróleo', 'Nigéria', 7, 0.78],
            [0, 'diplomatic', 'Mudança de sinalização monetária', 'Estados Unidos', 5, 0.72],
        ];

        foreach ($sinais as [$indiceEvento, $tipo, $nome, $regiao, $peso, $confianca]) {
            $evento = $eventos[$indiceEvento] ?? null;

            if (! $evento) {
                continue;
            }

            SinalPadrao::query()->updateOrCreate(
                [
                    'event_id' => $evento->id,
                    'tipo_padrao' => $tipo,
                    'nome_sinal' => $nome,
                ],
                [
                    'regiao' => $regiao,
                    'peso' => $peso,
                    'confianca' => $confianca,
                    'analisado_em' => now()->subHours(rand(1, 24)),
                ],
            );
        }

        $alertas = [
            [
                'nivel' => 'critical',
                'regiao' => 'Oriente Médio',
                'titulo' => 'Prêmio de risco de energia em aceleração',
                'analise' => 'Convergência de tensão marítima, sanções e estoques apertados amplia risco de alta abrupta no Brent e custos logísticos.',
                'peso_total' => 28,
                'resumo_sinais' => [
                    ['titulo' => 'Risco em rota marítima energética', 'tipo' => 'military'],
                    ['titulo' => 'Rodada de sanções financeiras', 'tipo' => 'diplomatic'],
                ],
                'tipos_padrao' => ['military', 'diplomatic', 'supply'],
            ],
            [
                'nivel' => 'high',
                'regiao' => 'China',
                'titulo' => 'Cadeia de minerais críticos sob estresse',
                'analise' => 'Restrições regulatórias chinesas podem encarecer semicondutores, defesa e transição energética no curto prazo.',
                'peso_total' => 22,
                'resumo_sinais' => [
                    ['titulo' => 'Restrição de minerais críticos', 'tipo' => 'supply'],
                ],
                'tipos_padrao' => ['supply'],
            ],
            [
                'nivel' => 'medium',
                'regiao' => 'Brasil',
                'titulo' => 'Curva de juros local sensível ao risco fiscal',
                'analise' => 'Votação fiscal e inflação global mantêm volatilidade no câmbio e nos ativos de duration longa.',
                'peso_total' => 14,
                'resumo_sinais' => [
                    ['titulo' => 'Mudança de sinalização monetária', 'tipo' => 'diplomatic'],
                ],
                'tipos_padrao' => ['diplomatic'],
            ],
        ];

        foreach ($alertas as $dados) {
            $alerta = AlertaPreditivo::query()->updateOrCreate(
                ['titulo' => $dados['titulo'], 'regiao' => $dados['regiao']],
                $dados + ['notificado_em' => now()->subHours(rand(1, 12))],
            );

            foreach (['pro', 'reservado'] as $chaveUsuario) {
                if (! isset($usuarios[$chaveUsuario])) {
                    continue;
                }

                if ($dados['nivel'] === 'critical' && $chaveUsuario === 'pro') {
                    continue;
                }

                AlertaLeitura::query()->updateOrCreate(
                    ['user_id' => $usuarios[$chaveUsuario]->id, 'alerta_id' => $alerta->id],
                    ['lido_em' => now()->subMinutes(rand(15, 240))],
                );
            }
        }
    }

    private function seedIndicadores(): void
    {
        $indicadores = [
            ['BZ=F', 86.42, 'USD', 'USD/barril', 1.84, 1.56],
            ['USDBRL=X', 5.2381, 'BRL', 'R$/USD', -0.42, -0.022],
            ['NG=F', 3.18, 'USD', 'USD/MMBtu', 2.91, 0.09],
            ['ZS=F', 1198.25, 'USD', 'USD/bushel', -0.63, -7.58],
            ['ZW=F', 642.75, 'USD', 'USD/bushel', 1.12, 7.10],
            ['TIO=F', 108.40, 'USD', 'USD/t', -1.37, -1.50],
        ];

        foreach ($indicadores as [$simbolo, $valor, $moeda, $unidade, $variacaoPct, $variacaoAbs]) {
            Indicador::query()->updateOrCreate(
                ['simbolo' => $simbolo],
                [
                    'nome' => $this->nomeIndicador($simbolo),
                    'valor' => $valor,
                    'moeda' => $moeda,
                    'unidade' => $unidade,
                    'variacao_pct' => $variacaoPct,
                    'variacao_abs' => $variacaoAbs,
                    'atualizado_em' => now()->subMinutes(12),
                ],
            );

            for ($dia = 7; $dia >= 0; $dia--) {
                $registradoEm = now()->subDays($dia)->setTime(12, 0);
                $ajuste = (7 - $dia) * ($variacaoAbs / 8);

                DB::table('indicadores_historico')->updateOrInsert(
                    ['simbolo' => $simbolo, 'registrado_em' => $registradoEm],
                    [
                        'valor' => round($valor - $variacaoAbs + $ajuste, 4),
                        'created_at' => $registradoEm,
                    ],
                );
            }
        }
    }

    private function seedConteudos(): void
    {
        $conteudos = [
            ['briefing', 'Cenário Semanal: petróleo, dólar e risco eleitoral', 'Resumo executivo dos movimentos que mais afetam carteiras brasileiras nesta semana.', 'Global', ['energia', 'cambio', 'eleicoes'], 'essencial', 1],
            ['briefing', 'Alerta Pro: minerais críticos e semicondutores', 'Análise sobre como controles chineses podem alterar margens de tecnologia e defesa.', 'Ásia-Pacífico', ['sancoes', 'commodities'], 'pro', 3],
            ['mapa', 'Mapa de Calor: corredores energéticos sob pressão', 'Leitura visual dos pontos de tensão em rotas de petróleo, gás e fertilizantes.', 'Oriente Médio', ['energia', 'conflitos'], 'pro', 6],
            ['tese', 'Tese Reservada: defesa, ouro e energia em carteira barbell', 'Como montar proteção geopolítica sem sacrificar liquidez em cenários de cauda.', 'Global', ['tese', 'ouro', 'energia'], 'reservado', 9],
            ['briefing', 'América Latina: risco fiscal e eleições no radar', 'Comparativo entre Brasil, Argentina, Chile e México para alocação regional.', 'América do Sul', ['eleicoes', 'cambio'], 'essencial', 14],
            ['mapa', 'Ásia-Pacífico: tensões marítimas e supply chain', 'Monitoramento de Taiwan, Mar do Sul da China e semicondutores.', 'Ásia-Pacífico', ['supply', 'conflitos'], 'reservado', 35],
        ];

        foreach ($conteudos as [$tipo, $titulo, $resumo, $regiao, $tags, $plano, $dias]) {
            Conteudo::query()->updateOrCreate(
                ['slug' => Str::slug($titulo)],
                [
                    'tipo' => $tipo,
                    'titulo' => $titulo,
                    'corpo' => $this->corpoConteudo($titulo, $resumo),
                    'resumo' => $resumo,
                    'regiao' => $regiao,
                    'tags' => $tags,
                    'tese_manchete' => $tipo === 'tese' ? 'Estratégia de proteção para choques geopolíticos' : null,
                    'plano_minimo' => $plano,
                    'publicado' => true,
                    'publicado_em' => now()->subDays($dias),
                ],
            );
        }
    }

    private function seedPaisesFavoritos(array $usuarios): void
    {
        $favoritos = [
            'admin' => ['US', 'CN', 'BR', 'RU', 'IR', 'DE', 'IN', 'MX', 'NG', 'UA'],
            'essencial' => ['US', 'BR', 'CN'],
            'pro' => ['US', 'CN', 'RU', 'DE', 'IR', 'IN'],
            'reservado' => ['US', 'CN', 'BR', 'AR', 'RU', 'IR', 'IN', 'MX', 'NG', 'DE'],
        ];

        $usuarios['admin'] = User::query()->where('email', env('ADMIN_EMAIL', 'admin@geopolitica.test'))->first();

        foreach ($favoritos as $chaveUsuario => $codigos) {
            $usuario = $usuarios[$chaveUsuario] ?? null;

            if (! $usuario) {
                continue;
            }

            foreach ($codigos as $indice => $codigo) {
                DB::table('paises_usuarios')->updateOrInsert(
                    ['user_id' => $usuario->id, 'codigo_pais' => $codigo],
                    ['adicionado_em' => now()->subDays($indice + 1)],
                );
            }
        }
    }

    private function seedChat(array $usuarios): void
    {
        foreach (['essencial', 'pro', 'reservado'] as $chaveUsuario) {
            $usuario = $usuarios[$chaveUsuario] ?? null;

            if (! $usuario) {
                continue;
            }

            $sessao = ChatSessao::query()->updateOrCreate(
                ['user_id' => $usuario->id, 'data_sessao' => today()],
                ['pergunta_count' => $chaveUsuario === 'essencial' ? 3 : 7],
            );

            $mensagens = [
                ['user', 'Quais riscos geopolíticos devo acompanhar hoje?'],
                ['assistant', 'Os principais vetores são energia no Oriente Médio, minerais críticos na China e risco fiscal no Brasil. Para carteira local, observe Brent, dólar e curva DI.'],
                ['user', 'Isso muda a tese para commodities?'],
                ['assistant', 'A tese segue positiva para energia e metais estratégicos, mas com maior dispersão entre empresas integradas e produtores dependentes de frete.'],
            ];

            foreach ($mensagens as $indice => [$role, $conteudo]) {
                DB::table('chat_mensagens')->updateOrInsert(
                    ['sessao_id' => $sessao->id, 'role' => $role, 'conteudo' => $conteudo],
                    ['created_at' => now()->subMinutes(40 - ($indice * 8))],
                );
            }
        }
    }

    private function seedB2B(): void
    {
        $empresas = [
            ['Atlas Family Office', 'atlas-fo', 8, 18],
            ['Norte Asset Management', 'norte-asset', 12, 12],
            ['Cerrado Agro Trading', 'cerrado-agro', 6, -1],
        ];

        foreach ($empresas as [$nome, $subdominio, $maxUsuarios, $meses]) {
            $empresa = Empresa::query()->updateOrCreate(
                ['subdominio' => $subdominio],
                [
                    'nome' => $nome,
                    'logo_url' => null,
                    'ativo' => $meses > 0,
                    'max_usuarios' => $maxUsuarios,
                    'expira_em' => now()->addMonths($meses),
                ],
            );

            LicencaB2B::query()->updateOrCreate(
                ['empresa_id' => $empresa->id, 'tipo' => 'b2b'],
                [
                    'ativa' => $meses > 0,
                    'contratado_em' => now()->subMonths(12),
                    'expira_em' => now()->addMonths($meses),
                ],
            );

            $admin = User::query()->updateOrCreate(
                ['email' => 'admin@' . $subdominio . '.test'],
                [
                    'name' => 'Admin ' . $nome,
                    'email_verified_at' => now(),
                    'password' => 'password',
                ],
            );
            $admin->assignRole('company_admin');

            MembroB2B::query()->updateOrCreate(
                ['empresa_id' => $empresa->id, 'user_id' => $admin->id],
                [
                    'role_b2b' => 'company_admin',
                    'convite_token' => null,
                    'convite_email' => $admin->email,
                    'aceito_em' => now()->subMonths(6),
                ],
            );

            for ($i = 1; $i <= 2; $i++) {
                $leitor = User::query()->updateOrCreate(
                    ['email' => "analista{$i}@{$subdominio}.test"],
                    [
                        'name' => "Analista {$i} {$nome}",
                        'email_verified_at' => now(),
                        'password' => 'password',
                    ],
                );
                $leitor->assignRole('reader');

                MembroB2B::query()->updateOrCreate(
                    ['empresa_id' => $empresa->id, 'user_id' => $leitor->id],
                    [
                        'role_b2b' => 'reader',
                        'convite_token' => null,
                        'convite_email' => $leitor->email,
                        'aceito_em' => now()->subMonths(3)->subDays($i),
                    ],
                );
            }

            MembroB2B::query()->updateOrCreate(
                ['empresa_id' => $empresa->id, 'convite_email' => 'convite.pendente@' . $subdominio . '.test'],
                [
                    'user_id' => null,
                    'role_b2b' => 'reader',
                    'convite_token' => (string) Str::uuid(),
                    'aceito_em' => null,
                ],
            );
        }
    }

    private function seedWebhooks(array $usuarios): void
    {
        $eventos = [
            ['PURCHASE_APPROVED', 'essencial', true, null],
            ['SWITCH_PLAN', 'pro', true, null],
            ['PURCHASE_CANCELED', 'cancelado', true, null],
            ['PURCHASE_EXPIRED', 'expirado', true, null],
            ['PURCHASE_REFUNDED', 'reservado', false, 'Falha simulada: divergência entre código de assinante e e-mail recebido.'],
        ];

        foreach ($eventos as [$tipo, $chaveUsuario, $processado, $erro]) {
            $usuario = $usuarios[$chaveUsuario] ?? null;

            if (! $usuario) {
                continue;
            }

            $assinante = $usuario->assinante;

            WebhookEvento::query()->updateOrCreate(
                [
                    'event_type' => $tipo,
                    'email' => $usuario->email,
                    'hotmart_subscriber_code' => $assinante?->hotmart_subscriber_code,
                ],
                [
                    'payload' => [
                        'event' => $tipo,
                        'buyer' => ['email' => $usuario->email, 'name' => $usuario->name],
                        'subscription' => ['subscriber_code' => $assinante?->hotmart_subscriber_code],
                        'product' => ['name' => 'Geopolítica para Investidores ' . ucfirst((string) $assinante?->plano)],
                    ],
                    'processado' => $processado,
                    'processado_em' => $processado ? now()->subHours(rand(2, 72)) : null,
                    'erro' => $erro,
                ],
            );
        }
    }

    private function atualizarFontes(): void
    {
        Source::query()->update([
            'ultima_coleta_em' => now()->subMinutes(25),
        ]);
    }

    private function analiseEvento(string $regiao, string $label): string
    {
        return "Classificação {$label}: o evento em {$regiao} altera expectativas de fluxo, hedge e prêmio de risco. Monitorar impactos em câmbio, commodities e setores com exposição direta.";
    }

    private function nomeIndicador(string $simbolo): string
    {
        return match ($simbolo) {
            'BZ=F' => 'Petróleo Brent',
            'USDBRL=X' => 'Câmbio BRL/USD',
            'NG=F' => 'Gás Natural',
            'ZS=F' => 'Soja',
            'ZW=F' => 'Trigo',
            'TIO=F' => 'Minério de Ferro',
            default => $simbolo,
        };
    }

    private function corpoConteudo(string $titulo, string $resumo): string
    {
        return <<<HTML
<h2>{$titulo}</h2>
<p>{$resumo}</p>
<p>Este material consolida sinais de notícias, mercado e risco político para apoiar decisões de alocação. A leitura combina impacto provável em preços, canais de transmissão para o Brasil e gatilhos que devem ser monitorados nas próximas sessões.</p>
<ul>
    <li>Impacto primário: volatilidade em commodities, juros e moedas.</li>
    <li>Horizonte: curto prazo para preço, médio prazo para fundamentos.</li>
    <li>Ação sugerida: revisar exposição setorial e níveis de proteção.</li>
</ul>
HTML;
    }
}
