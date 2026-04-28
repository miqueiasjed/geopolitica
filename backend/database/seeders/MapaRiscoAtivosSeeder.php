<?php

namespace Database\Seeders;

use App\Models\MapaRiscoAtivo;
use Illuminate\Database\Seeder;

class MapaRiscoAtivosSeeder extends Seeder
{
    public function run(): void
    {
        $ativos = [
            // --- B3 ---
            [
                'ticker'       => 'PETR4',
                'name'         => 'Petrobras PN',
                'asset_type'   => 'stock_br',
                'risk_weights' => json_encode(['energy' => 0.85, 'food' => 0.0, 'fx' => 0.35, 'military' => 0.20]),
                'regions'      => json_encode(['America do Sul', 'Global']),
            ],
            [
                'ticker'       => 'PETR3',
                'name'         => 'Petrobras ON',
                'asset_type'   => 'stock_br',
                'risk_weights' => json_encode(['energy' => 0.85, 'food' => 0.0, 'fx' => 0.35, 'military' => 0.20]),
                'regions'      => json_encode(['America do Sul', 'Global']),
            ],
            [
                'ticker'       => 'VALE3',
                'name'         => 'Vale ON',
                'asset_type'   => 'stock_br',
                'risk_weights' => json_encode(['energy' => 0.20, 'food' => 0.10, 'fx' => 0.50, 'military' => 0.30]),
                'regions'      => json_encode(['America do Sul', 'Global']),
            ],
            [
                'ticker'       => 'AGRO3',
                'name'         => 'BrasilAgro ON',
                'asset_type'   => 'stock_br',
                'risk_weights' => json_encode(['energy' => 0.0, 'food' => 0.90, 'fx' => 0.40, 'military' => 0.15]),
                'regions'      => json_encode(['America do Sul']),
            ],
            [
                'ticker'       => 'SLCE3',
                'name'         => 'SLC Agrícola ON',
                'asset_type'   => 'stock_br',
                'risk_weights' => json_encode(['energy' => 0.0, 'food' => 0.90, 'fx' => 0.40, 'military' => 0.10]),
                'regions'      => json_encode(['America do Sul']),
            ],
            [
                'ticker'       => 'SMTO3',
                'name'         => 'São Martinho ON',
                'asset_type'   => 'stock_br',
                'risk_weights' => json_encode(['energy' => 0.10, 'food' => 0.85, 'fx' => 0.35, 'military' => 0.05]),
                'regions'      => json_encode(['America do Sul']),
            ],
            [
                'ticker'       => 'EMBR3',
                'name'         => 'Embraer ON',
                'asset_type'   => 'stock_br',
                'risk_weights' => json_encode(['energy' => 0.10, 'food' => 0.0, 'fx' => 0.50, 'military' => 0.65]),
                'regions'      => json_encode(['America do Sul', 'Global']),
            ],
            [
                'ticker'       => 'WEGE3',
                'name'         => 'WEG ON',
                'asset_type'   => 'stock_br',
                'risk_weights' => json_encode(['energy' => 0.20, 'food' => 0.05, 'fx' => 0.45, 'military' => 0.25]),
                'regions'      => json_encode(['America do Sul', 'Global']),
            ],
            [
                'ticker'       => 'PRIO3',
                'name'         => 'PetroRio ON',
                'asset_type'   => 'stock_br',
                'risk_weights' => json_encode(['energy' => 0.90, 'food' => 0.0, 'fx' => 0.30, 'military' => 0.25]),
                'regions'      => json_encode(['America do Sul']),
            ],
            [
                'ticker'       => 'RECV3',
                'name'         => 'PetroReconcavo ON',
                'asset_type'   => 'stock_br',
                'risk_weights' => json_encode(['energy' => 0.85, 'food' => 0.0, 'fx' => 0.25, 'military' => 0.20]),
                'regions'      => json_encode(['America do Sul']),
            ],
            [
                'ticker'       => 'CSAN3',
                'name'         => 'Cosan ON',
                'asset_type'   => 'stock_br',
                'risk_weights' => json_encode(['energy' => 0.60, 'food' => 0.45, 'fx' => 0.35, 'military' => 0.10]),
                'regions'      => json_encode(['America do Sul']),
            ],
            [
                'ticker'       => 'RAIZ4',
                'name'         => 'Raízen PN',
                'asset_type'   => 'stock_br',
                'risk_weights' => json_encode(['energy' => 0.55, 'food' => 0.50, 'fx' => 0.35, 'military' => 0.10]),
                'regions'      => json_encode(['America do Sul']),
            ],
            [
                'ticker'       => 'SUZB3',
                'name'         => 'Suzano ON',
                'asset_type'   => 'stock_br',
                'risk_weights' => json_encode(['energy' => 0.10, 'food' => 0.70, 'fx' => 0.45, 'military' => 0.10]),
                'regions'      => json_encode(['America do Sul', 'Global']),
            ],
            [
                'ticker'       => 'KLBN4',
                'name'         => 'Klabin PN',
                'asset_type'   => 'stock_br',
                'risk_weights' => json_encode(['energy' => 0.10, 'food' => 0.60, 'fx' => 0.40, 'military' => 0.05]),
                'regions'      => json_encode(['America do Sul']),
            ],
            [
                'ticker'       => 'BRKM5',
                'name'         => 'Braskem PNA',
                'asset_type'   => 'stock_br',
                'risk_weights' => json_encode(['energy' => 0.70, 'food' => 0.15, 'fx' => 0.40, 'military' => 0.20]),
                'regions'      => json_encode(['America do Sul', 'Global']),
            ],
            [
                'ticker'       => 'UNIP6',
                'name'         => 'Unipar PNB',
                'asset_type'   => 'stock_br',
                'risk_weights' => json_encode(['energy' => 0.65, 'food' => 0.10, 'fx' => 0.35, 'military' => 0.15]),
                'regions'      => json_encode(['America do Sul']),
            ],
            [
                'ticker'       => 'GGBR4',
                'name'         => 'Gerdau PN',
                'asset_type'   => 'stock_br',
                'risk_weights' => json_encode(['energy' => 0.30, 'food' => 0.05, 'fx' => 0.50, 'military' => 0.45]),
                'regions'      => json_encode(['America do Sul', 'Global']),
            ],
            [
                'ticker'       => 'CSNA3',
                'name'         => 'CSN ON',
                'asset_type'   => 'stock_br',
                'risk_weights' => json_encode(['energy' => 0.25, 'food' => 0.05, 'fx' => 0.45, 'military' => 0.40]),
                'regions'      => json_encode(['America do Sul']),
            ],
            [
                'ticker'       => 'USIM5',
                'name'         => 'Usiminas PNA',
                'asset_type'   => 'stock_br',
                'risk_weights' => json_encode(['energy' => 0.25, 'food' => 0.05, 'fx' => 0.45, 'military' => 0.40]),
                'regions'      => json_encode(['America do Sul']),
            ],
            [
                'ticker'       => 'ALPA4',
                'name'         => 'Alpargatas PN',
                'asset_type'   => 'stock_br',
                'risk_weights' => json_encode(['energy' => 0.10, 'food' => 0.15, 'fx' => 0.55, 'military' => 0.10]),
                'regions'      => json_encode(['America do Sul', 'Global']),
            ],
            [
                'ticker'       => 'ITUB4',
                'name'         => 'Itaú Unibanco PN',
                'asset_type'   => 'stock_br',
                'risk_weights' => json_encode(['energy' => 0.05, 'food' => 0.05, 'fx' => 0.40, 'military' => 0.15]),
                'regions'      => json_encode(['America do Sul']),
            ],
            [
                'ticker'       => 'BBDC4',
                'name'         => 'Bradesco PN',
                'asset_type'   => 'stock_br',
                'risk_weights' => json_encode(['energy' => 0.05, 'food' => 0.05, 'fx' => 0.40, 'military' => 0.15]),
                'regions'      => json_encode(['America do Sul']),
            ],
            [
                'ticker'       => 'BBAS3',
                'name'         => 'Banco do Brasil ON',
                'asset_type'   => 'stock_br',
                'risk_weights' => json_encode(['energy' => 0.10, 'food' => 0.25, 'fx' => 0.40, 'military' => 0.15]),
                'regions'      => json_encode(['America do Sul']),
            ],
            [
                'ticker'       => 'SANB11',
                'name'         => 'Santander BR UNT',
                'asset_type'   => 'stock_br',
                'risk_weights' => json_encode(['energy' => 0.05, 'food' => 0.05, 'fx' => 0.45, 'military' => 0.10]),
                'regions'      => json_encode(['America do Sul', 'Europa']),
            ],
            [
                'ticker'       => 'LREN3',
                'name'         => 'Lojas Renner ON',
                'asset_type'   => 'stock_br',
                'risk_weights' => json_encode(['energy' => 0.05, 'food' => 0.10, 'fx' => 0.50, 'military' => 0.05]),
                'regions'      => json_encode(['America do Sul']),
            ],
            [
                'ticker'       => 'MGLU3',
                'name'         => 'Magazine Luiza ON',
                'asset_type'   => 'stock_br',
                'risk_weights' => json_encode(['energy' => 0.05, 'food' => 0.05, 'fx' => 0.55, 'military' => 0.05]),
                'regions'      => json_encode(['America do Sul']),
            ],
            [
                'ticker'       => 'MELI34',
                'name'         => 'Mercado Livre BDR',
                'asset_type'   => 'stock_br',
                'risk_weights' => json_encode(['energy' => 0.05, 'food' => 0.05, 'fx' => 0.70, 'military' => 0.15]),
                'regions'      => json_encode(['America do Sul', 'America do Norte']),
            ],
            [
                'ticker'       => 'AMZO34',
                'name'         => 'Amazon BDR',
                'asset_type'   => 'stock_br',
                'risk_weights' => json_encode(['energy' => 0.15, 'food' => 0.10, 'fx' => 0.65, 'military' => 0.20]),
                'regions'      => json_encode(['America do Norte', 'Global']),
            ],
            [
                'ticker'       => 'GOGL34',
                'name'         => 'Alphabet BDR',
                'asset_type'   => 'stock_br',
                'risk_weights' => json_encode(['energy' => 0.10, 'food' => 0.05, 'fx' => 0.60, 'military' => 0.25]),
                'regions'      => json_encode(['America do Norte', 'Global']),
            ],
            [
                'ticker'       => 'MSFT34',
                'name'         => 'Microsoft BDR',
                'asset_type'   => 'stock_br',
                'risk_weights' => json_encode(['energy' => 0.10, 'food' => 0.05, 'fx' => 0.55, 'military' => 0.30]),
                'regions'      => json_encode(['America do Norte', 'Global']),
            ],
            // --- Internacionais ---
            [
                'ticker'       => 'XOM',
                'name'         => 'ExxonMobil',
                'asset_type'   => 'stock_us',
                'risk_weights' => json_encode(['energy' => 0.90, 'food' => 0.0, 'fx' => 0.30, 'military' => 0.25]),
                'regions'      => json_encode(['America do Norte', 'Global']),
            ],
            [
                'ticker'       => 'CVX',
                'name'         => 'Chevron',
                'asset_type'   => 'stock_us',
                'risk_weights' => json_encode(['energy' => 0.85, 'food' => 0.0, 'fx' => 0.30, 'military' => 0.25]),
                'regions'      => json_encode(['America do Norte', 'Global']),
            ],
            [
                'ticker'       => 'SPY',
                'name'         => 'SPDR S&P 500 ETF',
                'asset_type'   => 'etf',
                'risk_weights' => json_encode(['energy' => 0.25, 'food' => 0.15, 'fx' => 0.40, 'military' => 0.20]),
                'regions'      => json_encode(['America do Norte']),
            ],
            [
                'ticker'       => 'GLD',
                'name'         => 'SPDR Gold Shares',
                'asset_type'   => 'etf',
                'risk_weights' => json_encode(['energy' => 0.10, 'food' => 0.05, 'fx' => 0.60, 'military' => 0.45]),
                'regions'      => json_encode(['Global']),
            ],
            [
                'ticker'       => 'SLV',
                'name'         => 'iShares Silver',
                'asset_type'   => 'etf',
                'risk_weights' => json_encode(['energy' => 0.15, 'food' => 0.05, 'fx' => 0.55, 'military' => 0.40]),
                'regions'      => json_encode(['Global']),
            ],
            [
                'ticker'       => 'USO',
                'name'         => 'United States Oil',
                'asset_type'   => 'etf',
                'risk_weights' => json_encode(['energy' => 0.95, 'food' => 0.0, 'fx' => 0.25, 'military' => 0.30]),
                'regions'      => json_encode(['Global']),
            ],
            [
                'ticker'       => 'DBA',
                'name'         => 'Invesco DB Agriculture',
                'asset_type'   => 'etf',
                'risk_weights' => json_encode(['energy' => 0.10, 'food' => 0.90, 'fx' => 0.35, 'military' => 0.15]),
                'regions'      => json_encode(['Global']),
            ],
            [
                'ticker'       => 'LMT',
                'name'         => 'Lockheed Martin',
                'asset_type'   => 'stock_us',
                'risk_weights' => json_encode(['energy' => 0.10, 'food' => 0.0, 'fx' => 0.40, 'military' => 0.90]),
                'regions'      => json_encode(['America do Norte', 'Global']),
            ],
            [
                'ticker'       => 'RTX',
                'name'         => 'RTX Corporation',
                'asset_type'   => 'stock_us',
                'risk_weights' => json_encode(['energy' => 0.10, 'food' => 0.0, 'fx' => 0.35, 'military' => 0.85]),
                'regions'      => json_encode(['America do Norte', 'Global']),
            ],
            [
                'ticker'       => 'MOO',
                'name'         => 'VanEck Agribusiness',
                'asset_type'   => 'etf',
                'risk_weights' => json_encode(['energy' => 0.10, 'food' => 0.85, 'fx' => 0.40, 'military' => 0.15]),
                'regions'      => json_encode(['Global']),
            ],
        ];

        MapaRiscoAtivo::upsert($ativos, ['ticker'], ['name', 'asset_type', 'risk_weights', 'regions']);
    }
}
