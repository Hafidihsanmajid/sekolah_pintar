<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('attendance_settings', function (Blueprint $table) {
            $table->id();
            $table->time('entry_time')->default('07:00:00');
            $table->time('exit_time')->default('15:00:00');
            $table->integer('late_tolerance')->default(15);
            $table->timestamps();
        });

        DB::table('attendance_settings')->insert([
            'id' => 1,
            'entry_time' => '07:00:00',
            'exit_time' => '15:00:00',
            'late_tolerance' => 15,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_settings');
    }
};
