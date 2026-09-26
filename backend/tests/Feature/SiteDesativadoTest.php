<?php

namespace Tests\Feature;

use Tests\TestCase;

class SiteDesativadoTest extends TestCase
{
    public function test_site_ativo_responde_normalmente(): void
    {
        config(['app.site_desativado' => false]);

        $this->getJson('/api/status-site')
            ->assertOk()
            ->assertJson(['site_desativado' => false]);
    }

    public function test_site_desativado_bloqueia_api_webhooks_e_web(): void
    {
        config(['app.site_desativado' => true]);

        $this->getJson('/api/status-site')
            ->assertStatus(503)
            ->assertJson(['site_desativado' => true]);

        $this->postJson('/api/auth/login', ['email' => 'a@a.com', 'password' => 'x'])
            ->assertStatus(503);

        $this->postJson('/api/webhooks/hotmart')->assertStatus(503);

        $this->get('/')->assertStatus(503)->assertSee('Site desativado');
    }
}
