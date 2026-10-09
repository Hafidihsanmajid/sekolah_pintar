<?php

namespace Database\Seeders;

use App\Models\Classroom;
use App\Models\Student;
use Illuminate\Database\Seeder;

class StudentSeeder extends Seeder
{
    public function run(): void
    {
        $classrooms = Classroom::orderBy('id')->get();
        if ($classrooms->isEmpty()) {
            return;
        }

        $studentNames = [
            // Class 1 (X-IPA 1): 4 additional students (1 already exists)
            1 => [
                'Aditia Pratama',
                'Anisa Rahmawati',
                'Bagas Wicaksono',
                'Cantika Putri Lestari',
            ],
            // Class 2 (X-IPA 2)
            2 => [
                'Daffa Arya Nugraha',
                'Dea Amanda',
                'Dimas Setiawan',
                'Dinda Ayu Permata',
                'Erlangga Saputra',
            ],
            // Class 3 (X-IPA 3)
            3 => [
                'Fadhil Muhammad',
                'Farhan Ramadhan',
                'Fathir Alamsyah',
                'Febriani Kusuma',
                'Fitri Handayani',
            ],
            // Class 4 (X-IPS 1)
            4 => [
                'Galih Prakoso',
                'Gita Gutawa Putri',
                'Hafiz Kurniawan',
                'Hana Maulida',
                'Hendra Gunawan',
            ],
            // Class 5 (X-IPS 2)
            5 => [
                'Ihsan Maulana',
                'Indah Permatasari',
                'Irfan Hakim',
                'Intan Nuraini',
                'Jaka Tarub',
            ],
            // Class 6 (X-IPS 3)
            6 => [
                'Kevin Sanjaya',
                'Kiki Amelia',
                'Krisna Murti',
                'Laila Fitria',
                'Lucky Hakim',
            ],
            // Class 7 (XI-IPA 1)
            7 => [
                'Miftahul Huda',
                'Maya Safitri',
                'Muhammad Rizky',
                'Nabila Syakieb',
                'Nadya Arina',
            ],
            // Class 8 (XI-IPA 2)
            8 => [
                'Noval Ramadhan',
                'Nurul Hidayah',
                'Oktavian Pratama',
                'Olivia Zalianty',
                'Panji Gumilang',
            ],
            // Class 9 (XI-IPA 3)
            9 => [
                'Qori Sandioriva',
                'Raditya Dika',
                'Rafli Ahmad',
                'Raisa Andriana',
                'Rama Danu',
            ],
            // Class 10 (XI-IPS 1)
            10 => [
                'Rendy Pandugo',
                'Rina Nose',
                'Rizky Febian',
                'Rossa Roslaina',
                'Ryan D\'Masiv',
            ],
            // Class 11 (XI-IPS 2)
            11 => [
                'Safira Bella',
                'Salman Alfarisi',
                'Sandra Dewi',
                'Satria Baja Hitam',
                'Sekar Arum',
            ],
            // Class 12 (XI-IPS 3)
            12 => [
                'Sigit Purnomo',
                'Siti Badriah',
                'Surya Saputra',
                'Syafiq Riza',
                'Syahrini Fatimah',
            ],
            // Class 13 (XII-IPA 1)
            13 => [
                'Taufik Hidayat',
                'Tiara Andini',
                'Tommy Kurniawan',
                'Tri Utami',
                'Tulus Rusydi',
            ],
            // Class 14 (XII-IPA 2)
            14 => [
                'Umar Bakri',
                'Ussy Sulistiawaty',
                'Vidi Aldiano',
                'Vino Bastian',
                'Wika Salim',
            ],
            // Class 15 (XII-IPA 3)
            15 => [
                'Wisnu Wardhana',
                'Wulan Guritno',
                'Yahya Waloni',
                'Yasmine Wildblood',
                'Yoga Pratama',
            ],
            // Class 16 (XII-IPS 1)
            16 => [
                'Yudha Keling',
                'Yuni Shara',
                'Yusuf Mansur',
                'Zaskia Gotik',
                'Zikri Daulay',
            ],
            // Class 17 (XII-IPS 2)
            17 => [
                'Zora Vidyanata',
                'Zulfikar Akbar',
                'Adnan Maulana',
                'Agnes Monica',
                'Aldi Taher',
            ],
            // Class 18 (XII-IPS 3)
            18 => [
                'Aliando Syarief',
                'Amanda Manopo',
                'Andhika Pratama',
                'Angga Yunanda',
                'Anya Geraldine',
            ],
        ];

        $addresses = [
            'Jl. Pemuda No. 12, Semarang',
            'Jl. Pandanaran No. 45, Semarang',
            'Jl. Gajah Mada No. 88, Semarang',
            'Jl. Pahlawan No. 20, Semarang',
            'Jl. Majapahit No. 15, Semarang',
            'Jl. Brigjen Katamso No. 3, Semarang',
            'Jl. MT Haryono No. 56, Semarang',
            'Jl. Veteran No. 9, Semarang',
            'Jl. Dr. Cipto No. 102, Semarang',
            'Jl. Siliwangi No. 22, Semarang',
        ];

        $nisnCounter = 112346;

        foreach ($classrooms as $classroom) {
            $classId = $classroom->id;
            $names = $studentNames[$classId] ?? [];
            if (empty($names)) {
                continue;
            }

            $entryYear = match ($classroom->level) {
                '11' => '2025',
                '12' => '2024',
                default => '2026',
            };

            $existingCount = Student::where('classroom_id', $classId)->count();

            foreach ($names as $idx => $name) {
                $studentNumber = $existingCount + $idx + 1;
                $nis = sprintf('%s%02d%02d', $entryYear, $classId, $studentNumber);
                $nisn = sprintf('%010d', $nisnCounter++);
                $phone = sprintf('0812345%05d', $nisnCounter);
                $addr = $addresses[($classId + $idx) % count($addresses)];

                Student::firstOrCreate(
                    ['nis' => $nis],
                    [
                        'nisn' => $nisn,
                        'name' => $name,
                        'classroom_id' => $classId,
                        'entry_year' => $entryYear,
                        'is_active' => true,
                        'phone_number' => $phone,
                        'address' => $addr,
                    ]
                );
            }
        }
    }
}
