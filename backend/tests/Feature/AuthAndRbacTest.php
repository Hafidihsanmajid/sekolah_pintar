<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RoleAndUserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthAndRbacTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndUserSeeder::class);
    }

    public function test_super_admin_can_login_and_receive_token(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'superadmin@sekolah.sch.id',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'token',
                    'user' => [
                        'id',
                        'name',
                        'email',
                        'role',
                        'createdAt',
                    ],
                ],
            ])
            ->assertJsonPath('data.user.role', 'super_admin');
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'superadmin@sekolah.sch.id',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('success', false)
            ->assertJsonStructure([
                'success',
                'message',
                'errors' => ['email'],
            ]);
    }

    public function test_authenticated_user_can_get_profile(): void
    {
        $user = User::where('email', 'tu@sekolah.sch.id')->first();
        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/auth/me');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.role', 'admin_tu');
    }

    public function test_user_can_logout(): void
    {
        $user = User::where('email', 'kepsek@sekolah.sch.id')->first();
        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/logout');

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        // Reset memory guard cache agar Sanctum membaca ulang status token di DB
        app('auth')->forgetGuards();

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/auth/me')
            ->assertStatus(401);
    }
}
