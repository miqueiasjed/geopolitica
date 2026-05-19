# T1 – Migration: adicionar product_id_lastlink e product_id_hotmart na tabela produtos

## Objetivo
Criar migration que adiciona duas novas colunas nullable string à tabela `produtos`.

## Arquivo a criar
`backend/database/migrations/2026_05_18_000002_add_product_ids_to_produtos_table.php`

## Conteúdo da migration
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('produtos', function (Blueprint $table) {
            $table->string('product_id_lastlink')->nullable()->unique()->after('chave');
            $table->string('product_id_hotmart')->nullable()->unique()->after('product_id_lastlink');
        });
    }

    public function down(): void
    {
        Schema::table('produtos', function (Blueprint $table) {
            $table->dropColumn(['product_id_lastlink', 'product_id_hotmart']);
        });
    }
};
```

## Verificação
- Arquivo criado em `backend/database/migrations/`
- Nome do arquivo com timestamp correto (ex: 2026_05_18_000002_...)
