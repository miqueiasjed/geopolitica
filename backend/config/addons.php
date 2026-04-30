<?php

return [
    'hotmart_products' => [
        env('HOTMART_PRODUCT_ELECTIONS') => 'elections',
        env('HOTMART_PRODUCT_WAR')       => 'war',
    ],
    'lastlink_products' => [
        env('LASTLINK_PRODUCT_ELECTIONS') => 'elections',
        env('LASTLINK_PRODUCT_WAR')       => 'war',
    ],
    // Offer codes = os códigos de checkout da Lastlink (ex: C110B44EE da URL /p/C110B44EE/)
    'lastlink_offers' => [
        env('LASTLINK_OFFER_ESSENCIAL')   => 'essencial',
        env('LASTLINK_OFFER_PRO')         => 'pro',
        env('LASTLINK_OFFER_RESERVADO')   => 'reservado',
        env('LASTLINK_OFFER_RESERVADO_2') => 'reservado', // oferta alternativa (ex: parcelado)
    ],
];
