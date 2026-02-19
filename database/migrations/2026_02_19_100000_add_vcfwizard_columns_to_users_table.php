<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('ai_rows_used')->default(0)->after('remember_token');
            $table->timestamp('ai_usage_reset_at')->nullable()->after('ai_rows_used');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'ai_rows_used',
                'ai_usage_reset_at',
            ]);
        });
    }
};
