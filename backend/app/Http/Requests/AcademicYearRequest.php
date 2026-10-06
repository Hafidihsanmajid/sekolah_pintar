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
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:50'],
            'semester' => ['required', 'string', 'in:Ganjil,Genap'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
