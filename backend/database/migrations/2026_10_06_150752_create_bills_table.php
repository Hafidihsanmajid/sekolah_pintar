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
        Schema::create('bills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('fee_category_id')->constrained('fee_categories')->onDelete('restrict');
            $table->foreignId('academic_year_id')->constrained('academic_years')->onDelete('restrict');
            $table->string('title', 150);
            $table->unsignedTinyInteger('month')->nullable(); // 1 - 12
            $table->unsignedSmallInteger('year')->nullable(); // contoh: 2025
            $table->bigInteger('amount'); // Nominal Rupiah penuh (bigInteger)
            $table->bigInteger('paid_amount')->default(0);
            $table->string('status', 20)->default('unpaid'); // 'unpaid' | 'partially_paid' | 'paid'
            $table->date('due_date')->nullable();
            $table->timestamps();

            $table->index(['student_id', 'status']);
            $table->index(['academic_year_id', 'fee_category_id']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bills');
    }
};
