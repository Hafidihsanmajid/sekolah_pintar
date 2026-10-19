<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BatchAttendanceRequest extends FormRequest
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

        if ($this->has('items') && is_array($this->input('items'))) {
            $transformedItems = [];
            foreach ($this->input('items') as $item) {
                $transformedItems[] = [
                    'student_id' => $item['studentId'] ?? $item['student_id'] ?? null,
                    'status' => strtolower((string) ($item['status'] ?? 'hadir')),
                    'notes' => $item['notes'] ?? null,
                ];
            }
            $mergeData['items'] = $transformedItems;
        }

        if (!empty($mergeData)) {
            $this->merge($mergeData);
        }
    }

    public function rules(): array
    {
        return [
            'date' => ['required', 'date_format:Y-m-d'],
            'classroom_id' => ['required', 'exists:classrooms,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.student_id' => ['required', 'exists:students,id'],
            'items.*.status' => ['required', 'in:hadir,sakit,izin,alpa,terlambat'],
            'items.*.notes' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'date.required' => 'Tanggal absensi wajib diisi.',
            'date.date_format' => 'Format tanggal harus YYYY-MM-DD.',
            'classroom_id.required' => 'Kelas wajib dipilih.',
            'classroom_id.exists' => 'Kelas yang dipilih tidak valid.',
            'items.required' => 'Daftar absensi siswa tidak boleh kosong.',
            'items.min' => 'Minimal harus terdapat 1 data absensi siswa.',
            'items.*.student_id.required' => 'ID Siswa wajib disertakan.',
            'items.*.student_id.exists' => 'Data siswa tidak valid.',
            'items.*.status.required' => 'Status kehadiran siswa wajib diisi.',
            'items.*.status.in' => 'Status kehadiran harus salah satu dari: hadir, sakit, izin, alpa, terlambat.',
        ];
    }
}
