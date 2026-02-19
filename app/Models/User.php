<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Cashier\Billable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    use Billable, HasFactory, HasUlids, Notifiable, TwoFactorAuthenticatable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'ai_rows_used',
        'ai_usage_reset_at',
    ];

    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
        'stripe_id',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'ai_rows_used' => 'integer',
            'ai_usage_reset_at' => 'datetime',
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

    public function integrations(): HasMany
    {
        return $this->hasMany(Integration::class);
    }

    public function webhooks(): HasMany
    {
        return $this->hasMany(Webhook::class);
    }

    public function apiKeys(): HasMany
    {
        return $this->hasMany(ApiKey::class);
    }

    public function isPro(): bool
    {
        return $this->subscribed('pro');
    }

    public function isFreePlan(): bool
    {
        return ! $this->isPro();
    }

    public function getContactLimitAttribute(): int
    {
        return $this->isPro() ? PHP_INT_MAX : 2000;
    }

    public function getAiRowsLimitAttribute(): int
    {
        return $this->isPro() ? 50000 : 0;
    }

    public function canUseAi(): bool
    {
        return $this->isPro() && $this->ai_rows_used < $this->ai_rows_limit;
    }

    public function incrementAiUsage(int $rows): void
    {
        $this->increment('ai_rows_used', $rows);
    }

    public function resetAiUsageIfNeeded(): void
    {
        if (! $this->ai_usage_reset_at || $this->ai_usage_reset_at->isPast()) {
            $this->update([
                'ai_rows_used' => 0,
                'ai_usage_reset_at' => now()->addMonth(),
            ]);
        }
    }
}
