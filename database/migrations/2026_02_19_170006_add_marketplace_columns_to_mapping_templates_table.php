<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mapping_templates', function (Blueprint $table) {
            $table->text('description')->nullable()->after('mapping');
            $table->string('category')->nullable()->after('description');
            $table->boolean('is_premium')->default(false)->after('is_public');
            $table->decimal('price', 5, 2)->default(0)->after('is_premium');
        });
    }

    public function down(): void
    {
        Schema::table('mapping_templates', function (Blueprint $table) {
            $table->dropColumn([
                'description',
                'category',
                'is_premium',
                'price',
            ]);
        });
    }
};
