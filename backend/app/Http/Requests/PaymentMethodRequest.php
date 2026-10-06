<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PaymentMethodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $mergeData = [];
        if ($this->has('accountNumber')) {
            $mergeData['account_number'] = $this->input('accountNumber');
        }
        if ($this->has('accountHolder')) {
            $mergeData['account_holder'] = $this->input('accountHolder');
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
            'type' => ['required', 'string', 'in:cash,transfer'],
            'account_number' => ['nullable', 'string', 'max:50'],
            'account_holder' => ['nullable', 'string', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
