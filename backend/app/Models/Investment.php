<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

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

    /**
     * Calculate the annualized return of the investment.
     *
     * @return float
     */
    public function getAnnualReturn()
    {
        // Determine the ending date to use (sell date or current date)
        $endDate = $this->sell_date ?? Carbon::now();

        // Calculate the number of years (including partial years) the investment was/has been held
        $yearsHeld = $this->purchase_date->diffInDays($endDate) / 365;

        // If held for less than a day, return 0
        if ($yearsHeld < 0.003) {
            return 0;
        }

        // Use sell price if available, otherwise use current price
        $endPrice = $this->sell_price ?? $this->current_price;

        // Calculate the total return
        $totalReturn = ($endPrice - $this->purchase_price) / $this->purchase_price;

        // Calculate the annualized return using the formula: (1 + totalReturn)^(1/yearsHeld) - 1
        $annualReturn = (pow(1 + $totalReturn, 1 / $yearsHeld) - 1) * 100;

        return round($annualReturn, 2);
    }
}
