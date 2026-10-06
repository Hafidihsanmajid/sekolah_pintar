<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\MasterDataSeeder;
use Database\Seeders\RoleAndUserSeeder;
use Database\Seeders\TransactionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportAndDashboardTest extends TestCase
{
    use RefreshDatabase;

    protected User $kepsek;
    protected string $kepsekToken;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndUserSeeder::class);
        $this->seed(MasterDataSeeder::class);
        $this->seed(TransactionSeeder::class);

        $this->kepsek = User::where('email', 'kepsek@sekolah.sch.id')->first();
        $this->kepsekToken = $this->kepsek->createToken('test_token')->plainTextToken;
    }

    public function test_kepala_sekolah_can_fetch_dashboard_stats(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->kepsekToken)
            ->getJson('/api/dashboard/stats');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'today' => ['total', 'count', 'cash', 'transfer'],
                    'arrears' => ['total', 'studentsCount'],
                    'last7Days',
                ],
            ]);
    }

    public function test_kepala_sekolah_can_fetch_daily_cash_report(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->kepsekToken)
            ->getJson('/api/reports/daily-cash');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'period' => ['startDate', 'endDate'],
                    'summary' => ['totalCash', 'totalTransfer', 'totalOverall', 'completedCount'],
                    'byMethod',
                    'byFeeCategory',
                    'transactions',
                ],
            ]);
    }

    public function test_kepala_sekolah_can_fetch_arrears_report(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->kepsekToken)
            ->getJson('/api/reports/arrears');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'summary' => ['totalStudentsWithArrears', 'totalUnpaidBillsCount', 'grandTotalArrears'],
                    'students' => [
                        '*' => [
                            'studentId',
                            'studentName',
                            'totalArrears',
                            'billCount',
                            'bills',
                        ],
                    ],
                ],
            ]);
    }

    public function test_kepala_sekolah_can_fetch_reconciliation_report(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->kepsekToken)
            ->getJson('/api/reports/reconciliation');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'period' => ['startDate', 'endDate'],
                    'channels' => [
                        '*' => [
                            'methodId',
                            'name',
                            'type',
                            'systemCalculatedTotal',
                        ],
                    ],
                ],
            ]);
    }
}
