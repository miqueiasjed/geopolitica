<?php

namespace Tests\Feature;

use Tests\TestCase;

class ManualPageTest extends TestCase
{
    public function test_manual_page_is_available(): void
    {
        $this->get('/manual')
            ->assertOk()
            ->assertSee('Manual do Assinante', false);
    }
}
