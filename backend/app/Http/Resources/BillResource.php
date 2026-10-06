<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BillResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'studentId' => $this->student_id,
            'studentName' => $this->student?->name,
            'studentNis' => $this->student?->nis,
            'classroomName' => $this->student?->classroom?->name,
            'feeCategoryId' => $this->fee_category_id,
            'feeCategoryName' => $this->feeCategory?->name,
            'feeCategoryType' => $this->feeCategory?->type,
            'academicYearId' => $this->academic_year_id,
            'academicYearName' => $this->academicYear?->name,
            'title' => $this->title,
            'month' => $this->month,
            'year' => $this->year,
            'amount' => (int) $this->amount,
            'paidAmount' => (int) $this->paid_amount,
            'remainingAmount' => (int) ($this->amount - $this->paid_amount),
            'status' => $this->status,
            'dueDate' => $this->due_date?->format('Y-m-d'),
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
