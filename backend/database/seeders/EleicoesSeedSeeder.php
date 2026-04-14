<?php

namespace Database\Seeders;

use App\Models\Eleicao;
use Illuminate\Database\Seeder;

class EleicoesSeedSeeder extends Seeder
{
    public function run(): void
    {
        $eleicoes = [
            [
                'pais'                  => 'Venezuela',
                'codigo_pais'           => 'VE',
                'data_eleicao'          => '2026-01-10',
                'tipo_eleicao'          => 'Parlamentar',
                'relevancia'            => 'alta',
                'contexto_geopolitico'  => 'A Assembleia Nacional venezuelana enfrenta eleições em meio a uma crise econômica prolongada e pressões internacionais sobre o regime de Nicolás Maduro. A oposição tenta reorganizar suas forças após as polêmicas eleições presidenciais de 2024, nas quais Maduro foi reeleito contestando resultados denunciados por organismos internacionais. O controle do Legislativo é estratégico para qualquer perspectiva de transição política.',
                'impacto_brasil'        => 'O resultado influencia diretamente o fluxo migratório venezuelano para o Brasil, que já recebeu mais de 500 mil refugiados. Uma eventual abertura política pode reduzir a pressão migratória e abrir oportunidades comerciais.',
                'candidatos_principais' => [
                    ['nome' => 'María Corina Machado', 'partido' => 'Plataforma Unitária Democrática'],
                    ['nome' => 'Diosdado Cabello', 'partido' => 'PSUV'],
                ],
                'content_slug'          => null,
            ],
            [
                'pais'                  => 'Alemanha',
                'codigo_pais'           => 'DE',
                'data_eleicao'          => '2026-02-23',
                'tipo_eleicao'          => 'Parlamentar',
                'relevancia'            => 'alta',
                'contexto_geopolitico'  => 'As eleições federais alemãs ocorrem após o colapso da coalizão do governo de Olaf Scholz, num contexto de crescimento da extrema-direita representada pelo AfD. A Alemanha enfrenta desafios econômicos com a desindustrialização, crise energética pós-Ucrânia e debate sobre migração. A formação do novo governo definirá o papel da Alemanha na OTAN e no suporte à Ucrânia.',
                'impacto_brasil'        => 'A Alemanha é um dos principais parceiros comerciais do Brasil e um dos maiores investidores no país. Uma virada para posições mais protecionistas ou a diminuição do apoio ao acordo Mercosul-UE pode impactar negativamente as exportações brasileiras.',
                'candidatos_principais' => [
                    ['nome' => 'Friedrich Merz', 'partido' => 'CDU/CSU'],
                    ['nome' => 'Alice Weidel', 'partido' => 'AfD'],
                ],
                'content_slug'          => null,
            ],
            [
                'pais'                  => 'Irã',
                'codigo_pais'           => 'IR',
                'data_eleicao'          => '2026-02-28',
                'tipo_eleicao'          => 'Parlamentar',
                'relevancia'            => 'alta',
                'contexto_geopolitico'  => 'O Parlamento iraniano (Majlis) passa por eleições num momento de intensa pressão internacional sobre o programa nuclear do país e tensões crescentes no Oriente Médio após os conflitos de 2024. O Conselho Guardião continua vetando candidatos reformistas, limitando o pluralismo político. O resultado influenciará a postura iraniana nas negociações nucleares com o Ocidente.',
                'impacto_brasil'        => 'O Brasil importa petróleo iraniano em períodos de sanções relaxadas e mantém relações diplomáticas autônomas com Teerã. Mudanças no Parlamento podem afetar a capacidade brasileira de intermediar diálogos na região.',
                'candidatos_principais' => [],
                'content_slug'          => null,
            ],
            [
                'pais'                  => 'Colômbia',
                'codigo_pais'           => 'CO',
                'data_eleicao'          => '2026-03-08',
                'tipo_eleicao'          => 'Legislativa',
                'relevancia'            => 'media',
                'contexto_geopolitico'  => 'As eleições legislativas colombianas ocorrem durante o governo de Gustavo Petro, o primeiro presidente de esquerda do país, que enfrenta tensões com o Congresso sobre reformas sociais e a política de "paz total" com grupos armados. O equilíbrio de forças no Parlamento determinará a viabilidade das reformas da saúde, pensão e trabalho propostas pelo governo.',
                'impacto_brasil'        => 'Colômbia e Brasil compartilham a maior fronteira amazônica da América do Sul. A estabilidade política colombiana é essencial para o controle do tráfico de drogas, do desmatamento transfronteiriço e da cooperação em segurança regional.',
                'candidatos_principais' => [],
                'content_slug'          => null,
            ],
            [
                'pais'                  => 'França',
                'codigo_pais'           => 'FR',
                'data_eleicao'          => '2026-04-12',
                'tipo_eleicao'          => 'Presidencial',
                'relevancia'            => 'alta',
                'contexto_geopolitico'  => 'A eleição presidencial francesa ocorre com Emmanuel Macron impedido de concorrer a um terceiro mandato consecutivo, abrindo espaço para uma disputa acirrada entre a esquerda unida, o centro macronista e a extrema-direita de Marine Le Pen e Jordan Bardella. A França enfrenta debates intensos sobre segurança, imigração, custo de vida e seu papel na defesa europeia diante do conflito na Ucrânia.',
                'impacto_brasil'        => 'A França é membro permanente do Conselho de Segurança da ONU e parceira estratégica do Brasil em fóruns multilaterais. Uma vitória da extrema-direita poderia tensionar relações diplomáticas, especialmente em pautas ambientais e de direitos humanos.',
                'candidatos_principais' => [
                    ['nome' => 'Marine Le Pen', 'partido' => 'Rassemblement National'],
                    ['nome' => 'Jean-Luc Mélenchon', 'partido' => 'La France Insoumise'],
                ],
                'content_slug'          => null,
            ],
            [
                'pais'                  => 'Índia',
                'codigo_pais'           => 'IN',
                'data_eleicao'          => '2026-04-05',
                'tipo_eleicao'          => 'Estaduais (3 estados)',
                'relevancia'            => 'media',
                'contexto_geopolitico'  => 'As eleições estaduais em três importantes estados indianos servem como termômetro político para o partido BJP de Narendra Modi, que busca consolidar sua hegemonia política antes das próximas eleições gerais. Os estados em disputa possuem relevância econômica e demográfica significativa, com debates sobre desenvolvimento, emprego e identidade religiosa dominando a campanha.',
                'impacto_brasil'        => 'A Índia é parceira do Brasil no BRICS e rival no mercado global de commodities agrícolas. O fortalecimento ou enfraquecimento do governo Modi afeta as posições indianas em negociações comerciais que impactam o agronegócio brasileiro.',
                'candidatos_principais' => [],
                'content_slug'          => null,
            ],
            [
                'pais'                  => 'Itália',
                'codigo_pais'           => 'IT',
                'data_eleicao'          => '2026-05-15',
                'tipo_eleicao'          => 'Regional',
                'relevancia'            => 'baixa',
                'contexto_geopolitico'  => 'Eleições regionais em diversas regiões italianas testam a popularidade do governo de Giorgia Meloni e dos Fratelli d\'Italia. As disputas regionais são influenciadas por questões locais como gestão de resíduos, saúde e autonomia fiscal, mas também refletem as tensões nacionais em torno de imigração e relações com a União Europeia.',
                'impacto_brasil'        => 'O resultado tem impacto indireto, podendo sinalizar a estabilidade do governo italiano e sua postura em negociações do acordo Mercosul-UE, da qual a Itália é parte como membro da União Europeia.',
                'candidatos_principais' => [],
                'content_slug'          => null,
            ],
            [
                'pais'                  => 'México',
                'codigo_pais'           => 'MX',
                'data_eleicao'          => '2026-06-07',
                'tipo_eleicao'          => 'Legislativa',
                'relevancia'            => 'media',
                'contexto_geopolitico'  => 'As eleições de meio de mandato no México ocorrem sob o governo de Claudia Sheinbaum, primeira mulher a presidir o país e sucessora de Andrés Manuel López Obrador. A renovação do Congresso determinará a capacidade do governo de avançar reformas estruturais e manter o controle político conquistado pela Morena nas eleições de 2024.',
                'impacto_brasil'        => 'México e Brasil são as duas maiores economias da América Latina e competem por investimentos estrangeiros diretos. A estabilidade política mexicana influencia o ambiente de negócios regional e o poder de barganha latino-americano em fóruns internacionais.',
                'candidatos_principais' => [],
                'content_slug'          => null,
            ],
            [
                'pais'                  => 'Coreia do Sul',
                'codigo_pais'           => 'KR',
                'data_eleicao'          => '2026-06-03',
                'tipo_eleicao'          => 'Municipais',
                'relevancia'            => 'baixa',
                'contexto_geopolitico'  => 'As eleições municipais sul-coreanas ocorrem num período de instabilidade política após o impeachment do presidente Yoon Suk-yeol em 2024. A disputa por prefeituras e governos provinciais serve como teste de popularidade para os principais partidos antes das próximas eleições legislativas. As relações com a Coreia do Norte e os vínculos com os EUA permanecem temas centrais.',
                'impacto_brasil'        => 'A Coreia do Sul é parceira tecnológica e comercial relevante para o Brasil, especialmente nos setores de eletrônicos e automotivo. A estabilidade política interna afeta o ritmo de investimentos sul-coreanos no país.',
                'candidatos_principais' => [],
                'content_slug'          => null,
            ],
            [
                'pais'                  => 'Turquia',
                'codigo_pais'           => 'TR',
                'data_eleicao'          => '2026-06-14',
                'tipo_eleicao'          => 'Municipal (parcial)',
                'relevancia'            => 'baixa',
                'contexto_geopolitico'  => 'Eleições municipais complementares na Turquia ocorrem em contexto de pressão econômica com inflação elevada e questionamentos sobre a consolidação do poder de Erdoğan. A oposição busca manter os avanços conquistados nas eleições municipais de 2024, quando venceu em Istambul e Ancara. Os resultados podem sinalizar o humor do eleitorado turco para futuras disputas nacionais.',
                'impacto_brasil'        => 'A Turquia é uma potência regional emergente com interesses no mesmo segmento de mercados que o Brasil, como defesa, agronegócio e construção civil. Mudanças na política interna turca têm impacto indireto sobre parcerias bilaterais.',
                'candidatos_principais' => [],
                'content_slug'          => null,
            ],
            [
                'pais'                  => 'Japão',
                'codigo_pais'           => 'JP',
                'data_eleicao'          => '2026-07-26',
                'tipo_eleicao'          => 'Câmara dos Conselheiros',
                'relevancia'            => 'media',
                'contexto_geopolitico'  => 'A eleição para a Câmara Alta japonesa (Sangiin) ocorre num momento em que o Partido Liberal Democrata busca recuperar terreno após perdas eleitorais recentes. O Japão enfrenta debates sobre revisão constitucional para ampliar capacidades militares, política de imigração para combater o declínio demográfico e gestão das relações com China e Coreia do Norte.',
                'impacto_brasil'        => 'O Japão é historicamente um dos maiores investidores no Brasil e a comunidade nipo-brasileira é a maior fora do Japão. Mudanças na política econômica japonesa afetam investimentos diretos no Brasil e as relações comerciais bilaterais.',
                'candidatos_principais' => [],
                'content_slug'          => null,
            ],
            [
                'pais'                  => 'Nigéria',
                'codigo_pais'           => 'NG',
                'data_eleicao'          => '2026-08-09',
                'tipo_eleicao'          => 'Governadores',
                'relevancia'            => 'baixa',
                'contexto_geopolitico'  => 'As eleições para governadores estaduais na Nigéria acontecem em meio a crises de segurança no norte do país causadas pelo Boko Haram e pelo ISWAP, além de instabilidade econômica derivada das reformas do presidente Bola Tinubu. A Nigéria é o país mais populoso da África e maior economia do continente, tornando sua estabilidade crucial para a região.',
                'impacto_brasil'        => 'A Nigéria é um mercado emergente com crescente intercâmbio comercial com o Brasil, especialmente em agronegócio e manufaturas. A estabilidade política nigeriana afeta a segurança das rotas comerciais no Atlântico Sul.',
                'candidatos_principais' => [],
                'content_slug'          => null,
            ],
            [
                'pais'                  => 'Brasil',
                'codigo_pais'           => 'BR',
                'data_eleicao'          => '2026-10-04',
                'tipo_eleicao'          => 'Presidencial + Legislativa',
                'relevancia'            => 'alta',
                'contexto_geopolitico'  => 'O Brasil realiza eleições gerais com disputa presidencial, para governadores, senadores e deputados federais e estaduais. A eleição de 2026 será marcada pela possível reeleição de Luiz Inácio Lula da Silva e pela consolidação ou fragmentação do atual bloco governista. O debate econômico, fiscal e sobre soberania da Amazônia deverão dominar a agenda política.',
                'impacto_brasil'        => 'Eleição de impacto direto e central para o cenário interno. O resultado define a orientação da política econômica, das relações externas e dos investimentos públicos nos próximos quatro anos.',
                'candidatos_principais' => [
                    ['nome' => 'Luiz Inácio Lula da Silva', 'partido' => 'PT'],
                    ['nome' => 'Jair Bolsonaro (ou substituto)', 'partido' => 'PL'],
                ],
                'content_slug'          => null,
            ],
            [
                'pais'                  => 'Argentina',
                'codigo_pais'           => 'AR',
                'data_eleicao'          => '2026-10-25',
                'tipo_eleicao'          => 'Legislativa (Meio mandato)',
                'relevancia'            => 'media',
                'contexto_geopolitico'  => 'As eleições legislativas de meio de mandato na Argentina são um referendo sobre o governo libertário de Javier Milei, que implementou medidas drásticas de ajuste fiscal e desregulamentação econômica. A composição do Congresso após as eleições determinará a capacidade do governo de avançar reformas estruturais ou enfrentar bloqueios parlamentares.',
                'impacto_brasil'        => 'Argentina é o segundo maior parceiro comercial do Brasil e membro do Mercosul. A trajetória política argentina afeta diretamente o bloco regional, as negociações comerciais conjuntas e a estabilidade econômica da região.',
                'candidatos_principais' => [
                    ['nome' => 'Javier Milei', 'partido' => 'La Libertad Avanza'],
                    ['nome' => 'Cristina Kirchner', 'partido' => 'Unión por la Patria'],
                ],
                'content_slug'          => null,
            ],
            [
                'pais'                  => 'Chile',
                'codigo_pais'           => 'CL',
                'data_eleicao'          => '2026-11-22',
                'tipo_eleicao'          => 'Presidencial',
                'relevancia'            => 'media',
                'contexto_geopolitico'  => 'O Chile elege um novo presidente após o fim do mandato de Gabriel Boric, num contexto de polarização política crescente e debates sobre a nova Constituição, segurança pública e a gestão do cobre e do lítio como recursos estratégicos. O país enfrenta pressões para definir seu modelo de desenvolvimento frente à transição energética global.',
                'impacto_brasil'        => 'Chile e Brasil são parceiros estratégicos no Cone Sul e no quadro da CELAC. A eleição chilena pode influenciar o bloco progressista latino-americano e as negociações em torno de cadeias de valor do lítio, metal crítico para baterias e tecnologia verde.',
                'candidatos_principais' => [],
                'content_slug'          => null,
            ],
        ];

        foreach ($eleicoes as $dados) {
            Eleicao::updateOrCreate(
                [
                    'pais'         => $dados['pais'],
                    'data_eleicao' => $dados['data_eleicao'],
                ],
                $dados
            );
        }
    }
}
