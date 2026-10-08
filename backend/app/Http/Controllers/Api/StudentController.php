<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StudentRequest;
use App\Http\Resources\StudentResource;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Student::with(['classroom.academicYear']);

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

        if ($request->has('isActive')) {
            $query->where('is_active', $request->boolean('isActive'));
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
        ], 'Data siswa berhasil diambil');
    }

    public function store(StudentRequest $request): JsonResponse
    {
        $student = Student::create($request->validated());
        $student->load('classroom');

        return $this->successResponse(
            new StudentResource($student),
            'Data siswa berhasil ditambahkan',
            201
        );
    }

    public function show(Student $student): JsonResponse
    {
        $student->load('classroom');

        return $this->successResponse(
            new StudentResource($student),
            'Detail siswa berhasil diambil'
        );
    }

    public function update(StudentRequest $request, Student $student): JsonResponse
    {
        $student->update($request->validated());
        $student->load('classroom');

        return $this->successResponse(
            new StudentResource($student),
            'Data siswa berhasil diperbarui'
        );
    }

    public function destroy(Student $student): JsonResponse
    {
        $student->delete();

        return $this->successResponse(null, 'Data siswa berhasil dihapus');
    }
}
