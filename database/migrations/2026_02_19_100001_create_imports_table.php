<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('imports', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('original_filename');
            $table->string('file_path');
            $table->string('file_type', 10);
            $table->unsignedInteger('file_size')->default(0);
            $table->unsignedInteger('row_count')->default(0);
            $table->json('column_headers')->nullable();
            $table->json('mapped_fields')->nullable();
            $table->json('ai_suggestions')->nullable();
            $table->string('status')->default('pending');
            $table->unsignedInteger('duplicates_found')->default(0);
            $table->json('duplicate_details')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'created_at']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('imports');
    }
};
