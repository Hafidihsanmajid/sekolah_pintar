<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $mergeData = [];
        if ($this->has('classroomId')) {
            $mergeData['classroom_id'] = $this->input('classroomId');
        }
        if ($this->has('entryYear')) {
            $mergeData['entry_year'] = $this->input('entryYear');
        }
        if ($this->has('phoneNumber')) {
            $mergeData['phone_number'] = $this->input('phoneNumber');
        }
        if ($this->has('isActive')) {
            $mergeData['is_active'] = $this->boolean('isActive');
        }

        if (!empty($mergeData)) {
            $this->merge($mergeData);
        }
    }

    public function rules(): array
    {
        $studentId = $this->route('student') ? $this->route('student')->id : null;

        return [
            'nis' => ['required', 'string', 'max:30', Rule::unique('students', 'nis')->ignore($studentId)],
            'nisn' => ['nullable', 'string', 'max:30', Rule::unique('students', 'nisn')->ignore($studentId)],
            'name' => ['required', 'string', 'max:150'],
            'classroom_id' => ['required', 'exists:classrooms,id'],
            'entry_year' => ['required', 'string', 'max:10'],
            'is_active' => ['nullable', 'boolean'],
            'phone_number' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string'],
        ];
    }
}
