<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Bill;
use App\Models\FeeCategory;
use App\Models\Payment;
use App\Models\PaymentDetail;
use App\Models\PaymentMethod;
use App\Models\Student;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class TransactionSeeder extends Seeder
{
    public function run(): void
    {
        $academicYear = AcademicYear::where('is_active', true)->first();
        if (! $academicYear) return;

        $sppCategory = FeeCategory::where('name', 'SPP Bulanan')->first();
        $gedungCategory = FeeCategory::where('name', 'Uang Gedung & Sarpras')->first();
        $students = Student::where('is_active', true)->get();
        $cashMethod = PaymentMethod::where('type', 'cash')->first();
        $adminTu = User::where('email', 'tu@sekolah.sch.id')->first();

        // 1. Generate Tagihan SPP Juli & Agustus 2025 untuk semua siswa
        foreach ($students as $student) {
            if ($sppCategory) {
                // SPP Juli
                Bill::firstOrCreate(
                    [
                        'student_id' => $student->id,
                        'fee_category_id' => $sppCategory->id,
                        'month' => 7,
                        'year' => 2025,
                    ],
                    [
                        'academic_year_id' => $academicYear->id,
                        'title' => 'SPP Bulanan Juli 2025',
                        'amount' => 350000,
                        'paid_amount' => 0,
                        'status' => 'unpaid',
                        'due_date' => '2025-07-10',
                    ]
                );

                // SPP Agustus
                Bill::firstOrCreate(
                    [
                        'student_id' => $student->id,
                        'fee_category_id' => $sppCategory->id,
                        'month' => 8,
                        'year' => 2025,
                    ],
                    [
                        'academic_year_id' => $academicYear->id,
                        'title' => 'SPP Bulanan Agustus 2025',
                        'amount' => 350000,
                        'paid_amount' => 0,
                        'status' => 'unpaid',
                        'due_date' => '2025-08-10',
                    ]
                );
            }

            if ($gedungCategory && $student->classroom->level === '10') {
                // Uang Gedung untuk siswa kelas 10
                Bill::firstOrCreate(
                    [
                        'student_id' => $student->id,
                        'fee_category_id' => $gedungCategory->id,
                    ],
                    [
                        'academic_year_id' => $academicYear->id,
                        'title' => 'Uang Gedung & Sarpras Angkatan 2025',
                        'amount' => 1500000,
                        'paid_amount' => 0,
                        'status' => 'unpaid',
                        'due_date' => '2025-12-31',
                    ]
                );
            }
        }

        // 2. Buat 1 contoh transaksi pembayaran lunas untuk siswa pertama
        $firstStudent = $students->first();
        if ($firstStudent && $cashMethod && $adminTu) {
            $bill = Bill::where('student_id', $firstStudent->id)->where('status', 'unpaid')->first();

            if ($bill) {
                $payment = Payment::firstOrCreate(
                    ['invoice_number' => 'INV/20261006/0001'],
                    [
                        'student_id' => $firstStudent->id,
                        'user_id' => $adminTu->id,
                        'payment_method_id' => $cashMethod->id,
                        'total_amount' => $bill->amount,
                        'payment_date' => Carbon::now(),
                        'status' => 'completed',
                        'notes' => 'Pembayaran tunai kasir TU',
                    ]
                );

                PaymentDetail::firstOrCreate(
                    [
                        'payment_id' => $payment->id,
                        'bill_id' => $bill->id,
                    ],
                    [
                        'amount' => $bill->amount,
                    ]
                );

                $bill->update([
                    'paid_amount' => $bill->amount,
                    'status' => 'paid',
                ]);
            }
        }
    }
}
