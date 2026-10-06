<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GenerateBillRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $mergeData = [];
        if ($this->has('academicYearId')) {
            $mergeData['academic_year_id'] = $this->input('academicYearId');
        }
        if ($this->has('feeCategoryId')) {
            $mergeData['fee_category_id'] = $this->input('feeCategoryId');
        }
        if ($this->has('classroomId')) {
            $mergeData['classroom_id'] = $this->input('classroomId');
        }
        if ($this->has('dueDate')) {
            $mergeData['due_date'] = $this->input('dueDate');
        }
        if (!empty($mergeData)) {
            $this->merge($mergeData);
        }
    }

    public function rules(): array
    {
        return [
            'academic_year_id' => ['required', 'exists:academic_years,id'],
            'fee_category_id' => ['required', 'exists:fee_categories,id'],
            'classroom_id' => ['nullable', 'exists:classrooms,id'], // Kosong = seluruh kelas
            'amount' => ['nullable', 'integer', 'min:1'], // Jika kosong, pakai defaultAmount dari fee_categories
            'months' => ['nullable', 'array'], // Array bulan: [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6] untuk SPP
            'months.*' => ['integer', 'between:1,12'],
            'year' => ['nullable', 'integer'],
            'due_date' => ['nullable', 'date'],
        ];
    }
}
