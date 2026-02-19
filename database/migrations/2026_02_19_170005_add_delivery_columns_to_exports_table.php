<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exports', function (Blueprint $table) {
            $table->string('delivery_method')->default('download')->after('is_public');
            $table->json('delivery_config')->nullable()->after('delivery_method');
            $table->string('delivery_status')->default('ready')->after('delivery_config');
        });
    }

    public function down(): void
    {
        Schema::table('exports', function (Blueprint $table) {
            $table->dropColumn([
                'delivery_method',
                'delivery_config',
                'delivery_status',
            ]);
        });
    }
};
