<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProcessPaymentRequest;
use App\Http\Requests\VoidPaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Bill;
use App\Models\Payment;
use App\Models\PaymentDetail;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Payment::with(['student.classroom', 'cashier', 'paymentMethod', 'details.bill.feeCategory']);

        if ($request->filled('startDate')) {
            $query->whereDate('payment_date', '>=', $request->input('startDate'));
        }

        if ($request->filled('endDate')) {
            $query->whereDate('payment_date', '<=', $request->input('endDate'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('paymentMethodId')) {
            $query->where('payment_method_id', $request->input('paymentMethodId'));
        }

        if ($request->filled('studentId')) {
            $query->where('student_id', $request->input('studentId'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('student', function ($sq) use ($search) {
                      $sq->where('name', 'like', "%{$search}%")
                         ->orWhere('nis', 'like', "%{$search}%");
                  });
            });
        }

        $perPage = (int) $request->input('perPage', 15);
        $payments = $query->orderBy('id', 'desc')->paginate($perPage);

        return $this->successResponse([
            'items' => PaymentResource::collection($payments->items()),
            'pagination' => [
                'total' => $payments->total(),
                'perPage' => $payments->perPage(),
                'currentPage' => $payments->currentPage(),
                'lastPage' => $payments->lastPage(),
            ],
        ], 'Daftar transaksi pembayaran berhasil diambil');
    }

    public function store(ProcessPaymentRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $student = Student::findOrFail($validated['student_id']);
        $cashierId = $request->user()->id;

        $createdPayment = DB::transaction(function () use ($validated, $student, $cashierId) {
            $today = Carbon::now();
            $datePrefix = $today->format('Ymd');

            // Hitung nomor urut invoice harian
            $todayPaymentsCount = Payment::whereDate('created_at', $today->toDateString())->count();
            $sequence = str_pad((string) ($todayPaymentsCount + 1), 4, '0', STR_PAD_LEFT);
            $invoiceNumber = "INV/{$datePrefix}/{$sequence}";

            $totalAmount = 0;
            foreach ($validated['items'] as $item) {
                $totalAmount += (int) $item['amount'];
            }

            // Buat header transaksi pembayaran
            $payment = Payment::create([
                'invoice_number' => $invoiceNumber,
                'student_id' => $student->id,
                'user_id' => $cashierId,
                'payment_method_id' => $validated['payment_method_id'],
                'total_amount' => $totalAmount,
                'payment_date' => $today,
                'status' => 'completed',
                'notes' => $validated['notes'] ?? null,
            ]);

            // Proses setiap item tagihan dengan row locking
            foreach ($validated['items'] as $item) {
                $bill = Bill::where('id', $item['bill_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($bill->student_id !== $student->id) {
                    throw new \InvalidArgumentException("Tagihan ID {$bill->id} bukan milik siswa bersangkutan");
                }

                $remaining = (int) $bill->amount - (int) $bill->paid_amount;
                $payAmount = (int) $item['amount'];

                if ($payAmount > $remaining) {
                    throw new \InvalidArgumentException("Nominal bayar (Rp {$payAmount}) melebihi sisa tagihan '{$bill->title}' (Rp {$remaining})");
                }

                // Catat detail pembayaran
                PaymentDetail::create([
                    'payment_id' => $payment->id,
                    'bill_id' => $bill->id,
                    'amount' => $payAmount,
                ]);

                // Update status dan paid_amount tagihan
                $newPaidAmount = (int) $bill->paid_amount + $payAmount;
                $newStatus = ($newPaidAmount >= (int) $bill->amount) ? 'paid' : 'partially_paid';

                $bill->update([
                    'paid_amount' => $newPaidAmount,
                    'status' => $newStatus,
                ]);
            }

            return $payment;
        });

        $createdPayment->load(['student.classroom', 'cashier', 'paymentMethod', 'details.bill.feeCategory']);

        return $this->successResponse(
            new PaymentResource($createdPayment),
            'Pembayaran berhasil diproses di kasir',
            201
        );
    }

    public function show(Payment $payment): JsonResponse
    {
        $payment->load(['student.classroom', 'cashier', 'paymentMethod', 'details.bill.feeCategory']);

        return $this->successResponse(
            new PaymentResource($payment),
            'Detail transaksi pembayaran berhasil diambil'
        );
    }

    public function void(VoidPaymentRequest $request, Payment $payment): JsonResponse
    {
        if ($payment->status === 'void') {
            return $this->errorResponse('Transaksi ini sudah dibatalkan sebelumnya', [], 422);
        }

        DB::transaction(function () use ($payment, $request) {
            $payment->load('details');

            foreach ($payment->details as $detail) {
                $bill = Bill::where('id', $detail->bill_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $revertedPaidAmount = max(0, (int) $bill->paid_amount - (int) $detail->amount);
                $revertedStatus = ($revertedPaidAmount <= 0)
                    ? 'unpaid'
                    : (($revertedPaidAmount < (int) $bill->amount) ? 'partially_paid' : 'paid');

                $bill->update([
                    'paid_amount' => $revertedPaidAmount,
                    'status' => $revertedStatus,
                ]);
            }

            $payment->update([
                'status' => 'void',
                'voided_at' => Carbon::now(),
                'voided_by' => $request->user()->id,
                'void_reason' => $request->validated()['reason'],
            ]);
        });

        $payment->load(['student.classroom', 'cashier', 'paymentMethod', 'details.bill.feeCategory']);

        return $this->successResponse(
            new PaymentResource($payment),
            'Transaksi pembayaran berhasil di-void (dibatalkan)'
        );
    }
}
