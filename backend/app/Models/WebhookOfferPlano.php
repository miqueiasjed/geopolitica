<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebhookOfferPlano extends Model
{
    protected $table = 'webhook_offer_planos';

    protected $fillable = [
        'fonte',
        'offer_id',
        'descricao',
        'plano',
    ];
}
