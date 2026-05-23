<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdicionarAddonRequest;
use App\Http\Requests\Admin\AtualizarAddonRequest;
use App\Jobs\ImportarAddonsJob;
use App\Models\Assinante;
use App\Models\AssinanteAddon;
use App\Models\Produto;
use App\Models\User;
use App\Services\AddonService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminAssinanteAddonController extends Controller
{
    public function __construct(private readonly AddonService $addonService) {}

    public function index(User $user): JsonResponse
    {
        $addons = AssinanteAddon::select('id', 'user_id', 'product_id', 'addon_key', 'status', 'iniciado_em', 'expira_em', 'created_at', 'updated_at')
            ->where('user_id', $user->id)
            ->orderByDesc('iniciado_em')
            ->get()
            ->map(fn (AssinanteAddon $a) => [
                'id'          => $a->id,
                'user_id'     => $a->user_id,
                'produto_id'  => $a->product_id,
                'chave'       => $a->addon_key,
                'status'      => $a->status,
                'data_inicio' => $a->iniciado_em?->toDateString(),
                'data_fim'    => $a->expira_em?->toDateString(),
                'created_at'  => $a->created_at?->toIso8601String(),
                'updated_at'  => $a->updated_at?->toIso8601String(),
            ]);

        return response()->json($addons);
    }

    public function store(AdicionarAddonRequest $request, User $user): JsonResponse
    {
        $dados = $request->validated();

        $addonKey   = $dados['produto_chave'];
        $iniciadoEm = $dados['data_inicio'] ?? null;
        $expiraEm   = $dados['data_fim'] ?? null;

        DB::transaction(function () use ($user, $dados, $addonKey, $iniciadoEm, $expiraEm) {
            if ($dados['status'] === 'ativo') {
                $this->addonService->ativar(
                    userId:    $user->id,
                    addonKey:  $addonKey,
                    fonte:     'manual',
                    orderId:   null,
                    productId: null,
                );

                if ($iniciadoEm || $expiraEm) {
                    AssinanteAddon::where('user_id', $user->id)
                        ->where('addon_key', $addonKey)
                        ->latest('id')
                        ->first()
                        ?->update([
                            'iniciado_em' => $iniciadoEm ?? now(),
                            'expira_em'   => $expiraEm,
                        ]);
                }
            } else {
                AssinanteAddon::create([
                    'user_id'     => $user->id,
                    'addon_key'   => $addonKey,
                    'status'      => $dados['status'],
                    'fonte'       => 'manual',
                    'iniciado_em' => $iniciadoEm ?? now(),
                    'expira_em'   => $expiraEm,
                ]);
            }
        });

        return response()->json(['message' => 'Addon adicionado com sucesso.'], 201);
    }

    public function update(AtualizarAddonRequest $request, User $user, AssinanteAddon $addon): JsonResponse
    {
        abort_if($addon->user_id !== $user->id, 404);

        $dados = $request->validated();

        DB::transaction(function () use ($user, $addon, $dados) {
            $statusAnterior = $addon->status;
            $novoStatus     = $dados['status'] ?? $statusAnterior;

            $addon->update($dados);

            // Sincronizar assinantes.addons[]
            if ($novoStatus === 'ativo' && $statusAnterior !== 'ativo') {
                $assinante    = $user->assinante;
                $addonsAtuais = $assinante->addons ?? [];
                if (! in_array($addon->addon_key, $addonsAtuais, true)) {
                    $addonsAtuais[] = $addon->addon_key;
                    $assinante->forceFill(['addons' => $addonsAtuais])->save();
                }
            } elseif ($novoStatus !== 'ativo' && $statusAnterior === 'ativo') {
                $this->addonService->cancelar($user->id, $addon->addon_key, $novoStatus);
                // Reverter status para o valor correto pois cancelar() define como o motivo
                $addon->update(['status' => $novoStatus]);
            }
        });

        return response()->json(['data' => $addon->fresh()]);
    }

    public function destroy(User $user, AssinanteAddon $addon): Response
    {
        abort_if($addon->user_id !== $user->id, 404);

        DB::transaction(function () use ($user, $addon) {
            if ($addon->status === 'ativo') {
                $this->addonService->cancelar($user->id, $addon->addon_key, 'cancelado');
            }
            $addon->delete();
        });

        return response()->noContent();
    }

    public function exportar(): StreamedResponse
    {
        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="addons_' . now()->format('Ymd_His') . '.csv"',
        ];

        $callback = function () {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF)); // UTF-8 BOM

            fputcsv($handle, ['email', 'nome', 'addon_key', 'status', 'fonte', 'iniciado_em', 'expira_em']);

            AssinanteAddon::with('user')
                ->orderBy('user_id')
                ->orderBy('addon_key')
                ->chunk(500, function ($addons) use ($handle) {
                    foreach ($addons as $addon) {
                        fputcsv($handle, [
                            $addon->user->email ?? '',
                            $addon->user->name ?? '',
                            $addon->addon_key,
                            $addon->status,
                            $addon->fonte,
                            $addon->iniciado_em?->toDateString() ?? '',
                            $addon->expira_em?->toDateString() ?? '',
                        ]);
                    }
                });

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function importar(Request $request): JsonResponse
    {
        $request->validate([
            'arquivo'      => ['required', 'file', 'mimes:csv,txt,xlsx,xls', 'max:5120'],
            'plano_padrao' => ['nullable', 'string', 'max:50'],
        ]);

        $arquivo     = $request->file('arquivo');
        $extensao    = strtolower($arquivo->getClientOriginalExtension());
        $planoPadrao = $request->input('plano_padrao') ?: null;
        $linhas      = $this->lerArquivo($arquivo->getRealPath(), $extensao);
        $linhas      = $this->normalizarLinhasHotmart($linhas);

        if (count($linhas) > 2000) {
            $jobId   = uniqid('import_addons_', true);
            $caminho = $arquivo->store('imports/addons', 'local');

            ImportarAddonsJob::dispatch($caminho, $extensao, $request->user()->id, $jobId, $planoPadrao);

            return response()->json([
                'mensagem' => 'Importação em andamento. Consulte o resultado em breve.',
                'job_id'   => $jobId,
            ]);
        }

        $produtos = Cache::remember('produtos_chaves', 3600, fn () => Produto::pluck('chave')->all());

        $emails           = array_unique(array_filter(array_map(fn ($l) => strtolower(trim($l['email'] ?? '')), $linhas)));
        $usuariosPorEmail = User::whereIn('email', $emails)->get()->keyBy(fn ($u) => strtolower($u->email));

        $importados = 0;
        $criados    = 0;
        $erros      = [];

        foreach ($linhas as $indice => $linha) {
            $numeroLinha = $indice + 2;

            try {
                $email    = strtolower(trim($linha['email'] ?? ''));
                $addonKey = trim($linha['addon_key'] ?? '');
                $status   = trim($linha['status'] ?? 'ativo');
                $fonte    = trim($linha['fonte'] ?? 'manual');
                $nome     = trim($linha['nome'] ?? '');

                if (empty($email) || empty($addonKey)) {
                    $erros[] = ['linha' => $numeroLinha, 'motivo' => 'email e addon_key são obrigatórios'];
                    continue;
                }

                if (! in_array($addonKey, $produtos, true)) {
                    $erros[] = ['linha' => $numeroLinha, 'motivo' => "addon_key '{$addonKey}' não existe nos produtos cadastrados"];
                    continue;
                }

                if (! in_array($status, ['ativo', 'cancelado', 'expirado', 'reembolsado'], true)) {
                    $erros[] = ['linha' => $numeroLinha, 'motivo' => "status '{$status}' inválido"];
                    continue;
                }

                if (! in_array($fonte, AssinanteAddon::FONTES, true)) {
                    $fonte = 'manual';
                }

                $iniciadoEm = ! empty($linha['iniciado_em']) ? $linha['iniciado_em'] : now()->toDateString();
                $expiraEm   = ! empty($linha['expira_em']) ? $linha['expira_em'] : null;

                $user = $usuariosPorEmail[$email] ?? null;

                if (! $user) {
                    if (! $planoPadrao) {
                        $erros[] = ['linha' => $numeroLinha, 'motivo' => "usuário '{$email}' não encontrado"];
                        continue;
                    }

                    $user = DB::transaction(function () use ($email, $nome, $planoPadrao, $addonKey, $status, $fonte, $iniciadoEm, $expiraEm) {
                        $nomeUsuario = $nome ?: Str::of($email)->before('@')->replace(['.', '_', '-'], ' ')->title()->value();

                        $novoUsuario = new User;
                        $novoUsuario->forceFill([
                            'email'              => $email,
                            'name'               => $nomeUsuario,
                            'password'           => '12345678',
                            'deve_alterar_senha' => true,
                        ])->save();

                        Assinante::create([
                            'user_id'     => $novoUsuario->id,
                            'plano'       => $planoPadrao,
                            'ativo'       => $status === 'ativo',
                            'status'      => $status,
                            'assinado_em' => $iniciadoEm,
                            'expira_em'   => $expiraEm,
                        ]);

                        AssinanteAddon::create([
                            'user_id'     => $novoUsuario->id,
                            'addon_key'   => $addonKey,
                            'status'      => $status,
                            'fonte'       => $fonte,
                            'iniciado_em' => $iniciadoEm,
                            'expira_em'   => $expiraEm,
                        ]);

                        return $novoUsuario;
                    });

                    $usuariosPorEmail[$email] = $user;
                    $criados++;
                    $importados++;
                    continue;
                }

                DB::transaction(function () use ($user, $addonKey, $status, $fonte, $iniciadoEm, $expiraEm) {
                    $addonExistente = AssinanteAddon::where('user_id', $user->id)
                        ->where('addon_key', $addonKey)
                        ->latest('id')
                        ->first();

                    if ($status === 'ativo') {
                        if ($addonExistente && $addonExistente->status === 'ativo') {
                            // Atualiza expira_em apenas se a nova data for maior
                            $novaExpiracao = $expiraEm ? Carbon::parse($expiraEm) : null;
                            if ($novaExpiracao && (! $addonExistente->expira_em || $novaExpiracao->gt($addonExistente->expira_em))) {
                                $addonExistente->update(['expira_em' => $expiraEm]);
                            }
                        } else {
                            $this->addonService->ativar($user->id, $addonKey, $fonte);
                            AssinanteAddon::where('user_id', $user->id)
                                ->where('addon_key', $addonKey)
                                ->latest('id')
                                ->first()
                                ?->update(['iniciado_em' => $iniciadoEm, 'expira_em' => $expiraEm]);
                        }
                    } else {
                        if ($addonExistente && $addonExistente->status === 'ativo') {
                            $this->addonService->cancelar($user->id, $addonKey, $status);
                        }
                        AssinanteAddon::updateOrCreate(
                            ['user_id' => $user->id, 'addon_key' => $addonKey, 'status' => $status],
                            ['fonte' => $fonte, 'iniciado_em' => $iniciadoEm, 'expira_em' => $expiraEm],
                        );
                    }
                });

                $importados++;
            } catch (\Throwable $e) {
                $erros[] = ['linha' => $numeroLinha, 'motivo' => $e->getMessage()];
            }
        }

        return response()->json([
            'importados' => $importados,
            'criados'    => $criados,
            'erros'      => $erros,
        ]);
    }

    private function normalizarLinhasHotmart(array $linhas): array
    {
        if (empty($linhas)) {
            return $linhas;
        }

        $chaves = array_keys($linhas[0]);

        if (! in_array('e-mail do membro', $chaves, true) && ! in_array('email do membro', $chaves, true)) {
            return $linhas;
        }

        $mapaAddon = [
            'monitor de guerra' => 'war',
            'war'               => 'war',
            'monitor eleitoral' => 'elections',
            'elections'         => 'elections',
        ];

        return array_map(function (array $linha) use ($mapaAddon): array {
            $email     = strtolower(trim((string) ($linha['e-mail do membro'] ?? $linha['email do membro'] ?? '')));
            $nome      = trim((string) ($linha['nome/razão social'] ?? $linha['nome/razao social'] ?? ''));
            $statusRaw = strtolower(trim((string) ($linha['status'] ?? 'ativo')));
            $produto   = strtolower(trim((string) ($linha['produto'] ?? '')));
            $expiraEm  = $this->parseDateValue($linha['data da expiração'] ?? $linha['data da expiracao'] ?? null);
            $inicioEm  = $this->parseDateValue($linha['início da liberação de acesso'] ?? $linha['inicio da liberacao de acesso'] ?? null);

            return [
                'email'       => $email,
                'nome'        => $nome,
                'addon_key'   => $mapaAddon[$produto] ?? '',
                'status'      => in_array($statusRaw, ['ativo', 'ativa', 'active'], true) ? 'ativo' : 'cancelado',
                'fonte'       => 'lastlink',
                'iniciado_em' => $inicioEm ?? now()->toDateString(),
                'expira_em'   => $expiraEm,
            ];
        }, $linhas);
    }

    private function parseDateValue(mixed $valor): ?string
    {
        if ($valor === null || $valor === '' || $valor === false) {
            return null;
        }

        if ($valor instanceof \DateTimeInterface) {
            return Carbon::instance($valor)->toDateString();
        }

        if (is_numeric($valor) && $valor > 40000) {
            try {
                $dt = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject((float) $valor);

                return Carbon::instance($dt)->toDateString();
            } catch (\Throwable) {
                return null;
            }
        }

        try {
            return Carbon::parse((string) $valor)->toDateString();
        } catch (\Throwable) {
            return null;
        }
    }

    private function lerArquivo(string $caminho, string $extensao): array
    {
        if (in_array($extensao, ['xlsx', 'xls'], true)) {
            $dados = Excel::toArray([], $caminho);
            $rows  = $dados[0] ?? [];

            if (empty($rows)) {
                return [];
            }

            $cabecalho = array_map('strtolower', array_map('trim', $rows[0]));
            $linhas    = [];

            for ($i = 1; $i < count($rows); $i++) {
                if (array_filter($rows[$i])) {
                    $linhas[] = array_combine($cabecalho, array_pad($rows[$i], count($cabecalho), ''));
                }
            }

            return $linhas;
        }

        // CSV
        $handle  = fopen($caminho, 'r');
        $cabecalho = null;
        $linhas    = [];

        while (($row = fgetcsv($handle)) !== false) {
            if ($cabecalho === null) {
                $cabecalho = array_map('strtolower', array_map('trim', $row));
                continue;
            }
            if (array_filter($row)) {
                $linhas[] = array_combine($cabecalho, array_pad($row, count($cabecalho), ''));
            }
        }

        fclose($handle);

        return $linhas;
    }
}
