<?php

namespace App\Console\Commands;

use App\Models\WebhookEvento;
use Illuminate\Console\Command;

class LimparWebhooksIrrelevantes extends Command
{
    protected $signature = 'webhooks:limpar-irrelevantes {--dry-run : Mostra quantos seriam excluídos sem apagar}';

    protected $description = 'Remove eventos de webhook cujos tipos não são processados pelo sistema';

    private const ACEITOS_HOTMART = [
        'PURCHASE_APPROVED',
        'PURCHASE_COMPLETE',
        'PURCHASE_CANCELED',
        'PURCHASE_REFUNDED',
        'PURCHASE_CHARGEBACK',
        'PURCHASE_EXPIRED',
        'SWITCH_PLAN',
    ];

    private const IGNORADOS_LASTLINK = [
        'LASTLINK_REFUND_REQUESTED',
        'LASTLINK_REFUND_PERIOD_OVER',
        'LASTLINK_SUBSCRIPTION_RENEWAL_PENDING',
        'LASTLINK_PURCHASE_REQUEST_EXPIRED',
        'LASTLINK_PURCHASE_REQUEST_CANCELED',
        'LASTLINK_PURCHASE_REQUEST_CONFIRMED',
        'LASTLINK_ABANDONED_CART',
        'LASTLINK_PURCHASE_EXPIRED',
    ];

    public function handle(): int
    {
        $query = WebhookEvento::where(function ($q) {
            $q->where('fonte', 'hotmart')
              ->whereNotIn('event_type', self::ACEITOS_HOTMART);
        })->orWhere(function ($q) {
            $q->where('fonte', 'lastlink')
              ->whereIn('event_type', self::IGNORADOS_LASTLINK);
        });

        $total = $query->count();

        if ($total === 0) {
            $this->info('Nenhum registro irrelevante encontrado.');
            return self::SUCCESS;
        }

        if ($this->option('dry-run')) {
            $this->info("Dry-run: {$total} registro(s) seriam excluídos.");
            return self::SUCCESS;
        }

        $excluidos = $query->delete();

        $this->info("Excluídos: {$excluidos} registro(s) de webhook irrelevantes.");

        return self::SUCCESS;
    }
}
