<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\FeeCategoryRequest;
use App\Http\Resources\FeeCategoryResource;
use App\Models\AcademicYear;
use App\Models\Bill;
use App\Models\FeeCategory;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FeeCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = FeeCategory::query();

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->has('isActive')) {
            $query->where('is_active', $request->boolean('isActive'));
        }

        $categories = $query->orderBy('name')->get();

        return $this->successResponse(
            FeeCategoryResource::collection($categories),
            'Data kategori biaya berhasil diambil'
        );
    }

    public function store(FeeCategoryRequest $request): JsonResponse
    {
        $feeCategory = FeeCategory::create($request->validated());

        // Otomatis terbitkan tagihan aktif ke siswa sesuai tingkat
        $this->generateBillsForFeeCategory($feeCategory);

        return $this->successResponse(
            new FeeCategoryResource($feeCategory),
            'Kategori biaya berhasil ditambahkan dan tagihan aktif diterbitkan',
            201
        );
    }

    public function show(FeeCategory $feeCategory): JsonResponse
    {
        return $this->successResponse(
            new FeeCategoryResource($feeCategory),
            'Detail kategori biaya berhasil diambil'
        );
    }

    public function update(FeeCategoryRequest $request, FeeCategory $feeCategory): JsonResponse
    {
        $feeCategory->update($request->validated());

        if ($feeCategory->is_active) {
            $this->generateBillsForFeeCategory($feeCategory);
        }

        return $this->successResponse(
            new FeeCategoryResource($feeCategory),
            'Kategori biaya berhasil diperbarui'
        );
    }

    public function destroy(FeeCategory $feeCategory): JsonResponse
    {
        $hasPaidBills = Bill::where('fee_category_id', $feeCategory->id)
            ->where(function ($q) {
                $q->where('paid_amount', '>', 0)
                    ->orWhere('status', 'paid')
                    ->orWhere('status', 'partially_paid');
            })
            ->exists();

        if ($hasPaidBills) {
            return $this->errorResponse('Kategori biaya tidak dapat dihapus karena sudah memiliki transaksi pembayaran', [], 422);
        }

        Bill::where('fee_category_id', $feeCategory->id)->delete();
        $feeCategory->delete();

        return $this->successResponse(null, 'Kategori biaya berhasil dihapus');
    }

    private function generateBillsForFeeCategory(FeeCategory $feeCategory): void
    {
        if (! $feeCategory->is_active) {
            return;
        }

        $academicYear = AcademicYear::where('is_active', true)->first()
            ?? AcademicYear::orderByDesc('id')->first();

        if (! $academicYear) {
            return;
        }

        $studentsQuery = Student::where('is_active', true);
        if (! empty($feeCategory->level) && $feeCategory->level !== 'all') {
            $studentsQuery->whereHas('classroom', function ($q) use ($feeCategory) {
                $q->where('level', $feeCategory->level);
            });
        }

        $students = $studentsQuery->get();
        if ($students->isEmpty()) {
            return;
        }

        $isMonthly = $feeCategory->type === 'monthly';
        $month = $isMonthly
            ? ($feeCategory->due_date ? (int) $feeCategory->due_date->format('n') : (int) date('n'))
            : null;
        $year = $isMonthly
            ? ($feeCategory->due_date ? (int) $feeCategory->due_date->format('Y') : (int) date('Y'))
            : null;

        $monthNames = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];

        $title = $feeCategory->name;
        if ($isMonthly && $month) {
            $monthName = $monthNames[$month] ?? "Bulan {$month}";
            if (! str_contains(strtolower($feeCategory->name), strtolower($monthName))) {
                $title = "{$feeCategory->name} {$monthName} {$year}";
            }
        }

        $dueDate = $feeCategory->due_date?->format('Y-m-d');

        foreach ($students as $student) {
            $billQuery = Bill::where('student_id', $student->id)
                ->where('fee_category_id', $feeCategory->id)
                ->where('academic_year_id', $academicYear->id);

            if ($isMonthly) {
                $billQuery->where('month', $month)->where('year', $year);
            }

            $exists = $billQuery->exists();

            if (! $exists) {
                Bill::create([
                    'student_id' => $student->id,
                    'fee_category_id' => $feeCategory->id,
                    'academic_year_id' => $academicYear->id,
                    'title' => $title,
                    'month' => $month,
                    'year' => $year,
                    'amount' => $feeCategory->default_amount,
                    'paid_amount' => 0,
                    'status' => 'unpaid',
                    'due_date' => $dueDate,
                ]);
            }
        }
    }
}
