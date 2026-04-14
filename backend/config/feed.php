<?php

return [
    'sources' => [],
    'refresh_interval_minutes' => (int) env('FEED_REFRESH_INTERVAL', 30),
    'max_items_per_source' => (int) env('FEED_MAX_ITEMS', 50),
];
