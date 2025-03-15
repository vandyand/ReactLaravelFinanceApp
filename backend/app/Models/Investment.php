<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Investment extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'account_id',
        'name',
        'symbol',
        'type',
        'purchase_price',
        'current_price',
        'quantity',
        'purchase_date',
        'sell_date',
        'sell_price',
        'currency',
        'notes',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'purchase_price' => 'decimal:2',
        'current_price' => 'decimal:2',
        'quantity' => 'decimal:6',
        'sell_price' => 'decimal:2',
        'purchase_date' => 'date',
        'sell_date' => 'date',
    ];

    /**
     * Get the user that owns the investment.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the account that the investment belongs to.
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Calculate the current value of the investment.
     *
     * @return float
     */
    public function getCurrentValue()
    {
        return $this->current_price * $this->quantity;
    }

    /**
     * Calculate the profit or loss of the investment.
     *
     * @return float
     */
    public function getProfitLoss()
    {
        return ($this->current_price - $this->purchase_price) * $this->quantity;
    }

    /**
     * Calculate the profit or loss percentage of the investment.
     *
     * @return float
     */
    public function getProfitLossPercentage()
    {
        if ($this->purchase_price == 0) {
            return 0;
        }

        return (($this->current_price - $this->purchase_price) / $this->purchase_price) * 100;
    }
}
