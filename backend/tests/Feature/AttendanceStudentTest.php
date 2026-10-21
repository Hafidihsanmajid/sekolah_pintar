<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\MasterDataSeeder;
use Database\Seeders\RoleAndUserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttendanceStudentTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminTu;
    protected string $adminTuToken;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndUserSeeder::class);
        $this->seed(MasterDataSeeder::class);

        $this->adminTu = User::where('email', 'tu@sekolah.sch.id')->first();
        $this->adminTuToken = $this->adminTu->createToken('test_token')->plainTextToken;
    }

    public function test_can_fetch_attendance_students(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminTuToken)
            ->getJson('/api/attendances/students');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'items' => [
                        '*' => [
                            'id',
                            'nis',
                            'name',
                            'classroomId',
                            'classroomName',
                            'classroomLevel',
                        ],
                    ],
                    'pagination',
                ],
            ]);
    }

    public function test_excludes_students_in_tagihan_alumni_classroom(): void
    {
        $academicYear = AcademicYear::first();
        $alumniClass = Classroom::firstOrCreate(
            ['name' => 'Tagihan Alumni', 'academic_year_id' => $academicYear->id],
            ['level' => 'Alumni']
        );

        $regularClass = Classroom::where('name', '!=', 'Tagihan Alumni')->first();

        // Buat siswa di kelas Tagihan Alumni
        $alumniStudent = Student::create([
            'classroom_id' => $alumniClass->id,
            'nis' => '999999',
            'nisn' => '9999999999',
            'name' => 'Siswa Alumni Yang Lulus',
            'entry_year' => '2023',
            'is_active' => true,
        ]);

        // Buat siswa reguler aktif
        $activeStudent = Student::create([
            'classroom_id' => $regularClass->id,
            'nis' => '888888',
            'nisn' => '8888888888',
            'name' => 'Siswa Reguler Aktif',
            'entry_year' => '2025',
            'is_active' => true,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminTuToken)
            ->getJson('/api/attendances/students?all=1');

        $response->assertStatus(200);

        $items = collect($response->json('data.items'));

        $this->assertTrue($items->contains('nis', '888888'));
        $this->assertFalse($items->contains('nis', '999999'));
    }

    public function test_can_filter_attendance_students_by_classroom(): void
    {
        $classrooms = Classroom::where('name', '!=', 'Tagihan Alumni')->get();
        $targetClass = $classrooms->first();

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminTuToken)
            ->getJson("/api/attendances/students?classroomId={$targetClass->id}");

        $response->assertStatus(200);
        $items = $response->json('data.items');

        foreach ($items as $item) {
            $this->assertEquals($targetClass->id, $item['classroomId']);
        }
    }
}
