<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\GenerateBillRequest;
use App\Http\Resources\BillResource;
use App\Models\Bill;
use App\Models\FeeCategory;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BillController extends Controller
{
    private array $monthNames = [
        1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
        5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
        9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
    ];

    public function index(Request $request): JsonResponse
    {
        $query = Bill::with(['student.classroom', 'feeCategory', 'academicYear']);

        if ($request->has('studentId')) {
            $query->where('student_id', $request->input('studentId'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('feeCategoryId')) {
            $query->where('fee_category_id', $request->input('feeCategoryId'));
        }

        if ($request->has('academicYearId')) {
            $query->where('academic_year_id', $request->input('academicYearId'));
        }

        if ($request->has('classroomId')) {
            $query->whereHas('student', function ($q) use ($request) {
                $q->where('classroom_id', $request->input('classroomId'));
            });
        }

        $perPage = (int) $request->input('perPage', 20);
        $bills = $query->orderBy('id', 'desc')->paginate($perPage);

        return $this->successResponse([
            'items' => BillResource::collection($bills->items()),
            'pagination' => [
                'total' => $bills->total(),
                'perPage' => $bills->perPage(),
                'currentPage' => $bills->currentPage(),
                'lastPage' => $bills->lastPage(),
            ],
        ], 'Data tagihan berhasil diambil');
    }

    public function studentBills(Student $student): JsonResponse
    {
        $bills = Bill::with(['feeCategory', 'academicYear'])
            ->where('student_id', $student->id)
            ->whereIn('status', ['unpaid', 'partially_paid'])
            ->orderBy('id', 'asc')
            ->get();

        return $this->successResponse(
            BillResource::collection($bills),
            'Tagihan aktif siswa berhasil diambil'
        );
    }

    public function generate(GenerateBillRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $feeCategory = FeeCategory::findOrFail($validated['fee_category_id']);
        $amount = $validated['amount'] ?? $feeCategory->default_amount;
        $academicYearId = $validated['academic_year_id'];

        $studentsQuery = Student::where('is_active', true);
        if (!empty($validated['classroom_id'])) {
            $studentsQuery->where('classroom_id', $validated['classroom_id']);
        }
        $students = $studentsQuery->get();

        if ($students->isEmpty()) {
            return $this->errorResponse('Tidak ada siswa aktif ditemukan untuk rombel yang dipilih', [], 422);
        }

        $createdCount = 0;

        DB::transaction(function () use ($students, $feeCategory, $academicYearId, $amount, $validated, &$createdCount) {
            foreach ($students as $student) {
                if ($feeCategory->type === 'monthly') {
                    $months = $validated['months'] ?? [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6]; // Standar kalender ajaran Indo
                    $baseYear = (int) ($validated['year'] ?? date('Y'));

                    foreach ($months as $month) {
                        $monthYear = ($month >= 7) ? $baseYear : ($baseYear + 1);
                        $monthName = $this->monthNames[$month] ?? "Bulan {$month}";
                        $title = "{$feeCategory->name} {$monthName} {$monthYear}";

                        // Cek apakah tagihan bulan ini sudah pernah dibuat
                        $exists = Bill::where('student_id', $student->id)
                            ->where('fee_category_id', $feeCategory->id)
                            ->where('academic_year_id', $academicYearId)
                            ->where('month', $month)
                            ->where('year', $monthYear)
                            ->exists();

                        if (! $exists) {
                            Bill::create([
                                'student_id' => $student->id,
                                'fee_category_id' => $feeCategory->id,
                                'academic_year_id' => $academicYearId,
                                'title' => $title,
                                'month' => $month,
                                'year' => $monthYear,
                                'amount' => $amount,
                                'paid_amount' => 0,
                                'status' => 'unpaid',
                                'due_date' => $validated['due_date'] ?? $feeCategory->due_date?->format('Y-m-d') ?? null,
                            ]);
                            $createdCount++;
                        }
                    }
                } else {
                    // Insidental / Sekali Bayar
                    $title = $feeCategory->name;
                    $exists = Bill::where('student_id', $student->id)
                        ->where('fee_category_id', $feeCategory->id)
                        ->where('academic_year_id', $academicYearId)
                        ->exists();

                    if (! $exists) {
                        Bill::create([
                            'student_id' => $student->id,
                            'fee_category_id' => $feeCategory->id,
                            'academic_year_id' => $academicYearId,
                            'title' => $title,
                            'amount' => $amount,
                            'paid_amount' => 0,
                            'status' => 'unpaid',
                            'due_date' => $validated['due_date'] ?? $feeCategory->due_date?->format('Y-m-d') ?? null,
                        ]);
                        $createdCount++;
                    }
                }
            }
        });

        return $this->successResponse([
            'generatedCount' => $createdCount,
        ], "Berhasil membuat {$createdCount} tagihan siswa", 201);
    }
}
