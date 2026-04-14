<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesB2BSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        Role::firstOrCreate(['name' => 'company_admin', 'guard_name' => 'sanctum']);
        Role::firstOrCreate(['name' => 'reader', 'guard_name' => 'sanctum']);
    }
}
