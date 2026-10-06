<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleAndUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Buat Roles
        $superAdminRole = Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
        $adminTuRole = Role::firstOrCreate(['name' => 'admin_tu', 'guard_name' => 'web']);
        $kepalaSekolahRole = Role::firstOrCreate(['name' => 'kepala_sekolah', 'guard_name' => 'web']);

        // 2. Buat Default Users
        $superAdmin = User::firstOrCreate(
            ['email' => 'superadmin@sekolah.sch.id'],
            [
                'name' => 'Super Administrator',
                'password' => Hash::make('password123'),
            ]
        );
        $superAdmin->assignRole($superAdminRole);

        $adminTu = User::firstOrCreate(
            ['email' => 'tu@sekolah.sch.id'],
            [
                'name' => 'Staf Tata Usaha',
                'password' => Hash::make('password123'),
            ]
        );
        $adminTu->assignRole($adminTuRole);

        $kepalaSekolah = User::firstOrCreate(
            ['email' => 'kepsek@sekolah.sch.id'],
            [
                'name' => 'Kepala Sekolah',
                'password' => Hash::make('password123'),
            ]
        );
        $kepalaSekolah->assignRole($kepalaSekolahRole);
    }
}
