<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AtualizarEmpresaB2BRequest;
use App\Http\Requests\CriarEmpresaB2BRequest;
use App\Http\Requests\RenovarLicencaB2BRequest;
use App\Models\Empresa;
use App\Services\LicencaB2BService;
use App\Services\MembroB2BService;
use Illuminate\Http\JsonResponse;

class AdminB2BController extends Controller
{
    public function __construct(
        private readonly LicencaB2BService $licencaService,
        private readonly MembroB2BService $membroService,
    ) {}

    public function index(): JsonResponse
    {
        $empresas = Empresa::query()
            ->with('licenca')
            ->withCount('membros')
            ->orderBy('expira_em', 'asc')
            ->get()
            ->map(fn ($empresa) => [
                'id'            => $empresa->id,
                'nome'          => $empresa->nome,
                'subdominio'    => $empresa->subdominio,
                'ativo'         => $empresa->ativo,
                'expira_em'     => $empresa->expira_em,
                'membros_count' => $empresa->membros_count,
                'licenca'       => $empresa->licenca
                    ? ['tipo' => $empresa->licenca->tipo]
                    : null,
            ]);

        return response()->json(['data' => $empresas]);
    }

    public function store(CriarEmpresaB2BRequest $request): JsonResponse
    {
        $dados = $request->validated();

        $empresa = $this->licencaService->criarEmpresaComLicenca($dados);

        $this->membroService->convidar(
            $empresa,
            $dados['email_admin'],
            'company_admin',
        );

        return response()->json([
            'message' => 'Empresa criada e convite enviado ao administrador.',
            'empresa' => [
                'id'         => $empresa->id,
                'nome'       => $empresa->nome,
                'subdominio' => $empresa->subdominio,
                'expira_em'  => $empresa->expira_em,
            ],
        ], 201);
    }

    public function update(AtualizarEmpresaB2BRequest $request, int $id): JsonResponse
    {
        $empresa = Empresa::query()->findOrFail($id);

        $empresa->update($request->validated());

        return response()->json([
            'message' => 'Empresa atualizada com sucesso.',
            'empresa' => [
                'id'           => $empresa->id,
                'nome'         => $empresa->nome,
                'logo_url'     => $empresa->logo_url,
                'max_usuarios' => $empresa->max_usuarios,
                'ativo'        => $empresa->ativo,
                'expira_em'    => $empresa->expira_em,
            ],
        ]);
    }

    public function renovar(RenovarLicencaB2BRequest $request, int $id): JsonResponse
    {
        $empresa = Empresa::query()->findOrFail($id);

        $meses   = $request->validated('meses', 12);
        $licenca = $this->licencaService->renovarLicenca($empresa, (int) $meses);

        return response()->json([
            'message' => 'Licença renovada com sucesso.',
            'licenca' => [
                'id'        => $licenca->id,
                'tipo'      => $licenca->tipo,
                'ativa'     => $licenca->ativa,
                'expira_em' => $licenca->expira_em,
            ],
        ]);
    }
}
