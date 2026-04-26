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
            // Geopolítica internacional
            ['nome' => 'Reuters World News',    'rss_url' => 'https://feeds.reuters.com/reuters/worldNews',                     'categoria' => 'geopolitica', 'ativo' => true],
            ['nome' => 'Al Jazeera English',    'rss_url' => 'https://www.aljazeera.com/xml/rss/all.xml',                       'categoria' => 'geopolitica', 'ativo' => true],
            ['nome' => 'BBC World',             'rss_url' => 'https://feeds.bbci.co.uk/news/world/rss.xml',                     'categoria' => 'geopolitica', 'ativo' => true],
            ['nome' => 'Foreign Policy',        'rss_url' => 'https://foreignpolicy.com/feed/',                                 'categoria' => 'geopolitica', 'ativo' => true],
            ['nome' => 'Council on Foreign Relations', 'rss_url' => 'https://www.cfr.org/rss.xml',                             'categoria' => 'geopolitica', 'ativo' => true],
            ['nome' => 'AP News World',         'rss_url' => 'https://rsshub.app/apnews/topics/world-news',                    'categoria' => 'geopolitica', 'ativo' => true],
            ['nome' => 'DW World',              'rss_url' => 'https://rss.dw.com/xml/rss-en-world',                            'categoria' => 'geopolitica', 'ativo' => true],
            ['nome' => 'The Guardian World',    'rss_url' => 'https://www.theguardian.com/world/rss',                          'categoria' => 'geopolitica', 'ativo' => true],
            ['nome' => 'Stratfor Worldview',    'rss_url' => 'https://worldview.stratfor.com/rss.xml',                         'categoria' => 'geopolitica', 'ativo' => true],
            // Economia e mercados
            ['nome' => 'Financial Times',       'rss_url' => 'https://www.ft.com/rss/home/uk',                                 'categoria' => 'economia',    'ativo' => true],
            ['nome' => 'Bloomberg Markets',     'rss_url' => 'https://feeds.bloomberg.com/markets/news.rss',                   'categoria' => 'economia',    'ativo' => true],
            ['nome' => 'The Economist',         'rss_url' => 'https://www.economist.com/international/rss.xml',                'categoria' => 'economia',    'ativo' => true],
            ['nome' => 'CNBC World',            'rss_url' => 'https://www.cnbc.com/id/100727362/device/rss/rss.html',          'categoria' => 'economia',    'ativo' => true],
            ['nome' => 'Reuters Business',      'rss_url' => 'https://feeds.reuters.com/reuters/businessNews',                 'categoria' => 'economia',    'ativo' => true],
            ['nome' => 'Agência Brasil Economia','rss_url' => 'https://agenciabrasil.ebc.com.br/rss/economia/feed.xml',        'categoria' => 'economia',    'ativo' => true],
        ];
    }
}
