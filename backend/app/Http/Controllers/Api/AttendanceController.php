<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BatchAttendanceRequest;
use App\Http\Requests\KioskAttendanceRequest;
use App\Http\Resources\AttendanceResource;
use App\Http\Resources\StudentResource;
use App\Models\Attendance;
use App\Models\AttendanceSetting;
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

    /**
     * Endpoint mandiri Kiosk untuk pencatatan kehadiran menggunakan NIS
     */
    public function kiosk(KioskAttendanceRequest $request): JsonResponse
    {
        $nis = trim($request->validated()['nis']);

        // Cari siswa berdasarkan NIS beserta relasi kelas
        $student = Student::with(['classroom.academicYear'])
            ->where('nis', $nis)
            ->first();

        if (!$student) {
            return $this->errorResponse("Siswa dengan NIS {$nis} tidak ditemukan di sistem", [
                'nis' => ["NIS {$nis} tidak terdaftar"],
            ], 404);
        }

        if (!$student->is_active) {
            return $this->errorResponse("Siswa {$student->name} (NIS: {$nis}) berstatus tidak aktif", [
                'nis' => ['Siswa berstatus tidak aktif'],
            ], 422);
        }

        if (strtolower($student->classroom?->name ?? '') === 'tagihan alumni') {
            return $this->errorResponse("Siswa {$student->name} telah dinyatakan lulus (Alumni)", [
                'nis' => ['Siswa telah berstatus alumni'],
            ], 422);
        }

        $timezone = config('app.timezone') ?: 'Asia/Jakarta';
        $now = Carbon::now($timezone);
        $today = $now->toDateString();

        // Cek apakah siswa sudah melakukan absensi hari ini
        $existing = Attendance::where('student_id', $student->id)
            ->whereDate('date', $today)
            ->first();

        if ($existing) {
            $existing->setRelation('student', $student);
            $statusLabel = ucfirst($existing->status);
            $timeStr = $existing->created_at ? $existing->created_at->setTimezone($timezone)->format('H:i') : '';
            $timeInfo = $timeStr ? " pada pukul {$timeStr} WIB" : '';

            return $this->errorResponse(
                "Siswa {$student->name} sudah melakukan absensi hari ini{$timeInfo} (Status: {$statusLabel})",
                [
                    'alreadyRecorded' => true,
                    'attendance' => new AttendanceResource($existing),
                ],
                422
            );
        }

        // Ambil konfigurasi absensi aktif
        $setting = AttendanceSetting::first();
        $entryTimeStr = $setting?->entry_time ? substr((string) $setting->entry_time, 0, 5) : '07:00';
        $lateTolerance = (int) ($setting?->late_tolerance ?? 15);

        // Hitung batas toleransi waktu keterlambatan
        $entryCarbon = Carbon::createFromTimeString($entryTimeStr, $timezone);
        $cutoffCarbon = $entryCarbon->copy()->addMinutes($lateTolerance);
        $currentTimeCarbon = Carbon::createFromTimeString($now->format('H:i:s'), $timezone);

        if ($currentTimeCarbon->greaterThan($cutoffCarbon)) {
            $diffMinutes = max(1, (int) $cutoffCarbon->diffInMinutes($currentTimeCarbon));
            $status = 'terlambat';
            $notes = "Absen mandiri kiosk (Terlambat {$diffMinutes} menit)";
        } else {
            $status = 'hadir';
            $notes = 'Absen mandiri kiosk (Tepat waktu)';
        }

        $attendance = Attendance::create([
            'student_id' => $student->id,
            'date' => $today,
            'status' => $status,
            'notes' => $notes,
        ]);

        $attendance->setRelation('student', $student);

        $statusTitle = $status === 'hadir' ? 'Hadir' : 'Terlambat';
        $formattedTime = $now->format('H:i');

        return $this->successResponse(
            new AttendanceResource($attendance),
            "Absensi berhasil: {$student->name} ({$statusTitle}) pada {$formattedTime} WIB"
        );
    }
}
