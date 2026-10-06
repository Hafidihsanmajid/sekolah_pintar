<?php

namespace Tests\Feature;

use App\Models\Bill;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\MasterDataSeeder;
use Database\Seeders\RoleAndUserSeeder;
use Database\Seeders\TransactionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CashierAndPaymentTest extends TestCase
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
        $this->seed(MasterDataSeeder::class);
        $this->seed(TransactionSeeder::class);

        $this->superAdmin = User::where('email', 'superadmin@sekolah.sch.id')->first();
        $this->superAdminToken = $this->superAdmin->createToken('test_token')->plainTextToken;

        $this->adminTu = User::where('email', 'tu@sekolah.sch.id')->first();
        $this->adminTuToken = $this->adminTu->createToken('test_token')->plainTextToken;

        $this->kepsek = User::where('email', 'kepsek@sekolah.sch.id')->first();
        $this->kepsekToken = $this->kepsek->createToken('test_token')->plainTextToken;
    }

    public function test_admin_tu_can_fetch_student_active_bills(): void
    {
        $student = Student::first();

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminTuToken)
            ->getJson("/api/students/{$student->id}/bills");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => [
                        'id',
                        'studentId',
                        'title',
                        'amount',
                        'paidAmount',
                        'remainingAmount',
                        'status',
                    ],
                ],
            ]);
    }

    public function test_cashier_can_process_full_and_partial_payment(): void
    {
        $student = Student::first();
        $bill = Bill::where('student_id', $student->id)->where('status', 'unpaid')->first();
        $paymentMethod = PaymentMethod::where('type', 'cash')->first();

        $payAmount = 200000; // Partial payment (less than 350000)

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminTuToken)
            ->postJson('/api/payments', [
                'studentId' => $student->id,
                'paymentMethodId' => $paymentMethod->id,
                'items' => [
                    [
                        'billId' => $bill->id,
                        'amount' => $payAmount,
                    ],
                ],
                'notes' => 'Bayar sebagian SPP',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.totalAmount', $payAmount)
            ->assertJsonPath('data.status', 'completed');

        // Pastikan status bill berubah menjadi partially_paid
        $bill->refresh();
        $this->assertEquals($payAmount, $bill->paid_amount);
        $this->assertEquals('partially_paid', $bill->status);
    }

    public function test_payment_fails_if_amount_exceeds_remaining_bill(): void
    {
        $student = Student::first();
        $bill = Bill::where('student_id', $student->id)->where('status', 'unpaid')->first();
        $paymentMethod = PaymentMethod::first();

        $excessAmount = $bill->amount + 100000;

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminTuToken)
            ->postJson('/api/payments', [
                'studentId' => $student->id,
                'paymentMethodId' => $paymentMethod->id,
                'items' => [
                    [
                        'billId' => $bill->id,
                        'amount' => $excessAmount,
                    ],
                ],
            ]);

        $response->assertStatus(500); // Throws InvalidArgumentException caught by handler
    }

    public function test_super_admin_can_void_completed_payment(): void
    {
        $payment = Payment::where('status', 'completed')->first();
        $detail = $payment->details->first();
        $bill = $detail->bill;

        $this->assertEquals('paid', $bill->status);

        // Super Admin voids transaction
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->superAdminToken)
            ->postJson("/api/payments/{$payment->id}/void", [
                'reason' => 'Salah input nominal oleh kasir',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'void');

        // Pastikan status tagihan ter-revert
        $bill->refresh();
        $this->assertEquals(0, $bill->paid_amount);
        $this->assertEquals('unpaid', $bill->status);
    }

    public function test_admin_tu_cannot_void_payment(): void
    {
        $payment = Payment::where('status', 'completed')->first();

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminTuToken)
            ->postJson("/api/payments/{$payment->id}/void", [
                'reason' => 'Ingin batalkan tapi tidak ada hak akses',
            ]);

        $response->assertStatus(403);
    }
}
