<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('imports', function (Blueprint $table) {
            $table->boolean('ai_enabled')->default(false)->after('duplicate_details');
            $table->unsignedBigInteger('ai_rows_processed')->default(0)->after('ai_enabled');
            $table->boolean('is_priority')->default(false)->after('ai_rows_processed');
            $table->string('source')->default('upload')->after('is_priority');
            $table->foreignUlid('integration_id')->nullable()->after('source')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('imports', function (Blueprint $table) {
            $table->dropForeign(['integration_id']);
            $table->dropColumn([
                'ai_enabled',
                'ai_rows_processed',
                'is_priority',
                'source',
                'integration_id',
            ]);
        });
    }
};
