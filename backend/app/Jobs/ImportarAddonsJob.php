<?php

namespace App\Jobs;

use App\Models\Assinante;
use App\Models\AssinanteAddon;
use App\Models\Produto;
use App\Models\User;
use App\Services\AddonService;
use Carbon\Carbon;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;

class ImportarAddonsJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 300;

    public function __construct(
        private readonly string  $caminhoArquivo,
        private readonly string  $extensao,
        private readonly int     $adminUserId,
        private readonly string  $jobId,
        private readonly ?string $planoPadrao = null,
    ) {
        $this->onQueue('default');
    }

    public function handle(AddonService $addonService): void
    {
        $caminho  = Storage::path($this->caminhoArquivo);
        $linhas   = $this->lerArquivo($caminho, $this->extensao);
        $linhas   = $this->normalizarLinhasHotmart($linhas);
        $produtos = Produto::pluck('chave')->all();

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

                $user = User::where('email', $email)->first();

                if (! $user) {
                    if (! $this->planoPadrao) {
                        $erros[] = ['linha' => $numeroLinha, 'motivo' => "usuário '{$email}' não encontrado"];
                        continue;
                    }

                    $planoPadrao = $this->planoPadrao;
                    DB::transaction(function () use ($email, $nome, $planoPadrao, $addonKey, $status, $fonte, $iniciadoEm, $expiraEm) {
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
                    });

                    $criados++;
                    $importados++;
                    continue;
                }

                DB::transaction(function () use ($user, $addonKey, $status, $fonte, $iniciadoEm, $expiraEm, $addonService) {
                    $addonExistente = AssinanteAddon::where('user_id', $user->id)
                        ->where('addon_key', $addonKey)
                        ->latest('id')
                        ->first();

                    if ($status === 'ativo') {
                        if ($addonExistente && $addonExistente->status === 'ativo') {
                            $novaExpiracao = $expiraEm ? Carbon::parse($expiraEm) : null;
                            if ($novaExpiracao && (! $addonExistente->expira_em || $novaExpiracao->gt($addonExistente->expira_em))) {
                                $addonExistente->update(['expira_em' => $expiraEm]);
                            }
                        } else {
                            $addonService->ativar($user->id, $addonKey, $fonte);
                            AssinanteAddon::where('user_id', $user->id)
                                ->where('addon_key', $addonKey)
                                ->latest('id')
                                ->first()
                                ?->update(['iniciado_em' => $iniciadoEm, 'expira_em' => $expiraEm]);
                        }
                    } else {
                        if ($addonExistente && $addonExistente->status === 'ativo') {
                            $addonService->cancelar($user->id, $addonKey, $status);
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

        Cache::put("importar_addons:{$this->jobId}:resultado", [
            'importados' => $importados,
            'criados'    => $criados,
            'erros'      => $erros,
            'status'     => 'concluido',
        ], now()->addHours(2));

        Storage::delete($this->caminhoArquivo);
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
            $readerType = $extensao === 'xlsx' ? \Maatwebsite\Excel\Excel::XLSX : \Maatwebsite\Excel\Excel::XLS;
            $dados = Excel::toArray([], $caminho, null, $readerType);
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

        $handle    = fopen($caminho, 'r');
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
