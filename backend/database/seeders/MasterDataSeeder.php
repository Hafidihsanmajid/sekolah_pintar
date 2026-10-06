<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\FeeCategory;
use App\Models\PaymentMethod;
use App\Models\Student;
use Illuminate\Database\Seeder;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Tahun Ajaran
        $academicYear2025 = AcademicYear::firstOrCreate(
            ['name' => '2025/2026', 'semester' => 'Ganjil'],
            ['is_active' => true]
        );

        AcademicYear::firstOrCreate(
            ['name' => '2024/2025', 'semester' => 'Genap'],
            ['is_active' => false]
        );

        // 2. Kelas
        $kelas10A = Classroom::firstOrCreate(
            ['name' => 'X-RPL 1', 'academic_year_id' => $academicYear2025->id],
            ['level' => '10']
        );

        $kelas10B = Classroom::firstOrCreate(
            ['name' => 'X-RPL 2', 'academic_year_id' => $academicYear2025->id],
            ['level' => '10']
        );

        $kelas11 = Classroom::firstOrCreate(
            ['name' => 'XI-RPL 1', 'academic_year_id' => $academicYear2025->id],
            ['level' => '11']
        );

        $kelas12 = Classroom::firstOrCreate(
            ['name' => 'XII-RPL 1', 'academic_year_id' => $academicYear2025->id],
            ['level' => '12']
        );

        // 3. Kategori Biaya
        FeeCategory::firstOrCreate(
            ['name' => 'SPP Bulanan'],
            [
                'type' => 'monthly',
                'default_amount' => 350000,
                'description' => 'Iuran bulanan operasional pendidikan siswa',
                'is_active' => true,
            ]
        );

        FeeCategory::firstOrCreate(
            ['name' => 'Uang Gedung & Sarpras'],
            [
                'type' => 'incidental',
                'default_amount' => 1500000,
                'description' => 'Biaya sarana dan prasarana pembangunan awal masuk',
                'is_active' => true,
            ]
        );

        FeeCategory::firstOrCreate(
            ['name' => 'Biaya Praktikum Lab'],
            [
                'type' => 'incidental',
                'default_amount' => 200000,
                'description' => 'Pemeliharaan perangkat lunak & jaringan lab komputer',
                'is_active' => true,
            ]
        );

        FeeCategory::firstOrCreate(
            ['name' => 'Ujian Akhir Semester'],
            [
                'type' => 'incidental',
                'default_amount' => 150000,
                'description' => 'Pengadaan soal dan administrasi penilaian akhir semester',
                'is_active' => true,
            ]
        );

        // 4. Metode Pembayaran
        PaymentMethod::firstOrCreate(
            ['name' => 'Tunai di Kasir TU'],
            [
                'type' => 'cash',
                'account_number' => null,
                'account_holder' => null,
                'is_active' => true,
            ]
        );

        PaymentMethod::firstOrCreate(
            ['name' => 'Transfer Bank BRI'],
            [
                'type' => 'transfer',
                'account_number' => '0123-01-000123-50-8',
                'account_holder' => 'SMK Pintar Bangsa',
                'is_active' => true,
            ]
        );

        PaymentMethod::firstOrCreate(
            ['name' => 'Transfer Bank BCA'],
            [
                'type' => 'transfer',
                'account_number' => '8830192831',
                'account_holder' => 'Yayasan Sekolah Pintar',
                'is_active' => true,
            ]
        );

        // 5. Data Siswa
        $sampleStudents = [
            [
                'nis' => '20251001',
                'nisn' => '0071234501',
                'name' => 'Ahmad Fauzan',
                'classroom_id' => $kelas10A->id,
                'entry_year' => '2025',
                'is_active' => true,
                'phone_number' => '081234567890',
                'address' => 'Jl. Merdeka No. 10, Jakarta Selatan',
            ],
            [
                'nis' => '20251002',
                'nisn' => '0071234502',
                'name' => 'Budi Santoso',
                'classroom_id' => $kelas10A->id,
                'entry_year' => '2025',
                'is_active' => true,
                'phone_number' => '081234567891',
                'address' => 'Jl. Melati No. 4, Jakarta Selatan',
            ],
            [
                'nis' => '20251003',
                'nisn' => '0071234503',
                'name' => 'Citra Dewi Permata',
                'classroom_id' => $kelas10B->id,
                'entry_year' => '2025',
                'is_active' => true,
                'phone_number' => '081234567892',
                'address' => 'Jl. Mawar No. 12, Tangerang',
            ],
            [
                'nis' => '20251004',
                'nisn' => '0071234504',
                'name' => 'Dimas Pratama',
                'classroom_id' => $kelas10B->id,
                'entry_year' => '2025',
                'is_active' => true,
                'phone_number' => '081234567893',
                'address' => 'Jl. Kenanga No. 7, Depok',
            ],
            [
                'nis' => '20241001',
                'nisn' => '0061234501',
                'name' => 'Eka Putri Rahayu',
                'classroom_id' => $kelas11->id,
                'entry_year' => '2024',
                'is_active' => true,
                'phone_number' => '081234567894',
                'address' => 'Jl. Anggrek No. 15, Bekasi',
            ],
            [
                'nis' => '20231001',
                'nisn' => '0051234501',
                'name' => 'Fajar Nugroho',
                'classroom_id' => $kelas12->id,
                'entry_year' => '2023',
                'is_active' => true,
                'phone_number' => '081234567895',
                'address' => 'Jl. Cempaka No. 8, Jakarta Timur',
            ],
        ];

        foreach ($sampleStudents as $studentData) {
            Student::firstOrCreate(['nis' => $studentData['nis']], $studentData);
        }
    }
}
