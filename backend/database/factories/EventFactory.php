<?php

namespace Database\Factories;

use App\Models\Event;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Event>
 */
class EventFactory extends Factory
{
    protected $model = Event::class;

    public function definition(): array
    {
        $impactScore = fake()->numberBetween(1, 10);

        return [
            'titulo' => fake()->sentence(),
            'resumo' => fake()->paragraph(),
            'analise_ia' => fake()->paragraph(),
            'fonte' => fake()->company(),
            'fonte_url' => fake()->unique()->url(),
            'regiao' => fake()->randomElement(['Europa', 'Ásia', 'América Latina', 'Oriente Médio']),
            'impact_score' => $impactScore,
            'impact_label' => $this->impactLabel($impactScore),
            'categorias' => [fake()->randomElement(['energia', 'alimentos', 'cambio', 'conflitos', 'sancoes'])],
            'relevante' => true,
            'publicado_em' => now()->subHours(fake()->numberBetween(1, 72)),
        ];
    }

    public function relevante(): static
    {
        return $this->state(fn () => [
            'relevante' => true,
            'impact_score' => 6,
            'impact_label' => 'ALTO',
        ]);
    }

    public function critico(): static
    {
        return $this->state(fn () => [
            'impact_score' => 9,
            'impact_label' => 'CRÍTICO',
        ]);
    }

    public function ultimas48h(): static
    {
        return $this->state(fn () => [
            'publicado_em' => now()->subHours(6),
        ]);
    }

    private function impactLabel(int $impactScore): string
    {
        return match (true) {
            $impactScore >= 8 => 'CRÍTICO',
            $impactScore >= 6 => 'ALTO',
            $impactScore >= 4 => 'MÉDIO',
            default => 'MONITORAR',
        };
    }
}
