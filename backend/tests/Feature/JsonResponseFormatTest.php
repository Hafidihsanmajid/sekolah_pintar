<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class JsonResponseFormatTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Route::post('/api/test-validation', function (\Illuminate\Http\Request $request) {
            $request->validate([
                'email' => 'required|email',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Validasi sukses',
                'data' => null,
            ]);
        });
    }

    public function test_api_status_returns_standard_format(): void
    {
        $response = $this->getJson('/api/status');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'version',
            ]);
    }

    public function test_unauthenticated_api_error_returns_standard_format(): void
    {
        $response = $this->getJson('/api/user');

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Akses ditolak: sesi tidak valid atau belum terautentikasi',
            ]);
    }

    public function test_not_found_endpoint_returns_standard_format(): void
    {
        $response = $this->getJson('/api/endpoint-yang-tidak-ada');

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Data atau rute tidak ditemukan',
            ]);
    }

    public function test_method_not_allowed_returns_standard_format(): void
    {
        $response = $this->postJson('/api/status');

        $response->assertStatus(405)
            ->assertJson([
                'success' => false,
                'message' => 'Metode HTTP tidak diizinkan untuk rute ini',
            ]);
    }

    public function test_validation_failure_returns_standard_format(): void
    {
        $response = $this->postJson('/api/test-validation', []);

        $response->assertStatus(422)
            ->assertJsonStructure([
                'success',
                'message',
                'errors' => [
                    'email',
                ],
            ])
            ->assertJson([
                'success' => false,
                'message' => 'Validasi gagal',
            ]);
    }
}
