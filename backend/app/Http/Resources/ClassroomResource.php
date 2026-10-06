<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClassroomResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'academicYearId' => $this->academic_year_id,
            'academicYearName' => $this->academicYear?->name,
            'name' => $this->name,
            'level' => $this->level,
            'studentsCount' => $this->whenCounted('students'),
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
