<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'studentId' => $this->student_id,
            'studentName' => $this->student?->name,
            'studentNis' => $this->student?->nis,
            'studentNisn' => $this->student?->nisn,
            'classroomId' => $this->student?->classroom_id,
            'classroomName' => $this->student?->classroom?->name,
            'classroomLevel' => $this->student?->classroom?->level,
            'date' => $this->date instanceof \DateTimeInterface ? $this->date->format('Y-m-d') : (string) $this->date,
            'status' => $this->status,
            'notes' => $this->notes,
            'createdAt' => $this->created_at?->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString(),
        ];
    }
}
