<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AcademicYearRequest;
use App\Http\Resources\AcademicYearResource;
use App\Models\AcademicYear;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AcademicYearController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AcademicYear::withCount('classrooms')->orderBy('id', 'desc');

        if ($request->has('isActive')) {
            $query->where('is_active', $request->boolean('isActive'));
        }

        $academicYears = $query->get();

        return $this->successResponse(
            AcademicYearResource::collection($academicYears),
            'Data tahun ajaran berhasil diambil'
        );
    }

    public function store(AcademicYearRequest $request): JsonResponse
    {
        $validated = $request->validated();

        if (!empty($validated['is_active'])) {
            AcademicYear::where('is_active', true)->update(['is_active' => false]);
        }

        $academicYear = AcademicYear::create($validated);

        return $this->successResponse(
            new AcademicYearResource($academicYear),
            'Tahun ajaran berhasil dibuat',
            201
        );
    }

    public function show(AcademicYear $academicYear): JsonResponse
    {
        $academicYear->loadCount('classrooms');

        return $this->successResponse(
            new AcademicYearResource($academicYear),
            'Detail tahun ajaran berhasil diambil'
        );
    }

    public function update(AcademicYearRequest $request, AcademicYear $academicYear): JsonResponse
    {
        $validated = $request->validated();

        if (!empty($validated['is_active'])) {
            AcademicYear::where('id', '!=', $academicYear->id)
                ->where('is_active', true)
                ->update(['is_active' => false]);
        }

        $academicYear->update($validated);

        return $this->successResponse(
            new AcademicYearResource($academicYear),
            'Tahun ajaran berhasil diperbarui'
        );
    }

    public function destroy(AcademicYear $academicYear): JsonResponse
    {
        if ($academicYear->classrooms()->exists()) {
            return $this->errorResponse(
                'Tidak dapat menghapus tahun ajaran yang masih memiliki kelas terhubung',
                [],
                422
            );
        }

        $academicYear->delete();

        return $this->successResponse(null, 'Tahun ajaran berhasil dihapus');
    }
}
