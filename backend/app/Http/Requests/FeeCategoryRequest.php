<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FeeCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $mergeData = [];
        if ($this->has('defaultAmount')) {
            $mergeData['default_amount'] = $this->input('defaultAmount');
        }
        if ($this->has('dueDate')) {
            $mergeData['due_date'] = $this->input('dueDate') ?: null;
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
        return [
            'name' => ['required', 'string', 'max:100'],
            'type' => ['required', 'string', 'in:monthly,incidental'],
            'level' => ['nullable', 'string', 'max:20'],
            'default_amount' => ['required', 'integer', 'min:0'],
            'due_date' => ['nullable', 'date'],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
