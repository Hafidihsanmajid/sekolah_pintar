<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RoleAndUserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttendanceSettingTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $adminTu;
    protected User $kepsek;
    protected string $superAdminToken;
    protected string $adminTuToken;
    protected string $kepsekToken;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndUserSeeder::class);

        $this->superAdmin = User::where('email', 'superadmin@sekolah.sch.id')->first();
        $this->superAdminToken = $this->superAdmin->createToken('test_token')->plainTextToken;

        $this->adminTu = User::where('email', 'tu@sekolah.sch.id')->first();
        $this->adminTuToken = $this->adminTu->createToken('test_token')->plainTextToken;

        $this->kepsek = User::where('email', 'kepsek@sekolah.sch.id')->first();
        $this->kepsekToken = $this->kepsek->createToken('test_token')->plainTextToken;
    }

    public function test_user_can_get_attendance_settings(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminTuToken)
            ->getJson('/api/attendance-settings');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'entryTime',
                    'exitTime',
                    'lateTolerance',
                ],
            ]);
    }

    public function test_admin_tu_can_update_attendance_settings(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminTuToken)
            ->putJson('/api/attendance-settings', [
                'entryTime' => '07:15',
                'exitTime' => '15:30',
                'lateTolerance' => 20,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.entryTime', '07:15')
            ->assertJsonPath('data.exitTime', '15:30')
            ->assertJsonPath('data.lateTolerance', 20);

        $this->assertDatabaseHas('attendance_settings', [
            'id' => 1,
            'late_tolerance' => 20,
        ]);
    }

    public function test_update_fails_with_invalid_data(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminTuToken)
            ->putJson('/api/attendance-settings', [
                'entryTime' => 'invalid-time',
                'exitTime' => '25:99',
                'lateTolerance' => -5,
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['errors']);
    }

    public function test_kepala_sekolah_cannot_update_attendance_settings(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->kepsekToken)
            ->putJson('/api/attendance-settings', [
                'entryTime' => '07:30',
                'exitTime' => '16:00',
                'lateTolerance' => 10,
            ]);

        $response->assertStatus(403);
    }
}
