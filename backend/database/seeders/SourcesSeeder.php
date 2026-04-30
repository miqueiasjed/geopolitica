<?php

namespace Database\Seeders;

use App\Models\Source;
use Illuminate\Database\Seeder;

class SourcesSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->sources() as $source) {
            Source::query()->firstOrCreate(
                ['rss_url' => $source['rss_url']],
                $source,
            );
        }
    }

    private function sources(): array
    {
        return [
            // ── TIER A — Notícias (coleta a cada hora) ────────────────────────────

            // Agências internacionais
            ['nome' => 'Reuters World News',         'rss_url' => 'https://feeds.reuters.com/reuters/worldNews',                       'categoria' => 'geopolitica', 'tier' => 'A', 'ativo' => true],
            ['nome' => 'AP News World',              'rss_url' => 'https://rsshub.app/apnews/topics/world-news',                       'categoria' => 'geopolitica', 'tier' => 'A', 'ativo' => true],
            ['nome' => 'Al Jazeera English',         'rss_url' => 'https://www.aljazeera.com/xml/rss/all.xml',                         'categoria' => 'geopolitica', 'tier' => 'A', 'ativo' => true],
            ['nome' => 'BBC World',                  'rss_url' => 'https://feeds.bbci.co.uk/news/world/rss.xml',                       'categoria' => 'geopolitica', 'tier' => 'A', 'ativo' => true],
            ['nome' => 'France 24 English',          'rss_url' => 'https://www.france24.com/en/rss',                                   'categoria' => 'geopolitica', 'tier' => 'A', 'ativo' => true],
            ['nome' => 'DW World',                   'rss_url' => 'https://rss.dw.com/xml/rss-en-world',                               'categoria' => 'geopolitica', 'tier' => 'A', 'ativo' => true],
            ['nome' => 'The Guardian World',         'rss_url' => 'https://www.theguardian.com/world/rss',                             'categoria' => 'geopolitica', 'tier' => 'A', 'ativo' => true],

            // Geopolítica especializada (Tier A)
            ['nome' => 'Financial Times Geopolitics','rss_url' => 'https://www.ft.com/geopolitics?format=rss',                         'categoria' => 'geopolitica', 'tier' => 'A', 'ativo' => true],
            ['nome' => 'Geopolitical Monitor',       'rss_url' => 'https://www.geopoliticalmonitor.com/feed/',                         'categoria' => 'geopolitica', 'tier' => 'A', 'ativo' => true],
            ['nome' => 'World Politics Review',      'rss_url' => 'https://www.worldpoliticsreview.com/rss',                           'categoria' => 'geopolitica', 'tier' => 'A', 'ativo' => true],
            ['nome' => 'War on the Rocks',           'rss_url' => 'https://warontherocks.com/feed/',                                   'categoria' => 'defesa',      'tier' => 'A', 'ativo' => true],

            // Energia e commodities
            ['nome' => 'Reuters Energy',             'rss_url' => 'https://feeds.reuters.com/reuters/energy',                          'categoria' => 'mercados',    'tier' => 'A', 'ativo' => true],
            ['nome' => 'Reuters Commodities',        'rss_url' => 'https://feeds.reuters.com/reuters/globalcommoditiesNews',            'categoria' => 'mercados',    'tier' => 'A', 'ativo' => true],
            ['nome' => 'Oilprice.com',               'rss_url' => 'https://oilprice.com/rss/main',                                     'categoria' => 'mercados',    'tier' => 'A', 'ativo' => true],
            ['nome' => 'S&P Global Commodities',     'rss_url' => 'https://www.spglobal.com/commodityinsights/en/rss',                 'categoria' => 'mercados',    'tier' => 'A', 'ativo' => true],
            ['nome' => 'OPEC News',                  'rss_url' => 'https://www.opec.org/opec_web/en/press_room/rss.htm',               'categoria' => 'mercados',    'tier' => 'A', 'ativo' => true],

            // Economia e mercados (Tier A)
            ['nome' => 'Financial Times',            'rss_url' => 'https://www.ft.com/rss/home/uk',                                    'categoria' => 'economia',    'tier' => 'A', 'ativo' => true],
            ['nome' => 'Bloomberg Markets',          'rss_url' => 'https://feeds.bloomberg.com/markets/news.rss',                      'categoria' => 'economia',    'tier' => 'A', 'ativo' => true],
            ['nome' => 'CNBC World',                 'rss_url' => 'https://www.cnbc.com/id/100727362/device/rss/rss.html',             'categoria' => 'economia',    'tier' => 'A', 'ativo' => true],
            ['nome' => 'Reuters Business',           'rss_url' => 'https://feeds.reuters.com/reuters/businessNews',                    'categoria' => 'economia',    'tier' => 'A', 'ativo' => true],

            // América Latina e Brasil
            ['nome' => 'Reuters América Latina',     'rss_url' => 'https://feeds.reuters.com/reuters/latamBusinessNews',               'categoria' => 'economia',    'tier' => 'A', 'ativo' => true],
            ['nome' => 'Agência Brasil Economia',    'rss_url' => 'https://agenciabrasil.ebc.com.br/rss/economia/feed.xml',            'categoria' => 'economia',    'tier' => 'A', 'ativo' => true],
            ['nome' => 'Agência Brasil Internacional','rss_url' => 'https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml',    'categoria' => 'geopolitica', 'tier' => 'A', 'ativo' => true],
            ['nome' => 'Poder360 Internacional',     'rss_url' => 'https://poder360.com.br/feed/',                                     'categoria' => 'geopolitica', 'tier' => 'A', 'ativo' => true],

            // ── TIER B — Think tanks e análise (coleta 2× por dia: 6h e 18h BRT) ─

            // Geopolítica e política externa
            ['nome' => 'Foreign Affairs',            'rss_url' => 'https://www.foreignaffairs.com/rss.xml',                            'categoria' => 'geopolitica', 'tier' => 'B', 'ativo' => true],
            ['nome' => 'Foreign Policy',             'rss_url' => 'https://foreignpolicy.com/feed/',                                   'categoria' => 'geopolitica', 'tier' => 'B', 'ativo' => true],
            ['nome' => 'Council on Foreign Relations','rss_url' => 'https://www.cfr.org/rss.xml',                                      'categoria' => 'geopolitica', 'tier' => 'B', 'ativo' => true],
            ['nome' => 'Chatham House',              'rss_url' => 'https://www.chathamhouse.org/rss',                                   'categoria' => 'geopolitica', 'tier' => 'B', 'ativo' => true],
            ['nome' => 'Brookings Institution',      'rss_url' => 'https://www.brookings.edu/feed/',                                   'categoria' => 'geopolitica', 'tier' => 'B', 'ativo' => true],
            ['nome' => 'Atlantic Council',           'rss_url' => 'https://www.atlanticcouncil.org/feed/',                             'categoria' => 'geopolitica', 'tier' => 'B', 'ativo' => true],
            ['nome' => 'Carnegie Endowment',         'rss_url' => 'https://carnegieendowment.org/rss/solr?q=*',                        'categoria' => 'geopolitica', 'tier' => 'B', 'ativo' => true],
            ['nome' => 'Lowy Institute',             'rss_url' => 'https://www.lowyinstitute.org/the-interpreter/rss.xml',             'categoria' => 'geopolitica', 'tier' => 'B', 'ativo' => true],
            ['nome' => 'The Diplomat',               'rss_url' => 'https://thediplomat.com/feed/',                                     'categoria' => 'geopolitica', 'tier' => 'B', 'ativo' => true],
            ['nome' => 'Responsible Statecraft',     'rss_url' => 'https://responsiblestatecraft.org/feed/',                           'categoria' => 'geopolitica', 'tier' => 'B', 'ativo' => true],
            ['nome' => 'The Wire (Ásia)',             'rss_url' => 'https://thewire.in/external-affairs/feed',                          'categoria' => 'geopolitica', 'tier' => 'B', 'ativo' => true],
            ['nome' => 'Stratfor Worldview',         'rss_url' => 'https://worldview.stratfor.com/rss.xml',                            'categoria' => 'geopolitica', 'tier' => 'B', 'ativo' => true],
            ['nome' => 'The Economist',              'rss_url' => 'https://www.economist.com/international/rss.xml',                   'categoria' => 'economia',    'tier' => 'B', 'ativo' => true],

            // Defesa e segurança
            ['nome' => 'RAND Corporation',           'rss_url' => 'https://www.rand.org/pubs/rss/rss_feed.xml',                        'categoria' => 'defesa',      'tier' => 'B', 'ativo' => true],
            ['nome' => 'International Crisis Group', 'rss_url' => 'https://www.crisisgroup.org/rss.xml',                               'categoria' => 'defesa',      'tier' => 'B', 'ativo' => true],
            ['nome' => 'IISS',                       'rss_url' => 'https://www.iiss.org/rss',                                          'categoria' => 'defesa',      'tier' => 'B', 'ativo' => true],
            ['nome' => 'Stimson Center',             'rss_url' => 'https://www.stimson.org/feed/',                                     'categoria' => 'defesa',      'tier' => 'B', 'ativo' => true],
            ['nome' => 'Just Security',              'rss_url' => 'https://justsecurity.org/feed/',                                    'categoria' => 'defesa',      'tier' => 'B', 'ativo' => true],
            ['nome' => 'Defense One',                'rss_url' => 'https://www.defenseone.com/rss/all/',                               'categoria' => 'defesa',      'tier' => 'B', 'ativo' => true],
        ];
    }
}
