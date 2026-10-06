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
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('nis', 30)->unique();
            $table->string('nisn', 30)->nullable()->unique();
            $table->string('name', 150);
            $table->foreignId('classroom_id')->constrained('classrooms')->onDelete('restrict');
            $table->string('entry_year', 10);
            $table->boolean('is_active')->default(true);
            $table->string('phone_number', 30)->nullable();
            $table->text('address')->nullable();
            $table->timestamps();

            $table->index(['name', 'is_active']);
            $table->index(['classroom_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
