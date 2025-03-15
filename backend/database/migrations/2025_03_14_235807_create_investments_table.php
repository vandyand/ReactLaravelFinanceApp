<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('investments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('account_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('symbol')->nullable();
            $table->string('type'); // stock, bond, crypto, real_estate, etc.
            $table->decimal('purchase_price', 15, 2);
            $table->decimal('current_price', 15, 2);
            $table->decimal('quantity', 15, 6);
            $table->date('purchase_date');
            $table->date('sell_date')->nullable();
            $table->decimal('sell_price', 15, 2)->nullable();
            $table->string('currency', 3)->default('USD');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('investments');
    }
};
