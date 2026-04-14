<?php

return [
    'api_key' => env('CLAUDE_API_KEY'),
    'model' => env('CLAUDE_MODEL', 'claude-sonnet-4-5'),
    'max_tokens' => (int) env('CLAUDE_MAX_TOKENS', 1024),
];
