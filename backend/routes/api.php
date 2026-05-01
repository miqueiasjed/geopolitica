<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\SenhaController;
use App\Http\Controllers\AdminAssinanteController;
use App\Http\Controllers\AdminWebhookController;
use App\Http\Controllers\Api\Admin\AdminAiTestController;
use App\Http\Controllers\Api\Admin\AdminSuporteController;
use App\Http\Controllers\Api\Admin\AdminPlanoController;
use App\Http\Controllers\Api\Admin\AdminAiUsoController;
use App\Http\Controllers\Api\Admin\AdminB2BController;
use App\Http\Controllers\Api\Admin\AdminConfiguracaoController;
use App\Http\Controllers\Api\Admin\AdminConteudoController;
use App\Http\Controllers\Api\Admin\AdminUsuarioController;
use App\Http\Controllers\Api\Admin\AdminCriseHistoricaController;
use App\Http\Controllers\Api\Admin\AdminPerfilPaisController;
use App\Http\Controllers\Api\Admin\AdminSourceController;
use App\Http\Controllers\Api\Admin\EleicaoAdminController;
use App\Http\Controllers\Api\Admin\ImportarAssinantesController;
use App\Http\Controllers\Api\SuporteController;
use App\Http\Controllers\Api\CarteiraRiscoController;
use App\Http\Controllers\Api\EmpresaController;
use App\Http\Controllers\Api\ExportPdfController;
use App\Http\Controllers\Api\RelatorioIaController;
use App\Http\Controllers\Api\BibliotecaController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\ChatHistoricoController;
use App\Http\Controllers\Api\ConteudoController;
use App\Http\Controllers\Api\EleicaoController;
use App\Http\Controllers\Api\AlertaController;
use App\Http\Controllers\Api\IndicadoresController;
use App\Http\Controllers\Api\IndicadoresHistoricoController;
use App\Http\Controllers\Api\PaisController;
use App\Http\Controllers\Api\PaisUsuarioController;
use App\Http\Controllers\Api\TimelineController;
use App\Http\Controllers\Api\TimelineDetailController;
use App\Http\Controllers\Api\WarFeedController;
use App\Http\Controllers\FeedController;
use App\Http\Controllers\MapaIntensidadeController;
use App\Http\Controllers\PerfilController;
use App\Http\Controllers\RegiaoEventosController;
use App\Http\Controllers\WebhookHotmartController;
use App\Http\Controllers\WebhookLastlinkController;
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
        Route::post('/senha/alterar-inicial', [SenhaController::class, 'alterarInicial']);
    });
});

Route::middleware(['auth:sanctum', 'assinante.ativo'])->group(function () {
    Route::get('/feed', [FeedController::class, 'index']);
    Route::get('/feed/{id}', [FeedController::class, 'show']);
    Route::get('/perfil', [PerfilController::class, 'show']);
    Route::patch('/perfil', [PerfilController::class, 'update']);
    Route::post('/feed/atualizar', [FeedController::class, 'atualizar'])
        ->middleware('role:admin');
});

Route::middleware(['auth:sanctum', 'assinante.ativo', 'role:assinante_pro|assinante_reservado|admin'])->group(function () {
    Route::get('/biblioteca', [BibliotecaController::class, 'index']);
    Route::get('/biblioteca/{slug}', [ConteudoController::class, 'show']);
});

Route::middleware(['auth:sanctum', 'assinante.ativo'])->prefix('mapa')->group(function () {
    Route::get('/intensidade', [MapaIntensidadeController::class, 'index']);
    Route::get('/regiao-eventos', [RegiaoEventosController::class, 'index']);
});

Route::middleware(['auth:sanctum', 'assinante.ativo'])->group(function () {
    Route::get('/indicadores', [IndicadoresController::class, 'index']);
    Route::get('/indicadores/historico', [IndicadoresHistoricoController::class, 'index']);
});

Route::middleware(['auth:sanctum', 'assinante.ativo'])->group(function () {
    Route::get('/timeline', [TimelineController::class, 'index']);
    Route::get('/timeline/crise/{slug}', [TimelineDetailController::class, 'show']);
});

Route::middleware(['auth:sanctum', 'assinante.ativo'])->group(function () {
    Route::get('/alertas', [AlertaController::class, 'index']);
    Route::post('/alertas/{id}/lido', [AlertaController::class, 'marcarLido']);
});

Route::post('/webhook/hotmart', [WebhookHotmartController::class, 'receber']);
Route::post('/webhook/lastlink', [WebhookLastlinkController::class, 'receber']);

Route::middleware(['auth:sanctum', 'assinante.ativo'])->prefix('chat')->group(function () {
    Route::post('/perguntar', [ChatController::class, 'perguntar']);
    Route::get('/historico', [ChatHistoricoController::class, 'index']);
});

Route::middleware(['auth:sanctum', 'assinante.ativo'])->group(function () {
    Route::get('/paises', [PaisController::class, 'index']);
    Route::get('/paises/{codigo}', [PaisController::class, 'show']);
    Route::get('/paises/{codigo}/eventos', [PaisController::class, 'eventos']);

    Route::get('/meus-paises', [PaisUsuarioController::class, 'index']);
    Route::post('/meus-paises', [PaisUsuarioController::class, 'store']);
    Route::delete('/meus-paises/{codigo}', [PaisUsuarioController::class, 'destroy']);
});

Route::middleware(['auth:sanctum', 'assinante.ativo'])->group(function () {
    Route::get('/war-feed', [WarFeedController::class, 'index']);
});

Route::middleware(['auth:sanctum', 'assinante.ativo'])->group(function () {
    Route::post('/export-pdf', [ExportPdfController::class, 'exportar']);
});

Route::middleware(['auth:sanctum', 'assinante.ativo'])->group(function () {
    Route::post('/relatorios', [RelatorioIaController::class, 'gerar']);
    Route::get('/relatorios', [RelatorioIaController::class, 'historico']);
    Route::get('/relatorios/{id}', [RelatorioIaController::class, 'show']);
});

Route::middleware(['auth:sanctum', 'assinante.ativo'])->group(function () {
    Route::get('/eleicoes', [EleicaoController::class, 'index']);
    Route::get('/eleicoes/{id}', [EleicaoController::class, 'show']);
});

Route::middleware(['auth:sanctum', 'assinante.ativo', 'risk_score.acesso'])->group(function () {
    Route::get('/carteira',  [CarteiraRiscoController::class, 'buscar']);
    Route::post('/carteira', [CarteiraRiscoController::class, 'calcular']);
});

Route::middleware(['auth:sanctum', 'assinante.ativo'])->prefix('suporte')->group(function () {
    Route::get('/tickets', [SuporteController::class, 'index']);
    Route::post('/tickets', [SuporteController::class, 'store']);
    Route::get('/tickets/{id}', [SuporteController::class, 'show']);
    Route::post('/tickets/{id}/responder', [SuporteController::class, 'responder']);
});

Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/assinantes', [AdminAssinanteController::class, 'index']);
    Route::post('/assinantes/{id}/reenviar-boas-vindas', [AdminAssinanteController::class, 'reenviarBoasVindas']);
    Route::post('/assinantes/importar', [ImportarAssinantesController::class, 'store']);
    Route::get('/assinantes/importar/{id}/status', [ImportarAssinantesController::class, 'status']);
    Route::get('/webhook-eventos', [AdminWebhookController::class, 'index']);
    Route::delete('/webhook-eventos', [AdminWebhookController::class, 'destroyBulk']);

    Route::get('/conteudos', [AdminConteudoController::class, 'index']);
    Route::post('/conteudos', [AdminConteudoController::class, 'store']);
    Route::patch('/conteudos/{conteudo}', [AdminConteudoController::class, 'update']);
    Route::delete('/conteudos/{conteudo}', [AdminConteudoController::class, 'destroy']);

    Route::post('/eleicoes', [EleicaoAdminController::class, 'store']);
    Route::patch('/eleicoes/{id}', [EleicaoAdminController::class, 'update']);
    Route::delete('/eleicoes/{id}', [EleicaoAdminController::class, 'destroy']);

    // Configurações da plataforma
    Route::get('/configuracoes/defaults', [AdminConfiguracaoController::class, 'defaults']);
    Route::get('/configuracoes', [AdminConfiguracaoController::class, 'index']);
    Route::patch('/configuracoes', [AdminConfiguracaoController::class, 'update']);

    // Relatório de uso de IA
    Route::get('ai/uso', [AdminAiUsoController::class, 'index']);

    // Testes de prompt IA
    Route::post('ai/testar-prompt', [AdminAiTestController::class, 'testar'])
        ->middleware('throttle:20,1');

    // Gestão de usuários
    Route::get('/usuarios/roles', [AdminUsuarioController::class, 'roles']);
    Route::get('/usuarios', [AdminUsuarioController::class, 'index']);
    Route::post('/usuarios', [AdminUsuarioController::class, 'store']);
    Route::get('/usuarios/{usuario}', [AdminUsuarioController::class, 'show']);
    Route::patch('/usuarios/{usuario}', [AdminUsuarioController::class, 'update']);
    Route::delete('/usuarios/{usuario}', [AdminUsuarioController::class, 'destroy']);

    // Gestão de crises históricas (Linha do Tempo)
    Route::get('/crises', [AdminCriseHistoricaController::class, 'index']);
    Route::post('/crises', [AdminCriseHistoricaController::class, 'store']);
    Route::patch('/crises/{id}', [AdminCriseHistoricaController::class, 'update']);
    Route::delete('/crises/{id}', [AdminCriseHistoricaController::class, 'destroy']);

    // Gestão de países base (Meus Países)
    Route::get('/paises', [AdminPerfilPaisController::class, 'index']);
    Route::post('/paises', [AdminPerfilPaisController::class, 'store']);
    Route::patch('/paises/{codigo}', [AdminPerfilPaisController::class, 'update']);
    Route::delete('/paises/{codigo}', [AdminPerfilPaisController::class, 'destroy']);

    // Gestão de fontes RSS
    Route::get('/sources', [AdminSourceController::class, 'index']);
    Route::post('/sources', [AdminSourceController::class, 'store']);
    Route::patch('/sources/{source}', [AdminSourceController::class, 'update']);
    Route::delete('/sources/{source}', [AdminSourceController::class, 'destroy']);

    // Gestão de licenças B2B
    Route::get('/b2b/empresas', [AdminB2BController::class, 'index']);
    Route::post('/b2b/empresas', [AdminB2BController::class, 'store']);
    Route::patch('/b2b/empresas/{id}', [AdminB2BController::class, 'update']);
    Route::post('/b2b/empresas/{id}/renovar', [AdminB2BController::class, 'renovar']);

    // Suporte
    Route::get('/suporte/tickets', [AdminSuporteController::class, 'index']);
    Route::get('/suporte/tickets/nao-lidos', [AdminSuporteController::class, 'naoLidos']);
    Route::get('/suporte/tickets/{id}', [AdminSuporteController::class, 'show']);
    Route::post('/suporte/tickets/{id}/responder', [AdminSuporteController::class, 'responder']);
    Route::patch('/suporte/tickets/{id}/fechar', [AdminSuporteController::class, 'fechar']);

    // Gestão de planos e recursos
    Route::get('/planos', [AdminPlanoController::class, 'index']);
    Route::post('/planos', [AdminPlanoController::class, 'store']);
    Route::put('/planos/{plano}', [AdminPlanoController::class, 'update']);
    Route::put('/planos/{plano}/recursos/{chave}', [AdminPlanoController::class, 'atualizarRecurso']);
});

// Rota pública: informações do tenant atual
Route::get('/empresa/info', [EmpresaController::class, 'info'])
    ->middleware('identificar.tenant');

// Rota pública: aceite de convite B2B
Route::post('/convite/{token}/aceitar', [EmpresaController::class, 'aceitarConvite']);

// Rotas para company_admin gerenciar equipe (requer tenant middleware)
Route::middleware(['auth:sanctum', 'identificar.tenant', 'role:company_admin'])->group(function () {
    Route::get('/empresa/equipe', [EmpresaController::class, 'equipe']);
    Route::post('/empresa/convidar', [EmpresaController::class, 'convidar']);
    Route::delete('/empresa/membros/{membroId}', [EmpresaController::class, 'removerMembro']);
});
