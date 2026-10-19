<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BatchAttendanceRequest;
use App\Http\Resources\AttendanceResource;
use App\Http\Resources\StudentResource;
use App\Models\Attendance;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AttendanceController extends Controller
{
    /**
     * Ambil data siswa aktif untuk kebutuhan absensi
     * Wajib mengecualikan siswa yang berada di kelas "Tagihan Alumni"
     */
    public function students(Request $request): JsonResponse
    {
        $query = Student::with(['classroom.academicYear'])
            ->where('is_active', true)
            ->whereHas('classroom', function ($q) {
                $q->whereRaw('LOWER(name) != ?', ['tagihan alumni']);
            });

        if ($request->filled('search')) {
            $search = $request->input('search');
            $lowerSearch = mb_strtolower($search);
            $query->where(function ($q) use ($search, $lowerSearch) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$lowerSearch}%"])
                  ->orWhere('nis', 'like', "%{$search}%")
                  ->orWhere('nisn', 'like', "%{$search}%");
            });
        }

        if ($request->filled('academicYearId')) {
            $query->whereHas('classroom', function ($q) use ($request) {
                $q->where('academic_year_id', $request->input('academicYearId'));
            });
        }

        if ($request->filled('classroomId')) {
            $query->where('classroom_id', $request->input('classroomId'));
        }

        if ($request->boolean('all')) {
            $students = $query->orderBy('name')->get();
            return $this->successResponse([
                'items' => StudentResource::collection($students),
                'total' => $students->count(),
            ], 'Data siswa aktif untuk absensi berhasil diambil');
        }

        $perPage = (int) $request->input('perPage', 15);
        $students = $query->orderBy('name')->paginate($perPage);

        return $this->successResponse([
            'items' => StudentResource::collection($students->items()),
            'pagination' => [
                'total' => $students->total(),
                'perPage' => $students->perPage(),
                'currentPage' => $students->currentPage(),
                'lastPage' => $students->lastPage(),
            ],
        ], 'Data siswa aktif untuk absensi berhasil diambil');
    }

    /**
     * Ambil log & rekapitulasi riwayat absensi siswa
     */
    public function index(Request $request): JsonResponse
    {
        $query = Attendance::with(['student.classroom.academicYear']);

        if ($request->filled('date')) {
            $query->whereDate('date', $request->input('date'));
        } elseif ($request->filled('startDate') && $request->filled('endDate')) {
            $query->whereDate('date', '>=', $request->input('startDate'))
                  ->whereDate('date', '<=', $request->input('endDate'));
        }

        if ($request->filled('classroomId')) {
            $query->whereHas('student', function ($q) use ($request) {
                $q->where('classroom_id', $request->input('classroomId'));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', strtolower($request->input('status')));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $lowerSearch = mb_strtolower($search);
            $query->whereHas('student', function ($q) use ($search, $lowerSearch) {
                $q->where(function ($sub) use ($search, $lowerSearch) {
                    $sub->whereRaw('LOWER(name) LIKE ?', ["%{$lowerSearch}%"])
                        ->orWhere('nis', 'like', "%{$search}%")
                        ->orWhere('nisn', 'like', "%{$search}%");
                });
            });
        }

        // Summary metrics
        $allMatching = (clone $query)->get();
        $summary = [
            'total' => $allMatching->count(),
            'hadir' => $allMatching->where('status', 'hadir')->count(),
            'terlambat' => $allMatching->where('status', 'terlambat')->count(),
            'sakit' => $allMatching->where('status', 'sakit')->count(),
            'izin' => $allMatching->where('status', 'izin')->count(),
            'alpa' => $allMatching->where('status', 'alpa')->count(),
        ];

        $perPage = (int) $request->input('perPage', 20);
        $attendances = $query->orderBy('date', 'desc')->orderBy('id', 'desc')->paginate($perPage);

        return $this->successResponse([
            'items' => AttendanceResource::collection($attendances->items()),
            'summary' => $summary,
            'pagination' => [
                'total' => $attendances->total(),
                'perPage' => $attendances->perPage(),
                'currentPage' => $attendances->currentPage(),
                'lastPage' => $attendances->lastPage(),
            ],
        ], 'Data riwayat absensi berhasil diambil');
    }

    /**
     * Batch simpan absensi massal satu kelas
     */
    public function batch(BatchAttendanceRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $date = $validated['date'];
        $items = $validated['items'];

        $savedCount = 0;

        DB::transaction(function () use ($date, $items, &$savedCount) {
            foreach ($items as $item) {
                Attendance::updateOrCreate(
                    [
                        'student_id' => $item['student_id'],
                        'date' => $date,
                    ],
                    [
                        'status' => $item['status'],
                        'notes' => $item['notes'] ?? null,
                    ]
                );
                $savedCount++;
            }
        });

        return $this->successResponse([
            'savedCount' => $savedCount,
            'date' => $date,
        ], "Berhasil mencatat absensi {$savedCount} siswa untuk tanggal {$date}");
    }
}
