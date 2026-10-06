<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\FeeCategory;
use App\Models\PaymentMethod;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\MasterDataSeeder;
use Database\Seeders\RoleAndUserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MasterDataCrudTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminTu;
    protected User $kepsek;
    protected string $adminToken;
    protected string $kepsekToken;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndUserSeeder::class);
        $this->seed(MasterDataSeeder::class);

        $this->adminTu = User::where('email', 'tu@sekolah.sch.id')->first();
        $this->adminToken = $this->adminTu->createToken('test_token')->plainTextToken;

        $this->kepsek = User::where('email', 'kepsek@sekolah.sch.id')->first();
        $this->kepsekToken = $this->kepsek->createToken('test_token')->plainTextToken;
    }

    public function test_admin_tu_can_list_and_create_classrooms(): void
    {
        $academicYear = AcademicYear::first();

        // 1. Create Classroom
        $createResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/classrooms', [
                'academicYearId' => $academicYear->id,
                'name' => 'X-TKJ 1',
                'level' => '10',
            ]);

        $createResponse->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'X-TKJ 1')
            ->assertJsonPath('data.academicYearId', $academicYear->id);

        // 2. List Classrooms
        $listResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/classrooms');

        $listResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'level',
                        'academicYearId',
                    ],
                ],
            ]);
    }

    public function test_admin_tu_can_create_and_search_students(): void
    {
        $classroom = Classroom::first();

        // 1. Create Student
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/students', [
                'nis' => '99990001',
                'nisn' => '9999000111',
                'name' => 'Zulfa Ramadhan',
                'classroomId' => $classroom->id,
                'entryYear' => '2025',
                'isActive' => true,
                'phoneNumber' => '081299999999',
                'address' => 'Jl. Pandan No. 1',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.nis', '99990001')
            ->assertJsonPath('data.classroomId', $classroom->id);

        // 2. Search Student
        $searchResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/students?search=Zulfa');

        $searchResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.items.0.name', 'Zulfa Ramadhan');
    }

    public function test_kepala_sekolah_can_read_but_cannot_mutate_master_data(): void
    {
        // 1. Kepala Sekolah can read
        $readResponse = $this->withHeader('Authorization', 'Bearer ' . $this->kepsekToken)
            ->getJson('/api/fee-categories');

        $readResponse->assertStatus(200)
            ->assertJsonPath('success', true);

        // 2. Kepala Sekolah is forbidden from mutating (POST)
        $postResponse = $this->withHeader('Authorization', 'Bearer ' . $this->kepsekToken)
            ->postJson('/api/fee-categories', [
                'name' => 'Uang Komite Ilegal',
                'type' => 'monthly',
                'defaultAmount' => 100000,
            ]);

        $postResponse->assertStatus(403);
    }

    public function test_cannot_delete_academic_year_with_existing_classrooms(): void
    {
        $academicYear = AcademicYear::whereHas('classrooms')->first();

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->deleteJson("/api/academic-years/{$academicYear->id}");

        $response->assertStatus(422)
            ->assertJsonPath('success', false);
    }
}
