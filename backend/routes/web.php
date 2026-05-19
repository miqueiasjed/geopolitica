<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/manual', function () {
    return response(file_get_contents(base_path('../manual-assinante.html')), 200, [
        'Content-Type' => 'text/html; charset=UTF-8',
    ]);
});
