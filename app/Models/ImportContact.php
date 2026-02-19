<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ImportContact extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'import_id',
        'raw_row',
        'normalized_data',
        'vcard_text',
        'is_duplicate',
        'duplicate_of',
    ];

    protected function casts(): array
    {
        return [
            'raw_row' => 'array',
            'normalized_data' => 'array',
            'is_duplicate' => 'boolean',
        ];
    }

    public function import(): BelongsTo
    {
        return $this->belongsTo(Import::class);
    }

    public function duplicateSource(): BelongsTo
    {
        return $this->belongsTo(self::class, 'duplicate_of');
    }
}
