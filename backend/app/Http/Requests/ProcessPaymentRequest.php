<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProcessPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $mergeData = [];
        if ($this->has('studentId')) {
            $mergeData['student_id'] = $this->input('studentId');
        }
        if ($this->has('paymentMethodId')) {
            $mergeData['payment_method_id'] = $this->input('paymentMethodId');
        }
        if ($this->has('items') && is_array($this->input('items'))) {
            $items = array_map(function ($item) {
                return [
                    'bill_id' => $item['billId'] ?? $item['bill_id'] ?? null,
                    'amount' => $item['amount'] ?? 0,
                ];
            }, $this->input('items'));
            $mergeData['items'] = $items;
        }

        if (!empty($mergeData)) {
            $this->merge($mergeData);
        }
    }

    public function rules(): array
    {
        return [
            'student_id' => ['required', 'exists:students,id'],
            'payment_method_id' => ['required', 'exists:payment_methods,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.bill_id' => ['required', 'exists:bills,id'],
            'items.*.amount' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
