<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bill;
use App\Models\Payment;
use App\Models\PaymentDetail;
use App\Models\PaymentMethod;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Laporan Penerimaan Kas & Bank Harian / Periode
     */
    public function dailyCash(Request $request): JsonResponse
    {
        $startDate = $request->input('startDate', Carbon::today()->toDateString());
        $endDate = $request->input('endDate', Carbon::today()->toDateString());

        $paymentsQuery = Payment::with(['paymentMethod', 'cashier', 'student.classroom', 'details.bill.feeCategory'])
            ->whereDate('payment_date', '>=', $startDate)
            ->whereDate('payment_date', '<=', $endDate);

        if ($request->filled('academicYearId')) {
            $paymentsQuery->whereHas('details.bill', function ($q) use ($request) {
                $q->where('academic_year_id', $request->input('academicYearId'));
            });
        }

        $payments = $paymentsQuery->orderBy('payment_date', 'desc')->get();

        $completedPayments = $payments->where('status', 'completed');
        $voidPayments = $payments->where('status', 'void');

        $totalCash = $completedPayments->where('paymentMethod.type', 'cash')->sum('total_amount');
        $totalTransfer = $completedPayments->where('paymentMethod.type', 'transfer')->sum('total_amount');
        $totalOverall = $completedPayments->sum('total_amount');

        // Breakdown per Saluran / Metode Pembayaran
        $byMethod = [];
        $methods = PaymentMethod::all();
        foreach ($methods as $method) {
            $sumMethod = $completedPayments->where('payment_method_id', $method->id)->sum('total_amount');
            $countMethod = $completedPayments->where('payment_method_id', $method->id)->count();
            $byMethod[] = [
                'methodId' => $method->id,
                'methodName' => $method->name,
                'methodType' => $method->type,
                'accountNumber' => $method->account_number,
                'transactionCount' => $countMethod,
                'totalAmount' => (int) $sumMethod,
            ];
        }

        // Breakdown per Pos Kategori Biaya
        $completedPaymentIds = $completedPayments->pluck('id');
        $feeBreakdown = PaymentDetail::with('bill.feeCategory')
            ->whereIn('payment_id', $completedPaymentIds)
            ->get()
            ->groupBy(fn ($d) => $d->bill?->feeCategory?->name ?? 'Lain-lain')
            ->map(function ($details, $categoryName) {
                return [
                    'categoryName' => $categoryName,
                    'totalAmount' => (int) $details->sum('amount'),
                    'count' => $details->count(),
                ];
            })
            ->values();

        return $this->successResponse([
            'period' => [
                'startDate' => $startDate,
                'endDate' => $endDate,
            ],
            'summary' => [
                'totalCash' => (int) $totalCash,
                'totalTransfer' => (int) $totalTransfer,
                'totalOverall' => (int) $totalOverall,
                'completedCount' => $completedPayments->count(),
                'voidCount' => $voidPayments->count(),
                'voidAmount' => (int) $voidPayments->sum('total_amount'),
            ],
            'byMethod' => $byMethod,
            'byFeeCategory' => $feeBreakdown,
            'transactions' => $payments->map(function ($p) {
                return [
                    'id' => $p->id,
                    'invoiceNumber' => $p->invoice_number,
                    'date' => $p->payment_date->toISOString(),
                    'studentName' => $p->student?->name,
                    'classroomName' => $p->student?->classroom?->name,
                    'methodName' => $p->paymentMethod?->name,
                    'methodType' => $p->paymentMethod?->type,
                    'totalAmount' => (int) $p->total_amount,
                    'cashierName' => $p->cashier?->name,
                    'status' => $p->status,
                ];
            }),
        ], 'Laporan penerimaan kas berhasil diambil');
    }

    /**
     * Laporan Tunggakan Siswa
     */
    public function arrears(Request $request): JsonResponse
    {
        $query = Bill::with(['student.classroom', 'feeCategory', 'academicYear'])
            ->whereIn('status', ['unpaid', 'partially_paid']);

        if ($request->filled('classroomId')) {
            $query->whereHas('student', function ($q) use ($request) {
                $q->where('classroom_id', $request->input('classroomId'));
            });
        }

        if ($request->filled('academicYearId')) {
            $query->where('academic_year_id', $request->input('academicYearId'));
        }

        if ($request->filled('feeCategoryId')) {
            $query->where('fee_category_id', $request->input('feeCategoryId'));
        }

        $bills = $query->orderBy('student_id')->get();

        // Rekap per Siswa
        $studentArrears = $bills->groupBy('student_id')->map(function ($studentBills) {
            $firstBill = $studentBills->first();
            $student = $firstBill->student;
            $totalArrears = $studentBills->sum(fn ($b) => (int) $b->amount - (int) $b->paid_amount);

            return [
                'studentId' => $student?->id,
                'studentNis' => $student?->nis,
                'studentName' => $student?->name,
                'classroomName' => $student?->classroom?->name,
                'totalArrears' => (int) $totalArrears,
                'billCount' => $studentBills->count(),
                'bills' => $studentBills->map(function ($b) {
                    return [
                        'id' => $b->id,
                        'title' => $b->title,
                        'categoryName' => $b->feeCategory?->name,
                        'amount' => (int) $b->amount,
                        'paidAmount' => (int) $b->paid_amount,
                        'remainingAmount' => (int) ($b->amount - $b->paid_amount),
                        'dueDate' => $b->due_date?->format('Y-m-d'),
                    ];
                })->values(),
            ];
        })->values();

        $grandTotalArrears = $studentArrears->sum('totalArrears');

        return $this->successResponse([
            'summary' => [
                'totalStudentsWithArrears' => $studentArrears->count(),
                'totalUnpaidBillsCount' => $bills->count(),
                'grandTotalArrears' => (int) $grandTotalArrears,
            ],
            'students' => $studentArrears,
        ], 'Laporan tunggakan siswa berhasil diambil');
    }

    /**
     * Rekonsiliasi Saluran Kas & Bank
     */
    public function reconciliation(Request $request): JsonResponse
    {
        $startDate = $request->input('startDate', Carbon::today()->startOfMonth()->toDateString());
        $endDate = $request->input('endDate', Carbon::today()->toDateString());

        $methods = PaymentMethod::all();
        $reconciliationData = [];

        foreach ($methods as $method) {
            $payments = Payment::where('payment_method_id', $method->id)
                ->where('status', 'completed')
                ->whereDate('payment_date', '>=', $startDate)
                ->whereDate('payment_date', '<=', $endDate)
                ->get();

            $totalAmount = (int) $payments->sum('total_amount');
            $count = $payments->count();

            $reconciliationData[] = [
                'methodId' => $method->id,
                'name' => $method->name,
                'type' => $method->type,
                'accountNumber' => $method->account_number,
                'accountHolder' => $method->account_holder,
                'transactionCount' => $count,
                'systemCalculatedTotal' => $totalAmount,
            ];
        }

        return $this->successResponse([
            'period' => [
                'startDate' => $startDate,
                'endDate' => $endDate,
            ],
            'channels' => $reconciliationData,
        ], 'Data rekonsiliasi kas dan bank berhasil diambil');
    }
}
