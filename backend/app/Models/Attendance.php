<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'date',
        'status',
        'notes',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
