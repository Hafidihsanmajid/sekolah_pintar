<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Attendance;
use App\Models\AttendanceSetting;
use App\Models\Classroom;
use App\Models\Student;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\MasterDataSeeder;
use Database\Seeders\RoleAndUserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttendanceTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminTu;
    protected User $kepsek;
    protected string $adminTuToken;
    protected string $kepsekToken;
    protected Classroom $classroom;
    protected Student $student1;
    protected Student $student2;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndUserSeeder::class);
        $this->seed(MasterDataSeeder::class);

        $this->adminTu = User::where('email', 'tu@sekolah.sch.id')->first();
        $this->adminTuToken = $this->adminTu->createToken('test_token')->plainTextToken;

        $this->kepsek = User::where('email', 'kepsek@sekolah.sch.id')->first();
        $this->kepsekToken = $this->kepsek->createToken('test_token')->plainTextToken;

        $academicYear = AcademicYear::first();
        $this->classroom = Classroom::create([
            'academic_year_id' => $academicYear->id,
            'name' => '10-RPL-1',
            'level' => '10',
        ]);

        $this->student1 = Student::create([
            'classroom_id' => $this->classroom->id,
            'nis' => '10001',
            'nisn' => '100010001',
            'name' => 'Budi Pratama',
            'entry_year' => '2025',
            'is_active' => true,
        ]);

        $this->student2 = Student::create([
            'classroom_id' => $this->classroom->id,
            'nis' => '10002',
            'nisn' => '100010002',
            'name' => 'Siti Nurhaliza',
            'entry_year' => '2025',
            'is_active' => true,
        ]);
    }

    public function test_admin_can_save_batch_attendance(): void
    {
        $payload = [
            'date' => '2026-10-19',
            'classroomId' => $this->classroom->id,
            'items' => [
                [
                    'studentId' => $this->student1->id,
                    'status' => 'hadir',
                    'notes' => 'Tepat waktu',
                ],
                [
                    'studentId' => $this->student2->id,
                    'status' => 'terlambat',
                    'notes' => 'Terlambat 10 menit',
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminTuToken)
            ->postJson('/api/attendances/batch', $payload);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.savedCount', 2);

        $this->assertDatabaseHas('attendances', [
            'student_id' => $this->student1->id,
            'date' => '2026-10-19',
            'status' => 'hadir',
        ]);

        $this->assertDatabaseHas('attendances', [
            'student_id' => $this->student2->id,
            'date' => '2026-10-19',
            'status' => 'terlambat',
        ]);
    }

    public function test_batch_attendance_upserts_existing_record(): void
    {
        // Catat pertama kali
        Attendance::create([
            'student_id' => $this->student1->id,
            'date' => '2026-10-19',
            'status' => 'hadir',
        ]);

        // Kirim update tanggal yang sama jadi izin
        $payload = [
            'date' => '2026-10-19',
            'classroomId' => $this->classroom->id,
            'items' => [
                [
                    'studentId' => $this->student1->id,
                    'status' => 'izin',
                    'notes' => 'Acara keluarga',
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminTuToken)
            ->postJson('/api/attendances/batch', $payload);

        $response->assertStatus(200);

        $this->assertEquals(1, Attendance::where('student_id', $this->student1->id)->where('date', '2026-10-19')->count());
        $this->assertDatabaseHas('attendances', [
            'student_id' => $this->student1->id,
            'date' => '2026-10-19',
            'status' => 'izin',
            'notes' => 'Acara keluarga',
        ]);
    }

    public function test_batch_attendance_validates_required_fields_and_enum(): void
    {
        $payload = [
            'date' => 'invalid-date',
            'classroomId' => 999999,
            'items' => [
                [
                    'studentId' => 999999,
                    'status' => 'bolos', // invalid status
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminTuToken)
            ->postJson('/api/attendances/batch', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['errors']);
    }

    public function test_can_list_and_filter_attendance_history(): void
    {
        Attendance::create([
            'student_id' => $this->student1->id,
            'date' => '2026-10-19',
            'status' => 'hadir',
        ]);
        Attendance::create([
            'student_id' => $this->student2->id,
            'date' => '2026-10-19',
            'status' => 'sakit',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminTuToken)
            ->getJson('/api/attendances?date=2026-10-19');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.summary.total', 2)
            ->assertJsonPath('data.summary.hadir', 1)
            ->assertJsonPath('data.summary.sakit', 1)
            ->assertJsonPath('data.summary.alpa', 0);
    }

    public function test_kepala_sekolah_cannot_submit_batch_attendance(): void
    {
        $payload = [
            'date' => '2026-10-19',
            'classroomId' => $this->classroom->id,
            'items' => [
                [
                    'studentId' => $this->student1->id,
                    'status' => 'hadir',
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->kepsekToken)
            ->postJson('/api/attendances/batch', $payload);

        $response->assertStatus(403);
    }

    public function test_cannot_delete_student_with_attendance_records(): void
    {
        Attendance::create([
            'student_id' => $this->student1->id,
            'date' => '2026-10-19',
            'status' => 'hadir',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminTuToken)
            ->deleteJson("/api/students/{$this->student1->id}");

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Tidak dapat menghapus siswa yang memiliki riwayat presensi.');

        $this->assertDatabaseHas('students', [
            'id' => $this->student1->id,
        ]);
    }

    public function test_kiosk_attendance_records_present_on_time(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-20 07:10:00', 'Asia/Jakarta'));

        $response = $this->postJson('/api/v1/attendances/kiosk', [
            'nis' => $this->student1->nis,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.studentNis', $this->student1->nis)
            ->assertJsonPath('data.status', 'hadir')
            ->assertJsonPath('data.date', '2026-10-20');

        $this->assertDatabaseHas('attendances', [
            'student_id' => $this->student1->id,
            'date' => '2026-10-20',
            'status' => 'hadir',
        ]);

        Carbon::setTestNow(null);
    }

    public function test_kiosk_attendance_records_late_when_past_cutoff(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-20 07:25:00', 'Asia/Jakarta'));

        $response = $this->postJson('/api/v1/attendances/kiosk', [
            'nis' => $this->student2->nis,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.studentNis', $this->student2->nis)
            ->assertJsonPath('data.status', 'terlambat');

        $this->assertDatabaseHas('attendances', [
            'student_id' => $this->student2->id,
            'date' => '2026-10-20',
            'status' => 'terlambat',
        ]);

        Carbon::setTestNow(null);
    }

    public function test_kiosk_attendance_rejects_duplicate_check_in_on_same_day(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-20 07:05:00', 'Asia/Jakarta'));

        // Absen pertama kali berhasil
        $firstResponse = $this->postJson('/api/v1/attendances/kiosk', [
            'nis' => $this->student1->nis,
        ]);
        $firstResponse->assertStatus(200);

        // Absen kedua kali di hari yang sama harus ditolak 422
        $secondResponse = $this->postJson('/api/v1/attendances/kiosk', [
            'nis' => $this->student1->nis,
        ]);

        $secondResponse->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('errors.alreadyRecorded', true);

        Carbon::setTestNow(null);
    }

    public function test_kiosk_attendance_validates_required_nis(): void
    {
        $response = $this->postJson('/api/v1/attendances/kiosk', []);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['errors' => ['nis']]);
    }

    public function test_kiosk_attendance_rejects_non_existent_nis(): void
    {
        $response = $this->postJson('/api/v1/attendances/kiosk', [
            'nis' => 'NIS_TIDAK_ADA_99999',
        ]);

        $response->assertStatus(404)
            ->assertJsonPath('success', false);
    }

    public function test_kiosk_attendance_rejects_inactive_student(): void
    {
        $this->student1->update(['is_active' => false]);

        $response = $this->postJson('/api/v1/attendances/kiosk', [
            'nis' => $this->student1->nis,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_kiosk_attendance_rejects_alumni_student(): void
    {
        $alumniClass = Classroom::create([
            'academic_year_id' => Classroom::first()->academic_year_id,
            'name' => 'Tagihan Alumni',
            'level' => 'Alumni',
        ]);
        $this->student1->update(['classroom_id' => $alumniClass->id]);

        $response = $this->postJson('/api/v1/attendances/kiosk', [
            'nis' => $this->student1->nis,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);
    }
}
