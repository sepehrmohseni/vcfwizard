<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('import_contacts', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('import_id')->constrained()->cascadeOnDelete();
            $table->json('raw_row');
            $table->json('normalized_data')->nullable();
            $table->longText('vcard_text')->nullable();
            $table->boolean('is_duplicate')->default(false);
            $table->char('duplicate_of', 26)->nullable();
            $table->timestamps();

            $table->index('import_id');
            $table->index('is_duplicate');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('import_contacts');
    }
};
