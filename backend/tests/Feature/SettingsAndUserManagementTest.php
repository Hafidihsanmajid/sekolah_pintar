<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\MasterDataSeeder;
use Database\Seeders\RoleAndUserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsAndUserManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $adminTu;
    protected string $superAdminToken;
    protected string $adminTuToken;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndUserSeeder::class);
        $this->seed(MasterDataSeeder::class);

        $this->superAdmin = User::where('email', 'superadmin@sekolah.sch.id')->first();
        $this->superAdminToken = $this->superAdmin->createToken('test_token')->plainTextToken;

        $this->adminTu = User::where('email', 'tu@sekolah.sch.id')->first();
        $this->adminTuToken = $this->adminTu->createToken('test_token')->plainTextToken;
    }

    public function test_can_get_and_update_school_profile(): void
    {
        $getResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminTuToken)
            ->getJson('/api/settings/profile');

        $getResponse->assertStatus(200)
            ->assertJsonPath('success', true);

        $updateResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminTuToken)
            ->putJson('/api/settings/profile', [
                'name' => 'SMK Pintar Bangsa Unggulan',
                'address' => 'Jl. Pendidikan Baru No. 10',
                'phone' => '021-99998888',
                'email' => 'info@smkpintarbangsa.sch.id',
                'principalName' => 'Drs. H. Bambang, M.Pd.',
                'treasurerName' => 'Sri Wahyuni, S.E.',
            ]);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'SMK Pintar Bangsa Unggulan');
    }

    public function test_user_can_change_password(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminTuToken)
            ->postJson('/api/settings/change-password', [
                'currentPassword' => 'password123',
                'newPassword' => 'newsecretpassword123',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    public function test_super_admin_can_manage_users(): void
    {
        // 1. Create User
        $createResponse = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson('/api/settings/users', [
                'name' => 'Staf TU Baru',
                'email' => 'tubaru@sekolah.sch.id',
                'password' => 'password123',
                'role' => 'admin_tu',
            ]);

        $createResponse->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.email', 'tubaru@sekolah.sch.id');

        $newUserId = $createResponse->json('data.id');

        // 2. List Users
        $listResponse = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->getJson('/api/settings/users');

        $listResponse->assertStatus(200)
            ->assertJsonPath('success', true);

        // 3. Delete User
        $deleteResponse = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->deleteJson("/api/settings/users/{$newUserId}");

        $deleteResponse->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    public function test_admin_tu_cannot_manage_users(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminTuToken)
            ->getJson('/api/settings/users');

        $response->assertStatus(403);
    }
}
