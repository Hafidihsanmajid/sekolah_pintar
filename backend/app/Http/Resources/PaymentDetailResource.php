<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'billId' => $this->bill_id,
            'billTitle' => $this->bill?->title,
            'feeCategoryName' => $this->bill?->feeCategory?->name,
            'amount' => (int) $this->amount,
        ];
    }
}
