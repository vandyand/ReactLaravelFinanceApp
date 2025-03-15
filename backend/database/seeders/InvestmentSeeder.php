<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Account;
use App\Models\Investment;
use Carbon\Carbon;

class InvestmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::all();

        foreach ($users as $user) {
            // Get investment accounts for this user
            $investmentAccounts = Account::where('user_id', $user->id)
                ->where('type', 'investment')
                ->get();

            if ($investmentAccounts->isEmpty()) {
                continue;
            }

            // Create different types of investments
            foreach ($investmentAccounts as $account) {
                $this->createInvestmentsForAccount($user, $account);
            }
        }
    }

    /**
     * Create investments for a specific account
     */
    private function createInvestmentsForAccount($user, $account)
    {
        // Different investment types based on the account name
        if (str_contains($account->name, '401(k)') || str_contains($account->name, 'IRA')) {
            $this->createRetirementInvestments($user, $account);
        } elseif (str_contains($account->name, 'Brokerage')) {
            $this->createBrokerageInvestments($user, $account);
        } elseif (str_contains($account->name, 'Crypto')) {
            $this->createCryptoInvestments($user, $account);
        } else {
            // Generic investments for any other type
            $this->createMixedInvestments($user, $account);
        }
    }

    /**
     * Create retirement account investments (401k, IRA)
     */
    private function createRetirementInvestments($user, $account)
    {
        // Common retirement funds
        $retirementFunds = [
            [
                'name' => 'Target Date 2040 Fund',
                'symbol' => 'TRRDX',
                'type' => 'mutual_fund',
                'price_range' => [20, 40],
                'quantity_range' => [50, 500],
                'date_range' => [6, 60], // Months ago
                'growth_rate' => [5, 15], // Annual percentage
            ],
            [
                'name' => 'S&P 500 Index Fund',
                'symbol' => 'VFIAX',
                'type' => 'mutual_fund',
                'price_range' => [250, 400],
                'quantity_range' => [10, 100],
                'date_range' => [12, 84],
                'growth_rate' => [8, 20],
            ],
            [
                'name' => 'Total Bond Market Index Fund',
                'symbol' => 'VBTLX',
                'type' => 'mutual_fund',
                'price_range' => [10, 15],
                'quantity_range' => [100, 1000],
                'date_range' => [24, 120],
                'growth_rate' => [2, 6],
            ],
            [
                'name' => 'International Growth Fund',
                'symbol' => 'VWIGX',
                'type' => 'mutual_fund',
                'price_range' => [30, 50],
                'quantity_range' => [20, 200],
                'date_range' => [18, 96],
                'growth_rate' => [4, 18],
            ],
            [
                'name' => 'Small-Cap Index Fund',
                'symbol' => 'VSMAX',
                'type' => 'mutual_fund',
                'price_range' => [60, 100],
                'quantity_range' => [10, 100],
                'date_range' => [24, 108],
                'growth_rate' => [6, 22],
            ],
        ];

        // Number of funds to include (3-5 for retirement accounts)
        $numFunds = rand(3, 5);
        $selectedFunds = array_slice($retirementFunds, 0, $numFunds);

        foreach ($selectedFunds as $fund) {
            $this->createInvestment($user, $account, $fund);
        }
    }

    /**
     * Create brokerage account investments (stocks, ETFs)
     */
    private function createBrokerageInvestments($user, $account)
    {
        // Common stocks and ETFs
        $stocks = [
            [
                'name' => 'Apple Inc.',
                'symbol' => 'AAPL',
                'type' => 'stock',
                'price_range' => [130, 190],
                'quantity_range' => [5, 50],
                'date_range' => [1, 36],
                'growth_rate' => [10, 40],
            ],
            [
                'name' => 'Microsoft Corporation',
                'symbol' => 'MSFT',
                'type' => 'stock',
                'price_range' => [250, 350],
                'quantity_range' => [2, 30],
                'date_range' => [3, 48],
                'growth_rate' => [15, 45],
            ],
            [
                'name' => 'Amazon.com Inc.',
                'symbol' => 'AMZN',
                'type' => 'stock',
                'price_range' => [100, 180],
                'quantity_range' => [5, 40],
                'date_range' => [6, 60],
                'growth_rate' => [5, 50],
            ],
            [
                'name' => 'Tesla Inc.',
                'symbol' => 'TSLA',
                'type' => 'stock',
                'price_range' => [150, 300],
                'quantity_range' => [2, 20],
                'date_range' => [3, 36],
                'growth_rate' => [-10, 100], // Can be negative or very positive
            ],
            [
                'name' => 'Vanguard Total Stock Market ETF',
                'symbol' => 'VTI',
                'type' => 'etf',
                'price_range' => [180, 240],
                'quantity_range' => [5, 50],
                'date_range' => [12, 72],
                'growth_rate' => [8, 20],
            ],
            [
                'name' => 'SPDR S&P 500 ETF',
                'symbol' => 'SPY',
                'type' => 'etf',
                'price_range' => [350, 450],
                'quantity_range' => [2, 30],
                'date_range' => [12, 84],
                'growth_rate' => [5, 25],
            ],
            [
                'name' => 'Invesco QQQ Trust',
                'symbol' => 'QQQ',
                'type' => 'etf',
                'price_range' => [300, 400],
                'quantity_range' => [2, 25],
                'date_range' => [6, 60],
                'growth_rate' => [10, 35],
            ],
            [
                'name' => 'Alphabet Inc.',
                'symbol' => 'GOOGL',
                'type' => 'stock',
                'price_range' => [90, 150],
                'quantity_range' => [5, 30],
                'date_range' => [6, 48],
                'growth_rate' => [5, 30],
            ],
            [
                'name' => 'Meta Platforms Inc.',
                'symbol' => 'META',
                'type' => 'stock',
                'price_range' => [150, 350],
                'quantity_range' => [3, 25],
                'date_range' => [3, 36],
                'growth_rate' => [-20, 80], // Has had volatile performance
            ],
            [
                'name' => 'NVIDIA Corporation',
                'symbol' => 'NVDA',
                'type' => 'stock',
                'price_range' => [150, 450],
                'quantity_range' => [2, 20],
                'date_range' => [6, 48],
                'growth_rate' => [20, 150], // High growth potential
            ],
        ];

        // Number of investments to include (4-10 for brokerage accounts)
        $numInvestments = rand(4, 10);
        shuffle($stocks);
        $selectedStocks = array_slice($stocks, 0, $numInvestments);

        foreach ($selectedStocks as $stock) {
            $this->createInvestment($user, $account, $stock);
        }
    }

    /**
     * Create cryptocurrency investments
     */
    private function createCryptoInvestments($user, $account)
    {
        // Common cryptocurrencies
        $cryptos = [
            [
                'name' => 'Bitcoin',
                'symbol' => 'BTC',
                'type' => 'cryptocurrency',
                'price_range' => [20000, 60000],
                'quantity_range' => [0.1, 2],
                'date_range' => [1, 48],
                'growth_rate' => [-30, 200], // Highly volatile
            ],
            [
                'name' => 'Ethereum',
                'symbol' => 'ETH',
                'type' => 'cryptocurrency',
                'price_range' => [1500, 4000],
                'quantity_range' => [1, 10],
                'date_range' => [1, 36],
                'growth_rate' => [-25, 180],
            ],
            [
                'name' => 'Solana',
                'symbol' => 'SOL',
                'type' => 'cryptocurrency',
                'price_range' => [20, 100],
                'quantity_range' => [5, 50],
                'date_range' => [1, 24],
                'growth_rate' => [-40, 250],
            ],
            [
                'name' => 'Cardano',
                'symbol' => 'ADA',
                'type' => 'cryptocurrency',
                'price_range' => [0.3, 1.5],
                'quantity_range' => [1000, 10000],
                'date_range' => [3, 36],
                'growth_rate' => [-50, 300],
            ],
            [
                'name' => 'Binance Coin',
                'symbol' => 'BNB',
                'type' => 'cryptocurrency',
                'price_range' => [200, 500],
                'quantity_range' => [1, 20],
                'date_range' => [3, 36],
                'growth_rate' => [-20, 150],
            ],
            [
                'name' => 'Polygon',
                'symbol' => 'MATIC',
                'type' => 'cryptocurrency',
                'price_range' => [0.5, 2],
                'quantity_range' => [500, 5000],
                'date_range' => [1, 24],
                'growth_rate' => [-60, 400],
            ],
        ];

        // Number of cryptos to include (2-5 for crypto accounts)
        $numCryptos = rand(2, 5);
        shuffle($cryptos);
        $selectedCryptos = array_slice($cryptos, 0, $numCryptos);

        foreach ($selectedCryptos as $crypto) {
            $this->createInvestment($user, $account, $crypto);
        }
    }

    /**
     * Create mixed investments for generic investment accounts
     */
    private function createMixedInvestments($user, $account)
    {
        // Choose a mix of different investment types
        $allInvestments = [
            // A few stocks
            [
                'name' => 'Apple Inc.',
                'symbol' => 'AAPL',
                'type' => 'stock',
                'price_range' => [130, 190],
                'quantity_range' => [5, 50],
                'date_range' => [1, 36],
                'growth_rate' => [10, 40],
            ],
            [
                'name' => 'Microsoft Corporation',
                'symbol' => 'MSFT',
                'type' => 'stock',
                'price_range' => [250, 350],
                'quantity_range' => [2, 30],
                'date_range' => [3, 48],
                'growth_rate' => [15, 45],
            ],
            // A few ETFs
            [
                'name' => 'Vanguard Total Stock Market ETF',
                'symbol' => 'VTI',
                'type' => 'etf',
                'price_range' => [180, 240],
                'quantity_range' => [5, 50],
                'date_range' => [12, 72],
                'growth_rate' => [8, 20],
            ],
            [
                'name' => 'SPDR S&P 500 ETF',
                'symbol' => 'SPY',
                'type' => 'etf',
                'price_range' => [350, 450],
                'quantity_range' => [2, 30],
                'date_range' => [12, 84],
                'growth_rate' => [5, 25],
            ],
            // A mutual fund
            [
                'name' => 'Fidelity Contrafund',
                'symbol' => 'FCNTX',
                'type' => 'mutual_fund',
                'price_range' => [12, 18],
                'quantity_range' => [10, 100],
                'date_range' => [24, 96],
                'growth_rate' => [7, 15],
            ],
        ];

        // Number of investments to include (3-6 for mixed accounts)
        $numInvestments = rand(3, 6);
        shuffle($allInvestments);
        $selectedInvestments = array_slice($allInvestments, 0, $numInvestments);

        foreach ($selectedInvestments as $investment) {
            $this->createInvestment($user, $account, $investment);
        }
    }

    /**
     * Create a single investment record
     */
    private function createInvestment($user, $account, $investmentData)
    {
        // Calculate purchase date
        $monthsAgo = rand($investmentData['date_range'][0], $investmentData['date_range'][1]);
        $purchaseDate = Carbon::now()->subMonths($monthsAgo);

        // Calculate purchase price
        $purchasePrice = fake()->randomFloat(2, $investmentData['price_range'][0], $investmentData['price_range'][1]);

        // Calculate current price based on growth rate
        $annualGrowthRate = fake()->randomFloat(2, $investmentData['growth_rate'][0], $investmentData['growth_rate'][1]) / 100;
        $timeInYears = $monthsAgo / 12;
        $cumulativeGrowthFactor = pow(1 + $annualGrowthRate, $timeInYears);
        $currentPrice = $purchasePrice * $cumulativeGrowthFactor;

        // Add some randomness to current price
        $currentPrice = $currentPrice * (0.9 + (fake()->randomFloat(2, 0, 0.2)));

        // Quantity
        $quantity = fake()->randomFloat(
            $investmentData['type'] === 'cryptocurrency' ? 6 : 2, // More decimal places for crypto
            $investmentData['quantity_range'][0],
            $investmentData['quantity_range'][1]
        );

        // Create the investment
        Investment::create([
            'user_id' => $user->id,
            'account_id' => $account->id,
            'name' => $investmentData['name'],
            'symbol' => $investmentData['symbol'],
            'type' => $investmentData['type'],
            'purchase_price' => $purchasePrice,
            'current_price' => $currentPrice,
            'quantity' => $quantity,
            'purchase_date' => $purchaseDate,
            'sell_date' => null, // Not sold yet
            'sell_price' => null,
            'currency' => 'USD',
            'notes' => 'Seeded investment',
        ]);

        // Some investments may be partially sold
        if (fake()->boolean(20)) { // 20% chance of partial sell
            $sellQuantity = $quantity * fake()->randomFloat(2, 0.1, 0.5); // Sell 10-50% of position
            $sellDate = Carbon::parse($purchaseDate)->addMonths(rand(1, $monthsAgo - 1)); // Sell sometime after purchase but before now

            // Calculate sell price based on time held and growth rate
            $timeHeldInYears = $sellDate->diffInDays($purchaseDate) / 365;
            $sellGrowthFactor = pow(1 + $annualGrowthRate, $timeHeldInYears);
            $sellPrice = $purchasePrice * $sellGrowthFactor;

            // Add some randomness to sell price
            $sellPrice = $sellPrice * (0.9 + (fake()->randomFloat(2, 0, 0.2)));

            Investment::create([
                'user_id' => $user->id,
                'account_id' => $account->id,
                'name' => $investmentData['name'],
                'symbol' => $investmentData['symbol'],
                'type' => $investmentData['type'],
                'purchase_price' => $purchasePrice,
                'current_price' => $sellPrice, // Use sell price as the current price for sold investments
                'quantity' => $sellQuantity,
                'purchase_date' => $purchaseDate,
                'sell_date' => $sellDate,
                'sell_price' => $sellPrice,
                'currency' => 'USD',
                'notes' => 'Partially sold position',
            ]);
        }
    }
}
