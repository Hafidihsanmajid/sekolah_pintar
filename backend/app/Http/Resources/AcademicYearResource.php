<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AcademicYearResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'semester' => $this->semester,
            'isActive' => (bool) $this->is_active,
            'classroomsCount' => $this->whenCounted('classrooms'),
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
