<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ClassroomRequest;
use App\Http\Resources\ClassroomResource;
use App\Models\Classroom;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClassroomController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Classroom::with('academicYear')->withCount('students');

        if ($request->has('academicYearId')) {
            $query->where('academic_year_id', $request->input('academicYearId'));
        }

        if ($request->filled('level')) {
            $query->where('level', $request->input('level'));
        }

        $classrooms = $query->orderBy('name')->get();

        return $this->successResponse(
            ClassroomResource::collection($classrooms),
            'Data kelas berhasil diambil'
        );
    }

    public function store(ClassroomRequest $request): JsonResponse
    {
        $classroom = Classroom::create($request->validated());
        $classroom->load('academicYear')->loadCount('students');

        return $this->successResponse(
            new ClassroomResource($classroom),
            'Kelas berhasil ditambahkan',
            201
        );
    }

    public function show(Classroom $classroom): JsonResponse
    {
        $classroom->load('academicYear')->loadCount('students');

        return $this->successResponse(
            new ClassroomResource($classroom),
            'Detail kelas berhasil diambil'
        );
    }

    public function update(ClassroomRequest $request, Classroom $classroom): JsonResponse
    {
        $classroom->update($request->validated());
        $classroom->load('academicYear')->loadCount('students');

        return $this->successResponse(
            new ClassroomResource($classroom),
            'Kelas berhasil diperbarui'
        );
    }

    public function destroy(Classroom $classroom): JsonResponse
    {
        if ($classroom->students()->exists()) {
            return $this->errorResponse(
                'Tidak dapat menghapus kelas yang masih memiliki siswa terdaftar',
                [],
                422
            );
        }

        $classroom->delete();

        return $this->successResponse(null, 'Kelas berhasil dihapus');
    }
}
