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
            ['nome' => 'Reuters World', 'rss_url' => 'https://feeds.reuters.com/reuters/worldNews', 'categoria' => 'geopolitica'],
            ['nome' => 'Al Jazeera English', 'rss_url' => 'https://www.aljazeera.com/xml/rss/all.xml', 'categoria' => 'geopolitica'],
            ['nome' => 'BBC World', 'rss_url' => 'http://feeds.bbci.co.uk/news/world/rss.xml', 'categoria' => 'geopolitica'],
            ['nome' => 'Financial Times', 'rss_url' => 'https://www.ft.com/rss/home/uk', 'categoria' => 'economia'],
            ['nome' => 'Bloomberg Markets', 'rss_url' => 'https://feeds.bloomberg.com/markets/news.rss', 'categoria' => 'economia'],
            ['nome' => 'Foreign Policy', 'rss_url' => 'https://foreignpolicy.com/feed/', 'categoria' => 'geopolitica'],
            ['nome' => 'The Economist', 'rss_url' => 'https://www.economist.com/international/rss.xml', 'categoria' => 'economia'],
            ['nome' => 'CNBC World', 'rss_url' => 'https://www.cnbc.com/id/100727362/device/rss/rss.html', 'categoria' => 'economia'],
        ];
    }
}
