<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AttendanceSettingRequest;
use App\Http\Resources\AttendanceSettingResource;
use App\Models\AttendanceSetting;
use Illuminate\Http\JsonResponse;

class AttendanceSettingController extends Controller
{
    /**
     * Ambil konfigurasi parameter absensi sekolah
     */
    public function show(): JsonResponse
    {
        $setting = AttendanceSetting::firstOrCreate(
            ['id' => 1],
            [
                'entry_time' => '07:00:00',
                'exit_time' => '15:00:00',
                'late_tolerance' => 15,
            ]
        );

        return $this->successResponse(
            new AttendanceSettingResource($setting),
            'Konfigurasi absensi berhasil diambil'
        );
    }

    /**
     * Perbarui konfigurasi parameter absensi sekolah
     */
    public function update(AttendanceSettingRequest $request): JsonResponse
    {
        $setting = AttendanceSetting::firstOrCreate(
            ['id' => 1],
            [
                'entry_time' => '07:00:00',
                'exit_time' => '15:00:00',
                'late_tolerance' => 15,
            ]
        );

        $setting->update([
            'entry_time' => $request->input('entry_time'),
            'exit_time' => $request->input('exit_time'),
            'late_tolerance' => $request->input('late_tolerance'),
        ]);

        return $this->successResponse(
            new AttendanceSettingResource($setting),
            'Konfigurasi absensi berhasil diperbarui'
        );
    }
}
