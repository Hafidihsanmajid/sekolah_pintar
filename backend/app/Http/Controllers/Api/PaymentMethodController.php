<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PaymentMethodRequest;
use App\Http\Resources\PaymentMethodResource;
use App\Models\PaymentMethod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentMethodController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PaymentMethod::query();

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->has('isActive')) {
            $query->where('is_active', $request->boolean('isActive'));
        }

        $methods = $query->orderBy('name')->get();

        return $this->successResponse(
            PaymentMethodResource::collection($methods),
            'Data metode pembayaran berhasil diambil'
        );
    }

    public function store(PaymentMethodRequest $request): JsonResponse
    {
        $paymentMethod = PaymentMethod::create($request->validated());

        return $this->successResponse(
            new PaymentMethodResource($paymentMethod),
            'Metode pembayaran berhasil ditambahkan',
            201
        );
    }

    public function show(PaymentMethod $paymentMethod): JsonResponse
    {
        return $this->successResponse(
            new PaymentMethodResource($paymentMethod),
            'Detail metode pembayaran berhasil diambil'
        );
    }

    public function update(PaymentMethodRequest $request, PaymentMethod $paymentMethod): JsonResponse
    {
        $paymentMethod->update($request->validated());

        return $this->successResponse(
            new PaymentMethodResource($paymentMethod),
            'Metode pembayaran berhasil diperbarui'
        );
    }

    public function destroy(PaymentMethod $paymentMethod): JsonResponse
    {
        $paymentMethod->delete();

        return $this->successResponse(null, 'Metode pembayaran berhasil dihapus');
    }
}
