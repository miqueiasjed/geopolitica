<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('automacoes', function (Blueprint $table) {
            $table->id();
            $table->string('chave')->unique();
            $table->string('grupo')->index();
            $table->string('label');
            $table->text('descricao')->nullable();
            $table->boolean('ativa')->default(true);
            $table->timestamps();
        });

        $agora = now();

        DB::table('automacoes')->insert(array_map(
            fn (array $a) => array_merge($a, ['ativa' => true, 'created_at' => $agora, 'updated_at' => $agora]),
            [
                [
                    'chave'     => 'feed_noticias',
                    'grupo'     => 'conteudo',
                    'label'     => 'Geração de notícias (Feed)',
                    'descricao' => 'Coleta de RSS, análise por IA e geração de editoriais. Tier A de hora em hora; Tier B duas vezes ao dia.',
                ],
                [
                    'chave'     => 'telegram',
                    'grupo'     => 'conteudo',
                    'label'     => 'Publicação no Telegram',
                    'descricao' => 'Envio automático dos eventos para os canais do Telegram (Feed e Monitor de Guerra).',
                ],
                [
                    'chave'     => 'deteccao_sinais',
                    'grupo'     => 'inteligencia',
                    'label'     => 'Detecção de sinais',
                    'descricao' => 'Identificação de sinais preditivos via IA, de hora em hora.',
                ],
                [
                    'chave'     => 'analise_convergencia',
                    'grupo'     => 'inteligencia',
                    'label'     => 'Análise de convergência',
                    'descricao' => 'Análise de convergência de sinais por região via IA, de hora em hora.',
                ],
                [
                    'chave'     => 'gdelt',
                    'grupo'     => 'dados',
                    'label'     => 'Intensidade GDELT (mapa)',
                    'descricao' => 'Atualização dos dados de intensidade por país do mapa de risco, de hora em hora.',
                ],
                [
                    'chave'     => 'indicadores',
                    'grupo'     => 'dados',
                    'label'     => 'Indicadores de mercado',
                    'descricao' => 'Atualização das cotações de commodities e câmbio, a cada minuto.',
                ],
                [
                    'chave'     => 'perfis_paises',
                    'grupo'     => 'dados',
                    'label'     => 'Perfis de países',
                    'descricao' => 'Geração semanal de perfis de países via IA.',
                ],
            ]
        ));
    }

    public function down(): void
    {
        Schema::dropIfExists('automacoes');
    }
};
