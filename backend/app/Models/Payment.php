<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_number',
        'student_id',
        'user_id',
        'payment_method_id',
        'total_amount',
        'payment_date',
        'status',
        'notes',
        'voided_at',
        'voided_by',
        'void_reason',
    ];

    protected $casts = [
        'total_amount' => 'integer',
        'payment_date' => 'datetime',
        'voided_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function voidedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'voided_by');
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    public function details(): HasMany
    {
        return $this->hasMany(PaymentDetail::class);
    }
}
