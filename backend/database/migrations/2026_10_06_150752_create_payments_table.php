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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number', 50)->unique();
            $table->foreignId('student_id')->constrained('students')->onDelete('restrict');
            $table->foreignId('user_id')->constrained('users')->onDelete('restrict'); // Kasir/Operator
            $table->foreignId('payment_method_id')->constrained('payment_methods')->onDelete('restrict');
            $table->bigInteger('total_amount'); // Rupiah penuh (bigInteger)
            $table->dateTime('payment_date');
            $table->string('status', 20)->default('completed'); // 'completed' | 'void'
            $table->text('notes')->nullable();
            $table->dateTime('voided_at')->nullable();
            $table->foreignId('voided_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('void_reason')->nullable();
            $table->timestamps();

            $table->index(['student_id', 'payment_date']);
            $table->index(['payment_method_id', 'payment_date']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
