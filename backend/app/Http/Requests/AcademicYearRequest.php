<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AcademicYearRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('isActive')) {
            $this->merge(['is_active' => $this->boolean('isActive')]);
        }

        if (!$this->filled('semester')) {
            $this->merge(['semester' => 'Ganjil']);
        }
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:50'],
            'semester' => ['nullable', 'string', 'max:20'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
