<?php

return [
    // Offer codes = os códigos de checkout da Lastlink (ex: C110B44EE da URL /p/C110B44EE/)
    'lastlink_offers' => [
        env('LASTLINK_OFFER_ESSENCIAL')   => 'essencial',
        env('LASTLINK_OFFER_PRO')         => 'pro',
        env('LASTLINK_OFFER_RESERVADO')   => 'reservado',
        env('LASTLINK_OFFER_RESERVADO_2') => 'reservado',
    ],
];
