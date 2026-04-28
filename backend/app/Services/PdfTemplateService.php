<?php

namespace App\Services;

use App\Models\AlertaPreditivo;
use App\Models\Carteira;
use App\Models\ChatMensagem;
use App\Models\Conteudo;
use App\Models\Empresa;
use App\Models\PerfilPais;
use App\Models\RelatorioIa;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Auth\Access\AuthorizationException;

class PdfTemplateService
{
    /**
     * Gera o buffer binário do PDF para o tipo e identificador fornecidos.
     */
    public function gerar(string $tipo, string $id, ?string $companySlug, int $userId): string
    {
        $dados   = $this->buscarDados($tipo, $id, $userId);
        $logoB2B = $this->buscarLogoB2B($companySlug);
        $html    = $this->renderizarView($tipo, $dados, $logoB2B);

        return $this->gerarPdf($html);
    }

    /**
     * Busca e valida os dados conforme o tipo de exportação.
     */
    private function buscarDados(string $tipo, string $id, int $userId): array
    {
        return match ($tipo) {
            'briefing'   => $this->buscarBriefing($id),
            'alerta'     => $this->buscarAlerta($id),
            'pais'       => $this->buscarPais($id),
            'chat'       => $this->buscarChat($id, $userId),
            'report'     => $this->buscarRelatorio($id, $userId),
            'risk_score' => $this->buscarRiskScore($userId),
            default      => throw new \InvalidArgumentException("Tipo de exportação inválido: {$tipo}"),
        };
    }

    private function buscarBriefing(string $id): array
    {
        $conteudo = Conteudo::findOrFail($id);

        if (! $conteudo->publicado || $conteudo->publicado_em === null) {
            abort(403, 'Este briefing não está publicado.');
        }

        return ['conteudo' => $conteudo];
    }

    private function buscarAlerta(string $id): array
    {
        $alerta = AlertaPreditivo::findOrFail($id);

        return ['alerta' => $alerta];
    }

    private function buscarPais(string $id): array
    {
        $pais = PerfilPais::query()
            ->where('id', $id)
            ->orWhere('codigo_pais', $id)
            ->firstOrFail();

        return ['pais' => $pais];
    }

    private function buscarChat(string $id, int $userId): array
    {
        $mensagem = ChatMensagem::with('sessao')->findOrFail($id);

        if ($mensagem->sessao->user_id !== $userId) {
            throw new AuthorizationException('Acesso negado a esta mensagem de chat.');
        }

        return ['mensagem' => $mensagem];
    }

    private function buscarRelatorio(string $id, int $userId): array
    {
        $relatorio = RelatorioIa::where('id', $id)
            ->where('user_id', $userId)
            ->firstOrFail();

        return ['relatorio' => $relatorio];
    }

    private function buscarRiskScore(int $userId): array
    {
        $carteira = Carteira::where('user_id', $userId)->firstOrFail();

        $score = app(\App\Services\RiskScoreService::class)->calcularRiscoPortfolio(
            $carteira->ativos ?? []
        );

        return ['carteira' => array_merge($carteira->toArray(), ['ultimo_score' => $score])];
    }

    /**
     * Busca a URL do logo da empresa B2B pelo slug (subdomínio).
     */
    private function buscarLogoB2B(?string $companySlug): ?string
    {
        if ($companySlug === null) {
            return null;
        }

        $empresa = Empresa::query()
            ->where('subdominio', $companySlug)
            ->first();

        return $empresa?->logo_url ?? null;
    }

    /**
     * Renderiza a view Blade do PDF para o tipo informado.
     */
    private function renderizarView(string $tipo, array $dados, ?string $logoB2B): string
    {
        return view("pdf.{$tipo}", array_merge($dados, ['companyLogo' => $logoB2B]))->render();
    }

    /**
     * Converte HTML em buffer binário de PDF via DomPDF.
     */
    private function gerarPdf(string $html): string
    {
        return Pdf::loadHTML($html)->output();
    }
}
