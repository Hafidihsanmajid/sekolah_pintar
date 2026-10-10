<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SchoolProfileResource;
use App\Http\Resources\UserResource;
use App\Models\SchoolProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class SettingController extends Controller
{
    /**
     * Ambil profil sekolah untuk identitas sistem & kuitansi
     */
    public function getProfile(): JsonResponse
    {
        $profile = SchoolProfile::firstOrCreate(
            ['id' => 1],
            [
                'name' => 'SMK Pintar Bangsa',
                'address' => 'Jl. Pendidikan No. 45, Kebayoran Baru, Jakarta Selatan',
                'phone' => '021-7890123',
                'email' => 'info@sekolahpintar.sch.id',
                'principal_name' => 'Dr. H. Muhammad Arifin, M.Pd.',
                'treasurer_name' => 'Siti Rahmawati, S.E.',
            ]
        );

        return $this->successResponse(
            new SchoolProfileResource($profile),
            'Profil sekolah berhasil diambil'
        );
    }

    /**
     * Perbarui profil sekolah
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'address' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:100'],
            'principalName' => ['nullable', 'string', 'max:150'],
            'treasurerName' => ['nullable', 'string', 'max:150'],
        ]);

        $profile = SchoolProfile::firstOrCreate(['id' => 1], ['name' => $validated['name']]);
        $profile->update([
            'name' => $validated['name'],
            'address' => $validated['address'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
            'principal_name' => $validated['principalName'] ?? null,
            'treasurer_name' => $validated['treasurerName'] ?? null,
        ]);

        return $this->successResponse(
            new SchoolProfileResource($profile),
            'Profil sekolah berhasil diperbarui'
        );
    }

    /**
     * Ganti kata sandi akun pengguna saat ini
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'currentPassword' => ['required', 'string'],
            'newPassword' => ['required', 'string', 'min:6'],
        ]);

        $user = $request->user();

        if (! Hash::check($request->input('currentPassword'), $user->password)) {
            return $this->errorResponse('Kata sandi saat ini tidak cocok', [
                'currentPassword' => ['Kata sandi saat ini salah.'],
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->input('newPassword')),
        ]);

        return $this->successResponse(null, 'Kata sandi berhasil diperbarui');
    }

    /**
     * Manajemen Pengguna (Super Admin Only)
     */
    public function getUsers(): JsonResponse
    {
        $users = User::with('roles')->orderBy('id', 'asc')->get();

        return $this->successResponse(
            UserResource::collection($users),
            'Daftar pengguna sistem berhasil diambil'
        );
    }

    public function createUser(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'string', 'email', 'max:150', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['required', 'string', 'max:50'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        $role = Role::firstOrCreate(['name' => $validated['role'], 'guard_name' => 'web']);
        $user->assignRole($role);
        $user->load('roles');

        return $this->successResponse(
            new UserResource($user),
            'Pengguna baru berhasil dibuat',
            201
        );
    }

    public function updateUser(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'string', 'email', 'max:150', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:6'],
            'role' => ['required', 'string', 'max:50'],
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);
        $role = Role::firstOrCreate(['name' => $validated['role'], 'guard_name' => 'web']);
        $user->syncRoles([$role]);
        $user->load('roles');

        return $this->successResponse(
            new UserResource($user),
            'Data pengguna berhasil diperbarui'
        );
    }

    public function deleteUser(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return $this->errorResponse('Tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan', [], 422);
        }

        $user->delete();

        return $this->successResponse(null, 'Pengguna berhasil dihapus');
    }
}
