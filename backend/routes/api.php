<?php

use App\Http\Controllers\Api\AcademicYearController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClassroomController;
use App\Http\Controllers\Api\FeeCategoryController;
use App\Http\Controllers\Api\PaymentMethodController;
use App\Http\Controllers\Api\StudentController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/status', function () {
    return response()->json([
        'success' => true,
        'message' => 'Sekolah Pintar ERP API ready',
        'version' => '1.0.0',
    ]);
});

// Alias for backwards-compatibility
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return response()->json([
        'success' => true,
        'message' => 'User profile retrieved',
        'data' => $request->user(),
    ]);
});

// Authentication Routes
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

// Master Data Routes (Protected with Sanctum & RBAC)
Route::middleware(['auth:sanctum', 'role:super_admin|admin_tu|kepala_sekolah'])->group(function () {
    // Read Routes (Super Admin, Admin TU, Kepala Sekolah)
    Route::get('/academic-years', [AcademicYearController::class, 'index']);
    Route::get('/academic-years/{academicYear}', [AcademicYearController::class, 'show']);

    Route::get('/classrooms', [ClassroomController::class, 'index']);
    Route::get('/classrooms/{classroom}', [ClassroomController::class, 'show']);

    Route::get('/students', [StudentController::class, 'index']);
    Route::get('/students/{student}', [StudentController::class, 'show']);

    Route::get('/fee-categories', [FeeCategoryController::class, 'index']);
    Route::get('/fee-categories/{feeCategory}', [FeeCategoryController::class, 'show']);

    Route::get('/payment-methods', [PaymentMethodController::class, 'index']);
    Route::get('/payment-methods/{paymentMethod}', [PaymentMethodController::class, 'show']);

    // Mutation Routes (Super Admin & Admin TU only - Kepala Sekolah prohibited)
    Route::middleware('role:super_admin|admin_tu')->group(function () {
        Route::post('/academic-years', [AcademicYearController::class, 'store']);
        Route::put('/academic-years/{academicYear}', [AcademicYearController::class, 'update']);
        Route::delete('/academic-years/{academicYear}', [AcademicYearController::class, 'destroy']);

        Route::post('/classrooms', [ClassroomController::class, 'store']);
        Route::put('/classrooms/{classroom}', [ClassroomController::class, 'update']);
        Route::delete('/classrooms/{classroom}', [ClassroomController::class, 'destroy']);

        Route::post('/students', [StudentController::class, 'store']);
        Route::put('/students/{student}', [StudentController::class, 'update']);
        Route::delete('/students/{student}', [StudentController::class, 'destroy']);

        Route::post('/fee-categories', [FeeCategoryController::class, 'store']);
        Route::put('/fee-categories/{feeCategory}', [FeeCategoryController::class, 'update']);
        Route::delete('/fee-categories/{feeCategory}', [FeeCategoryController::class, 'destroy']);

        Route::post('/payment-methods', [PaymentMethodController::class, 'store']);
        Route::put('/payment-methods/{paymentMethod}', [PaymentMethodController::class, 'update']);
        Route::delete('/payment-methods/{paymentMethod}', [PaymentMethodController::class, 'destroy']);
    });
});
