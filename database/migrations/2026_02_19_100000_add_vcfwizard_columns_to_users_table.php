<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('stripe_customer_id')->nullable()->after('remember_token');
            $table->string('subscription_status')->default('free')->after('stripe_customer_id');
            $table->unsignedBigInteger('contacts_processed_this_month')->default(0)->after('subscription_status');
            $table->timestamp('current_period_started_at')->nullable()->after('contacts_processed_this_month');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'stripe_customer_id',
                'subscription_status',
                'contacts_processed_this_month',
                'current_period_started_at',
            ]);
        });
    }
};
