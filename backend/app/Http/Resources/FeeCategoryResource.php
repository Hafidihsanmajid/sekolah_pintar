<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FeeCategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type,
            'defaultAmount' => (int) $this->default_amount,
            'description' => $this->description,
            'isActive' => (bool) $this->is_active,
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
