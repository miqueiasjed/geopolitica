<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();
        $middleware->redirectGuestsTo(null);
        $middleware->alias([
            'assinante.ativo' => \App\Http\Middleware\EnsureAssinanteAtivo::class,
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'cron.secret' => \App\Http\Middleware\CronSecretMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $deveResponderJson = fn (Request $request): bool => $request->is('api/*') || $request->expectsJson();

        $exceptions->render(function (AuthenticationException $exception, Request $request) use ($deveResponderJson) {
            if (! $deveResponderJson($request)) {
                return null;
            }

            return response()->json([
                'message' => 'Não autenticado.',
            ], 401);
        });

        $exceptions->render(function (AuthorizationException $exception, Request $request) use ($deveResponderJson) {
            if (! $deveResponderJson($request)) {
                return null;
            }

            return response()->json([
                'message' => 'Sem permissão.',
            ], 403);
        });

        $exceptions->render(function (NotFoundHttpException $exception, Request $request) use ($deveResponderJson) {
            if (! $deveResponderJson($request)) {
                return null;
            }

            return response()->json([
                'message' => 'Recurso não encontrado.',
            ], 404);
        });

        $exceptions->render(function (ValidationException $exception, Request $request) use ($deveResponderJson) {
            if (! $deveResponderJson($request)) {
                return null;
            }

            return response()->json([
                'message' => 'Os dados informados são inválidos.',
                'errors' => $exception->errors(),
            ], 422);
        });
    })->create();
