<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nis' => $this->nis,
            'nisn' => $this->nisn,
            'name' => $this->name,
            'classroomId' => $this->classroom_id,
            'classroomName' => $this->classroom?->name,
            'classroomLevel' => $this->classroom?->level,
            'academicYearId' => $this->classroom?->academic_year_id,
            'academicYearName' => $this->classroom?->academicYear?->name,
            'entryYear' => $this->entry_year,
            'isActive' => (bool) $this->is_active,
            'phoneNumber' => $this->phone_number,
            'address' => $this->address,
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
