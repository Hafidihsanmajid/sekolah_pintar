<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FeeCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'default_amount',
        'due_date',
        'description',
        'is_active',
    ];

    protected $casts = [
        'default_amount' => 'integer',
        'due_date' => 'date',
        'is_active' => 'boolean',
    ];
}
