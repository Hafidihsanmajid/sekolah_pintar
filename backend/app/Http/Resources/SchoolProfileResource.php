<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SchoolProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'address' => $this->address,
            'phone' => $this->phone,
            'email' => $this->email,
            'principalName' => $this->principal_name,
            'treasurerName' => $this->treasurer_name,
            'updatedAt' => $this->updated_at?->toISOString(),
        ];
    }
}
