<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class KioskAttendanceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nis' => ['required', 'string', 'max:50'],
        ];
    }

    /**
     * Custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nis.required' => 'Nomor Induk Siswa (NIS) wajib diisi.',
            'nis.string' => 'Format NIS harus berupa teks/angka yang valid.',
            'nis.max' => 'NIS maksimal 50 karakter.',
        ];
    }
}
