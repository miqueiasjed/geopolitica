<?php

namespace App\Jobs;

use App\Models\AssinanteAddon;
use App\Models\Produto;
use App\Models\User;
use App\Services\AddonService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;

class ImportarAddonsJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 300;

    public function __construct(
        private readonly string $caminhoArquivo,
        private readonly string $extensao,
        private readonly int    $adminUserId,
        private readonly string $jobId,
    ) {
        $this->onQueue('default');
    }

    public function handle(AddonService $addonService): void
    {
        $caminho  = Storage::path($this->caminhoArquivo);
        $linhas   = $this->lerArquivo($caminho, $this->extensao);
        $produtos = Produto::pluck('chave')->all();

        $importados = 0;
        $erros      = [];

        foreach ($linhas as $indice => $linha) {
            $numeroLinha = $indice + 2;

            try {
                $email    = trim($linha['email'] ?? '');
                $addonKey = trim($linha['addon_key'] ?? '');
                $status   = trim($linha['status'] ?? 'ativo');
                $fonte    = trim($linha['fonte'] ?? 'manual');

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

                $user = User::where('email', $email)->first();

                if (! $user) {
                    $erros[] = ['linha' => $numeroLinha, 'motivo' => "usuário '{$email}' não encontrado"];
                    continue;
                }

                $iniciadoEm = ! empty($linha['iniciado_em']) ? $linha['iniciado_em'] : now()->toDateString();
                $expiraEm   = ! empty($linha['expira_em']) ? $linha['expira_em'] : null;

                DB::transaction(function () use ($user, $addonKey, $status, $fonte, $iniciadoEm, $expiraEm, $addonService) {
                    if ($status === 'ativo') {
                        $addonService->ativar($user->id, $addonKey, $fonte);
                        AssinanteAddon::where('user_id', $user->id)
                            ->where('addon_key', $addonKey)
                            ->latest('id')
                            ->first()
                            ?->update(['iniciado_em' => $iniciadoEm, 'expira_em' => $expiraEm]);
                    } else {
                        if ($user->assinante && $user->assinante->temAddon($addonKey)) {
                            $addonService->cancelar($user->id, $addonKey, $status);
                        }
                        AssinanteAddon::create([
                            'user_id'     => $user->id,
                            'addon_key'   => $addonKey,
                            'status'      => $status,
                            'fonte'       => $fonte,
                            'iniciado_em' => $iniciadoEm,
                            'expira_em'   => $expiraEm,
                        ]);
                    }
                });

                $importados++;
            } catch (\Throwable $e) {
                $erros[] = ['linha' => $numeroLinha, 'motivo' => $e->getMessage()];
            }
        }

        Cache::put("importar_addons:{$this->jobId}:resultado", [
            'importados' => $importados,
            'erros'      => $erros,
            'status'     => 'concluido',
        ], now()->addHours(2));

        Storage::delete($this->caminhoArquivo);
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
