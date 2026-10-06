<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoiceNumber' => $this->invoice_number,
            'studentId' => $this->student_id,
            'studentName' => $this->student?->name,
            'studentNis' => $this->student?->nis,
            'classroomName' => $this->student?->classroom?->name,
            'cashierId' => $this->user_id,
            'cashierName' => $this->cashier?->name,
            'paymentMethodId' => $this->payment_method_id,
            'paymentMethodName' => $this->paymentMethod?->name,
            'paymentMethodType' => $this->paymentMethod?->type,
            'totalAmount' => (int) $this->total_amount,
            'paymentDate' => $this->payment_date?->toISOString(),
            'status' => $this->status,
            'notes' => $this->notes,
            'voidedAt' => $this->voided_at?->toISOString(),
            'voidReason' => $this->void_reason,
            'details' => PaymentDetailResource::collection($this->whenLoaded('details')),
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
