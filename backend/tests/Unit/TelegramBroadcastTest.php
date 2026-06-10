<?php

namespace Tests\Unit;

use App\Jobs\EnviarTelegramJob;
use App\Models\Event;
use App\Services\FeedUpdaterService;
use App\Services\TelegramService;
use App\Support\TelegramMessageFormatter;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class TelegramBroadcastTest extends TestCase
{
    private function publicar(Event $evento): void
    {
        $service = app(FeedUpdaterService::class);
        $metodo = new \ReflectionMethod($service, 'publicarNoTelegram');
        $metodo->setAccessible(true);
        $metodo->invoke($service, $evento);
    }

    public function test_evento_comum_vai_apenas_para_o_canal_feed(): void
    {
        Queue::fake();

        $this->publicar(new Event([
            'titulo'       => 'Acordo comercial',
            'impact_label' => 'CRÍTICO',
            'categorias'   => ['cambio'],
        ]));

        Queue::assertPushed(EnviarTelegramJob::class, fn ($job) => $job->canal === 'feed');
        Queue::assertPushed(EnviarTelegramJob::class, 1);
    }

    public function test_evento_de_guerra_vai_apenas_para_o_canal_war(): void
    {
        Queue::fake();

        $this->publicar(new Event([
            'titulo'       => 'Ataque na fronteira',
            'impact_label' => 'MÉDIO',
            'categorias'   => ['conflitos'],
        ]));

        Queue::assertPushed(EnviarTelegramJob::class, fn ($job) => $job->canal === 'war');
        Queue::assertPushed(EnviarTelegramJob::class, 1);
    }

    public function test_evento_com_categoria_conflitos_pertence_ao_monitor_de_guerra(): void
    {
        $evento = new Event(['categorias' => ['conflitos', 'energia'], 'impact_label' => 'MÉDIO']);

        $this->assertTrue($evento->pertenceAoMonitorGuerra());
    }

    public function test_evento_militar_legado_pertence_ao_monitor_de_guerra(): void
    {
        $evento = new Event(['categorias' => ['military'], 'impact_label' => 'MÉDIO']);

        $this->assertTrue($evento->pertenceAoMonitorGuerra());
    }

    public function test_evento_critico_sem_categoria_de_guerra_nao_pertence_ao_monitor(): void
    {
        $evento = new Event(['categorias' => ['cambio'], 'impact_label' => 'CRÍTICO']);

        $this->assertFalse($evento->pertenceAoMonitorGuerra());
    }

    public function test_evento_comum_nao_pertence_ao_monitor_de_guerra(): void
    {
        $evento = new Event(['categorias' => ['economia'], 'impact_label' => 'MONITORAR']);

        $this->assertFalse($evento->pertenceAoMonitorGuerra());
    }

    public function test_formatter_usa_headline_legenda_e_escapa_html(): void
    {
        $evento = new Event([
            'titulo'       => 'Titulo bruto',
            'headline'     => 'Tensão sobe no <Golfo>',
            'legenda'      => 'Movimentos militares & alertas',
            'regiao'       => 'Oriente Médio',
            'impact_label' => 'ALTO',
            'fonte'        => 'Reuters',
            'fonte_url'    => 'https://example.com/a?b=1&c=2',
            'categorias'   => ['military'],
        ]);

        $texto = TelegramMessageFormatter::paraEvento($evento);

        $this->assertStringContainsString('⚔️', $texto);
        $this->assertStringContainsString('<b>Tensão sobe no &lt;Golfo&gt;</b>', $texto);
        $this->assertStringContainsString('Movimentos militares &amp; alertas', $texto);
        $this->assertStringContainsString('📍 Oriente Médio', $texto);
        $this->assertStringContainsString('Impacto: ALTO', $texto);
        $this->assertStringContainsString('<a href="https://example.com/a?b=1&amp;c=2">Reuters</a>', $texto);
    }

    public function test_formatter_usa_emoji_de_feed_para_evento_comum(): void
    {
        $evento = new Event([
            'titulo'       => 'Acordo comercial',
            'analise_ia'   => 'Resumo da análise',
            'impact_label' => 'MONITORAR',
            'categorias'   => ['economia'],
        ]);

        $texto = TelegramMessageFormatter::paraEvento($evento);

        $this->assertStringContainsString('🌐', $texto);
        $this->assertStringContainsString('Resumo da análise', $texto);
    }

    public function test_envio_ignorado_quando_token_ausente(): void
    {
        Http::fake();
        Config::set('services.telegram.bot_token', null);
        Config::set('services.telegram.channels.feed', '@canal');

        $enviado = app(TelegramService::class)->enviarParaCanal('feed', 'Olá');

        $this->assertFalse($enviado);
        Http::assertNothingSent();
    }

    public function test_envio_chama_a_bot_api_quando_configurado(): void
    {
        Http::fake([
            'api.telegram.org/*' => Http::response(['ok' => true, 'result' => []], 200),
        ]);
        Config::set('services.telegram.bot_token', 'token-teste');
        Config::set('services.telegram.channels.war', '-1009999');

        $enviado = app(TelegramService::class)->enviarParaCanal('war', '<b>Oi</b>');

        $this->assertTrue($enviado);
        Http::assertSent(function ($request) {
            return str_contains($request->url(), '/bottoken-teste/sendMessage')
                && $request['chat_id'] === '-1009999'
                && $request['parse_mode'] === 'HTML'
                && $request['text'] === '<b>Oi</b>';
        });
    }

    public function test_envia_para_apenas_um_canal_quando_solicitado(): void
    {
        Http::fake([
            'api.telegram.org/*' => Http::response(['ok' => true, 'result' => []], 200),
        ]);
        Config::set('services.telegram.bot_token', 'token-teste');
        Config::set('services.telegram.channels.feed', '@feed');
        Config::set('services.telegram.channels.war', '@war');

        app(TelegramService::class)->enviarParaCanal('elections', 'Oi');

        Http::assertNothingSent(); // canal elections sem chat_id configurado
    }
}
