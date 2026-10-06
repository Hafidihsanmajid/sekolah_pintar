<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bill;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    private array $indonesianDays = [
        'Monday' => 'Senin',
        'Tuesday' => 'Selasa',
        'Wednesday' => 'Rabu',
        'Thursday' => 'Kamis',
        'Friday' => 'Jumat',
        'Saturday' => 'Sabtu',
        'Sunday' => 'Minggu',
    ];

    public function stats(): JsonResponse
    {
        $today = Carbon::today();

        // 1. Penerimaan Hari Ini
        $todayPayments = Payment::with('paymentMethod')
            ->whereDate('payment_date', $today)
            ->where('status', 'completed')
            ->get();

        $todayTotal = (int) $todayPayments->sum('total_amount');
        $todayCount = $todayPayments->count();
        $todayCash = (int) $todayPayments->where('paymentMethod.type', 'cash')->sum('total_amount');
        $todayTransfer = (int) $todayPayments->where('paymentMethod.type', 'transfer')->sum('total_amount');

        // 2. Tunggakan Berjalan
        $unpaidBills = Bill::whereIn('status', ['unpaid', 'partially_paid'])->get();
        $totalArrears = (int) $unpaidBills->sum(fn ($b) => (int) $b->amount - (int) $b->paid_amount);
        $unpaidStudentsCount = $unpaidBills->pluck('student_id')->unique()->count();

        // 3. Tren 7 Hari Terakhir
        $trend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $dayNameEnglish = $date->format('l');
            $dayNameIndo = $this->indonesianDays[$dayNameEnglish] ?? $dayNameEnglish;

            $dayPayments = Payment::with('paymentMethod')
                ->whereDate('payment_date', $date)
                ->where('status', 'completed')
                ->get();

            $cash = (int) $dayPayments->where('paymentMethod.type', 'cash')->sum('total_amount');
            $transfer = (int) $dayPayments->where('paymentMethod.type', 'transfer')->sum('total_amount');
            $total = $cash + $transfer;

            $trend[] = [
                'date' => $date->format('Y-m-d'),
                'day' => $dayNameIndo,
                'tunai' => $cash,
                'transfer' => $transfer,
                'total' => $total,
            ];
        }

        return $this->successResponse([
            'today' => [
                'total' => $todayTotal,
                'count' => $todayCount,
                'cash' => $todayCash,
                'transfer' => $todayTransfer,
            ],
            'arrears' => [
                'total' => $totalArrears,
                'studentsCount' => $unpaidStudentsCount,
            ],
            'last7Days' => $trend,
        ], 'Data ringkasan statistik dashboard berhasil diambil');
    }
}
