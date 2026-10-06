<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\FeeCategoryRequest;
use App\Http\Resources\FeeCategoryResource;
use App\Models\FeeCategory;
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

        return $this->successResponse(
            new FeeCategoryResource($feeCategory),
            'Kategori biaya berhasil ditambahkan',
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

        return $this->successResponse(
            new FeeCategoryResource($feeCategory),
            'Kategori biaya berhasil diperbarui'
        );
    }

    public function destroy(FeeCategory $feeCategory): JsonResponse
    {
        $feeCategory->delete();

        return $this->successResponse(null, 'Kategori biaya berhasil dihapus');
    }
}
