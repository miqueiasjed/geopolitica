<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('ADMIN_EMAIL', 'admin@geopolitica.test');
        $senha = env('ADMIN_PASSWORD', 'password');

        $usuario = User::query()->firstOrCreate(
            ['email' => $email],
            [
                'name' => 'Administrador',
                'password' => $senha,
            ],
        );

        $usuario->forceFill([
            'name' => 'Administrador',
            'password' => $senha,
        ])->save();

        if (!$usuario->hasRole('admin')) {
            $usuario->assignRole('admin');
        }
    }
}