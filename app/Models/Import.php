<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Import extends Model
{
    use HasFactory, HasUlids, SoftDeletes;

    protected $fillable = [
        'user_id',
        'original_filename',
        'file_path',
        'file_type',
        'file_size',
        'row_count',
        'column_headers',
        'mapped_fields',
        'ai_suggestions',
        'status',
        'duplicates_found',
        'duplicate_details',
        'error_message',
        'processed_at',
    ];

    protected function casts(): array
    {
        return [
            'column_headers' => 'array',
            'mapped_fields' => 'array',
            'ai_suggestions' => 'array',
            'duplicate_details' => 'array',
            'row_count' => 'integer',
            'file_size' => 'integer',
            'duplicates_found' => 'integer',
            'processed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(ImportContact::class);
    }

    public function export(): HasOne
    {
        return $this->hasOne(Export::class);
    }

    public function isGuest(): bool
    {
        return $this->user_id === null;
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isProcessing(): bool
    {
        return $this->status === 'processing';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    public function markAsProcessing(): void
    {
        $this->update(['status' => 'processing']);
    }

    public function markAsCompleted(): void
    {
        $this->update([
            'status' => 'completed',
            'processed_at' => now(),
        ]);
    }

    public function markAsFailed(string $message): void
    {
        $this->update([
            'status' => 'failed',
            'error_message' => $message,
        ]);
    }
}
