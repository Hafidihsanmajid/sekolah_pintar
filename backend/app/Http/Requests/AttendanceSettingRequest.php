<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AttendanceSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $mergeData = [];

        if ($this->has('entryTime')) {
            $mergeData['entry_time'] = $this->input('entryTime');
        }

        if ($this->has('exitTime')) {
            $mergeData['exit_time'] = $this->input('exitTime');
        }

        if ($this->has('lateTolerance')) {
            $mergeData['late_tolerance'] = $this->input('lateTolerance');
        }

        if (!empty($mergeData)) {
            $this->merge($mergeData);
        }
    }

    public function rules(): array
    {
        return [
            'entry_time' => ['required', 'regex:/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/'],
            'exit_time' => ['required', 'regex:/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/'],
            'late_tolerance' => ['required', 'integer', 'min:0', 'max:240'],
        ];
    }

    public function messages(): array
    {
        return [
            'entry_time.required' => 'Jam masuk wajib diisi.',
            'entry_time.regex' => 'Format jam masuk harus HH:mm (contoh: 07:00).',
            'exit_time.required' => 'Jam pulang wajib diisi.',
            'exit_time.regex' => 'Format jam pulang harus HH:mm (contoh: 15:00).',
            'late_tolerance.required' => 'Batas toleransi keterlambatan wajib diisi.',
            'late_tolerance.integer' => 'Batas keterlambatan harus berupa angka menit.',
            'late_tolerance.min' => 'Batas keterlambatan minimal 0 menit.',
        ];
    }
}
