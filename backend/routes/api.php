<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\SenhaController;
use App\Http\Controllers\AdminAssinanteController;
use App\Http\Controllers\AdminWebhookController;
use App\Http\Controllers\Api\Admin\AdminConteudoController;
use App\Http\Controllers\Api\BibliotecaController;
use App\Http\Controllers\Api\ConteudoController;
use App\Http\Controllers\FeedController;
use App\Http\Controllers\MapaIntensidadeController;
use App\Http\Controllers\PerfilController;
use App\Http\Controllers\RegiaoEventosController;
use App\Http\Controllers\WebhookHotmartController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::prefix('senha')->group(function () {
        Route::post('/esqueci', [SenhaController::class, 'esqueci']);
        Route::post('/redefinir', [SenhaController::class, 'redefinir']);
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

Route::middleware(['auth:sanctum', 'assinante.ativo'])->group(function () {
    Route::get('/feed', [FeedController::class, 'index']);
    Route::get('/perfil', [PerfilController::class, 'show']);
    Route::patch('/perfil', [PerfilController::class, 'update']);
    Route::post('/feed/atualizar', [FeedController::class, 'atualizar'])
        ->middleware('role:admin');
});

Route::middleware(['auth:sanctum', 'assinante.ativo'])->group(function () {
    Route::get('/biblioteca', [BibliotecaController::class, 'index']);
    Route::get('/biblioteca/{slug}', [ConteudoController::class, 'show']);
});

Route::middleware(['auth:sanctum', 'assinante.ativo'])->prefix('mapa')->group(function () {
    Route::get('/intensidade', [MapaIntensidadeController::class, 'index']);
    Route::get('/regiao-eventos', [RegiaoEventosController::class, 'index']);
});

Route::post('/webhook/hotmart', [WebhookHotmartController::class, 'receber']);

Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/assinantes', [AdminAssinanteController::class, 'index']);
    Route::get('/webhook-eventos', [AdminWebhookController::class, 'index']);

    Route::get('/conteudos', [AdminConteudoController::class, 'index']);
    Route::post('/conteudos', [AdminConteudoController::class, 'store']);
    Route::patch('/conteudos/{conteudo}', [AdminConteudoController::class, 'update']);
    Route::delete('/conteudos/{conteudo}', [AdminConteudoController::class, 'destroy']);
});
