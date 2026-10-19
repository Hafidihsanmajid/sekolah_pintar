<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AttendanceSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'entry_time',
        'exit_time',
        'late_tolerance',
    ];

    protected $casts = [
        'late_tolerance' => 'integer',
    ];
}
