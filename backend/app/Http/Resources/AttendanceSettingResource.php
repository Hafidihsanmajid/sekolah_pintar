<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceSettingResource extends JsonResource
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
            'entryTime' => $this->entry_time ? substr((string) $this->entry_time, 0, 5) : '07:00',
            'exitTime' => $this->exit_time ? substr((string) $this->exit_time, 0, 5) : '15:00',
            'lateTolerance' => (int) $this->late_tolerance,
            'updatedAt' => $this->updated_at?->toISOString(),
        ];
    }
}
