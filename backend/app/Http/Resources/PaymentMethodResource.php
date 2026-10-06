<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentMethodResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type,
            'accountNumber' => $this->account_number,
            'accountHolder' => $this->account_holder,
            'isActive' => (bool) $this->is_active,
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
