<?php

use App\Models\AcademicYear;
use App\Models\Classroom;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $academicYear = AcademicYear::where('is_active', true)->first() ?? AcademicYear::first();
        if ($academicYear) {
            Classroom::firstOrCreate(
                ['name' => 'Tagihan Alumni'],
                [
                    'academic_year_id' => $academicYear->id,
                    'level' => 'Alumni',
                ]
            );
        }
    }

    public function down(): void
    {
        Classroom::where('name', 'Tagihan Alumni')->delete();
    }
};
