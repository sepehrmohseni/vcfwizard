<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    use HasFactory, HasUlids, Notifiable, TwoFactorAuthenticatable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'stripe_customer_id',
        'subscription_status',
        'contacts_processed_this_month',
        'current_period_started_at',
    ];

    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
        'stripe_customer_id',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'contacts_processed_this_month' => 'integer',
            'current_period_started_at' => 'datetime',
        ];
    }

    public function imports(): HasMany
    {
        return $this->hasMany(Import::class);
    }

    public function exports(): HasMany
    {
        return $this->hasMany(Export::class);
    }

    public function mappingTemplates(): HasMany
    {
        return $this->hasMany(MappingTemplate::class);
    }

    public function isPro(): bool
    {
        return $this->subscription_status === 'pro';
    }

    public function isFreePlan(): bool
    {
        return $this->subscription_status === 'free';
    }

    public function getContactLimitAttribute(): int
    {
        return $this->isPro() ? PHP_INT_MAX : 2000;
    }
}
