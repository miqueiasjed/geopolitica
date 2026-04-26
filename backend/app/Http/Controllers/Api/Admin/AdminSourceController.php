<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Source;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSourceController extends Controller
{
    public function index(): JsonResponse
    {
        $sources = Source::orderBy('categoria')->orderBy('nome')->get();

        return response()->json(['data' => $sources]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nome'      => ['required', 'string', 'max:255'],
            'rss_url'   => ['required', 'url', 'max:500', 'unique:sources,rss_url'],
            'categoria' => ['required', 'in:geopolitica,economia,defesa,mercados'],
            'ativo'     => ['boolean'],
        ]);

        $source = Source::create($validated);

        return response()->json(['data' => $source], 201);
    }

    public function update(Request $request, Source $source): JsonResponse
    {
        $validated = $request->validate([
            'nome'      => ['sometimes', 'string', 'max:255'],
            'rss_url'   => ['sometimes', 'url', 'max:500', 'unique:sources,rss_url,' . $source->id],
            'categoria' => ['sometimes', 'in:geopolitica,economia,defesa,mercados'],
            'ativo'     => ['sometimes', 'boolean'],
        ]);

        $source->update($validated);

        return response()->json(['data' => $source->fresh()]);
    }

    public function destroy(Source $source): JsonResponse
    {
        $source->delete();

        return response()->json(null, 204);
    }
}
