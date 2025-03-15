<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use Carbon\Carbon;

class TransactionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::all();
        $startDate = Carbon::now()->subMonths(6); // Start from 6 months ago
        $endDate = Carbon::now(); // Up to current date

        foreach ($users as $user) {
            // Get all accounts and categories for this user
            $accounts = Account::where('user_id', $user->id)->get();
            $expenseCategories = Category::where('user_id', $user->id)
                ->where('type', 'expense')
                ->whereNull('parent_id') // Only top-level categories
                ->get();
            $incomeCategories = Category::where('user_id', $user->id)
                ->where('type', 'income')
                ->get();

            // Skip if user has no accounts or categories
            if ($accounts->isEmpty() || $expenseCategories->isEmpty() || $incomeCategories->isEmpty()) {
                continue;
            }

            // For each month, create a set of transactions
            $currentDate = clone $startDate;

            while ($currentDate <= $endDate) {
                $this->createMonthlyTransactions($user, $accounts, $expenseCategories, $incomeCategories, $currentDate);
                $currentDate->addMonth();
            }
        }
    }

    /**
     * Create transactions for a specific month
     */
    private function createMonthlyTransactions($user, $accounts, $expenseCategories, $incomeCategories, Carbon $date)
    {
        $monthStart = clone $date->startOfMonth();
        $monthEnd = clone $date->copy()->endOfMonth();

        // Create income transactions (usually 1-3 per month)
        $this->createIncomeTransactions($user, $accounts, $incomeCategories, $monthStart, $monthEnd);

        // Create expense transactions (multiple per month)
        $this->createExpenseTransactions($user, $accounts, $expenseCategories, $monthStart, $monthEnd);
    }

    /**
     * Create income transactions for a month
     */
    private function createIncomeTransactions($user, $accounts, $incomeCategories, Carbon $monthStart, Carbon $monthEnd)
    {
        // Main income (salary) - around the 1st or 15th of the month
        $payday = fake()->randomElement([
            clone $monthStart->copy()->addDays(rand(0, 2)), // 1st-3rd of month
            clone $monthStart->copy()->addDays(14 + rand(0, 2)) // 15th-17th of month
        ]);

        // Choose a checking account for the salary
        $checkingAccounts = $accounts->filter(function ($account) {
            return $account->type === 'checking';
        });

        if ($checkingAccounts->isNotEmpty()) {
            $checkingAccount = $checkingAccounts->random();
            $salaryCategory = $incomeCategories->firstWhere('name', 'Salary');

            if (!$salaryCategory) {
                $salaryCategory = $incomeCategories->first();
            }

            $salaryAmount = fake()->randomFloat(2, 2500, 8000);

            // Create salary transaction
            Transaction::create([
                'user_id' => $user->id,
                'account_id' => $checkingAccount->id,
                'category_id' => $salaryCategory->id,
                'name' => 'Salary Deposit',
                'amount' => $salaryAmount,
                'type' => 'income',
                'status' => 'completed',
                'transaction_date' => $payday,
                'description' => 'Monthly salary payment',
            ]);

            // Potentially add a second income for some users (bonus, side gig, etc.)
            if (fake()->boolean(30)) { // 30% chance of additional income
                $secondIncomeCategory = $incomeCategories->filter(function ($category) use ($salaryCategory) {
                    return $category->id !== $salaryCategory->id;
                })->random();

                $secondIncomeAmount = fake()->randomFloat(2, 100, 1000);
                $secondIncomeDate = clone $monthStart->copy()->addDays(rand(5, 25));

                Transaction::create([
                    'user_id' => $user->id,
                    'account_id' => $checkingAccount->id,
                    'category_id' => $secondIncomeCategory->id,
                    'name' => $secondIncomeCategory->name . ' Income',
                    'amount' => $secondIncomeAmount,
                    'type' => 'income',
                    'status' => 'completed',
                    'transaction_date' => $secondIncomeDate,
                    'description' => 'Additional income from ' . $secondIncomeCategory->name,
                ]);
            }

            // Investment income for some users (dividends, interest)
            $investmentAccounts = $accounts->filter(function ($account) {
                return $account->type === 'investment';
            });

            if ($investmentAccounts->isNotEmpty() && fake()->boolean(40)) { // 40% chance of investment income
                $investmentAccount = $investmentAccounts->random();
                $investmentCategory = $incomeCategories->firstWhere('name', 'Investments');

                if (!$investmentCategory) {
                    $investmentCategory = $incomeCategories->first();
                }

                $investmentAmount = fake()->randomFloat(2, 10, 500);
                $investmentDate = clone $monthStart->copy()->addDays(rand(1, 28));

                Transaction::create([
                    'user_id' => $user->id,
                    'account_id' => $investmentAccount->id,
                    'category_id' => $investmentCategory->id,
                    'name' => 'Dividend Payment',
                    'amount' => $investmentAmount,
                    'type' => 'income',
                    'status' => 'completed',
                    'transaction_date' => $investmentDate,
                    'description' => 'Dividend or interest income',
                ]);
            }
        }
    }

    /**
     * Create expense transactions for a month
     */
    private function createExpenseTransactions($user, $accounts, $expenseCategories, Carbon $monthStart, Carbon $monthEnd)
    {
        // Choose accounts for expenses
        $checkingAccounts = $accounts->filter(function ($account) {
            return $account->type === 'checking';
        });

        $creditCardAccounts = $accounts->filter(function ($account) {
            return $account->type === 'credit_card';
        });

        if ($checkingAccounts->isEmpty() && $creditCardAccounts->isEmpty()) {
            return;
        }

        // Number of expense transactions to create
        $numTransactions = rand(20, 40); // 20-40 transactions per month

        for ($i = 0; $i < $numTransactions; $i++) {
            // Choose a random day in the month
            $transactionDate = clone $monthStart->copy()->addDays(rand(0, $monthEnd->day - 1));

            // Choose a random expense category
            $category = $expenseCategories->random();

            // Choose account type based on category and random factors
            $usesCreditCard = fake()->boolean(70); // 70% chance of using credit card if available

            if ($usesCreditCard && $creditCardAccounts->isNotEmpty()) {
                $account = $creditCardAccounts->random();
            } elseif ($checkingAccounts->isNotEmpty()) {
                $account = $checkingAccounts->random();
            } else {
                continue; // Skip if no suitable accounts
            }

            // Set amount based on category
            $amount = $this->getAmountForCategory($category->name);

            // Generate transaction name based on category
            $name = $this->getTransactionNameForCategory($category->name);

            // Create the transaction
            Transaction::create([
                'user_id' => $user->id,
                'account_id' => $account->id,
                'category_id' => $category->id,
                'name' => $name,
                'amount' => $amount,
                'type' => 'expense',
                'status' => 'completed',
                'transaction_date' => $transactionDate,
                'description' => 'Purchase from ' . $name,
            ]);
        }

        // Add recurring monthly expenses (bills, subscriptions, etc.)
        $this->createRecurringExpenses($user, $accounts, $expenseCategories, $monthStart);
    }

    /**
     * Create recurring expenses for a month
     */
    private function createRecurringExpenses($user, $accounts, $expenseCategories, Carbon $monthStart)
    {
        $checkingAccounts = $accounts->filter(function ($account) {
            return $account->type === 'checking';
        });

        if ($checkingAccounts->isEmpty()) {
            return;
        }

        $checkingAccount = $checkingAccounts->first();

        // Define recurring expenses
        $recurringExpenses = [
            [
                'category' => 'Housing',
                'name' => 'Rent/Mortgage Payment',
                'amount_range' => [800, 3000],
                'day_range' => [1, 5],
                'probability' => 90, // 90% of users have this expense
            ],
            [
                'category' => 'Utilities',
                'name' => 'Electricity Bill',
                'amount_range' => [50, 200],
                'day_range' => [5, 15],
                'probability' => 95,
            ],
            [
                'category' => 'Utilities',
                'name' => 'Water Bill',
                'amount_range' => [30, 120],
                'day_range' => [10, 20],
                'probability' => 90,
            ],
            [
                'category' => 'Utilities',
                'name' => 'Internet Service',
                'amount_range' => [40, 120],
                'day_range' => [15, 25],
                'probability' => 95,
            ],
            [
                'category' => 'Utilities',
                'name' => 'Phone Bill',
                'amount_range' => [50, 150],
                'day_range' => [10, 20],
                'probability' => 95,
            ],
            [
                'category' => 'Subscriptions',
                'name' => 'Streaming Service',
                'amount_range' => [10, 50],
                'day_range' => [5, 15],
                'probability' => 80,
            ],
            [
                'category' => 'Insurance',
                'name' => 'Car Insurance',
                'amount_range' => [75, 200],
                'day_range' => [5, 15],
                'probability' => 85,
            ],
            [
                'category' => 'Insurance',
                'name' => 'Health Insurance',
                'amount_range' => [100, 500],
                'day_range' => [1, 10],
                'probability' => 70,
            ],
            [
                'category' => 'Subscriptions',
                'name' => 'Gym Membership',
                'amount_range' => [20, 100],
                'day_range' => [1, 10],
                'probability' => 60,
            ],
        ];

        // Create each recurring expense
        foreach ($recurringExpenses as $expense) {
            if (fake()->boolean($expense['probability'])) {
                $category = $expenseCategories->firstWhere('name', $expense['category']);

                if (!$category) {
                    continue;
                }

                $day = rand($expense['day_range'][0], $expense['day_range'][1]);
                $date = clone $monthStart->copy()->addDays($day - 1); // -1 because days start at 1

                // Skip if day is beyond the end of month
                if ($date->month != $monthStart->month) {
                    continue;
                }

                $amount = fake()->randomFloat(2, $expense['amount_range'][0], $expense['amount_range'][1]);

                Transaction::create([
                    'user_id' => $user->id,
                    'account_id' => $checkingAccount->id,
                    'category_id' => $category->id,
                    'name' => $expense['name'],
                    'amount' => $amount,
                    'type' => 'expense',
                    'status' => 'completed',
                    'transaction_date' => $date,
                    'description' => 'Monthly payment for ' . $expense['name'],
                ]);
            }
        }

        // Create loan payments
        $loanAccounts = $accounts->filter(function ($account) {
            return $account->type === 'loan';
        });

        foreach ($loanAccounts as $loanAccount) {
            $paymentDate = clone $monthStart->copy()->addDays(rand(5, 15));

            // Calculate payment based on loan balance (roughly 1-2% of balance as payment)
            $paymentPercent = rand(10, 20) / 1000; // 0.01 to 0.02
            $payment = min(abs($loanAccount->balance) * $paymentPercent, 2000); // Cap at $2000
            $payment = max($payment, 50); // Minimum $50 payment

            $debtCategory = $expenseCategories->firstWhere('name', 'Debt Payments');
            if (!$debtCategory) {
                $debtCategory = $expenseCategories->first();
            }

            Transaction::create([
                'user_id' => $user->id,
                'account_id' => $loanAccount->id,
                'category_id' => $debtCategory->id,
                'name' => $loanAccount->name . ' Payment',
                'amount' => $payment,
                'type' => 'expense',
                'status' => 'completed',
                'transaction_date' => $paymentDate,
                'description' => 'Monthly payment for ' . $loanAccount->name,
            ]);
        }

        // Credit card payments
        $creditCards = $accounts->filter(function ($account) {
            return $account->type === 'credit_card';
        });

        foreach ($creditCards as $creditCard) {
            $paymentDate = clone $monthStart->copy()->addDays(rand(10, 20));

            // Pay either the full balance or a partial amount
            $fullPayment = fake()->boolean(70);
            $minPayment = abs($creditCard->balance) * 0.03; // 3% of balance

            $payment = $fullPayment ? abs($creditCard->balance) : max($minPayment, 25);
            $payment = min($payment, abs($creditCard->balance)); // Don't pay more than owed

            // Only create payment if there's a balance to pay
            if ($payment > 0 && $checkingAccounts->isNotEmpty()) {
                $debtCategory = $expenseCategories->firstWhere('name', 'Debt Payments');
                if (!$debtCategory) {
                    $debtCategory = $expenseCategories->first();
                }

                Transaction::create([
                    'user_id' => $user->id,
                    'account_id' => $creditCard->id,
                    'category_id' => $debtCategory->id,
                    'name' => $creditCard->name . ' Payment',
                    'amount' => $payment,
                    'type' => 'expense',
                    'status' => 'completed',
                    'transaction_date' => $paymentDate,
                    'description' => ($fullPayment ? 'Full payment' : 'Partial payment') . ' for ' . $creditCard->name,
                ]);
            }
        }
    }

    /**
     * Get a realistic amount based on expense category
     */
    private function getAmountForCategory($categoryName)
    {
        switch ($categoryName) {
            case 'Food':
                return fake()->randomFloat(2, 5, 100);
            case 'Transportation':
                return fake()->randomFloat(2, 10, 150);
            case 'Entertainment':
                return fake()->randomFloat(2, 10, 200);
            case 'Shopping':
                return fake()->randomFloat(2, 15, 300);
            case 'Healthcare':
                return fake()->randomFloat(2, 20, 500);
            case 'Travel':
                return fake()->randomFloat(2, 50, 1000);
            case 'Education':
                return fake()->randomFloat(2, 10, 300);
            default:
                return fake()->randomFloat(2, 5, 200);
        }
    }

    /**
     * Get a realistic transaction name based on category
     */
    private function getTransactionNameForCategory($categoryName)
    {
        switch ($categoryName) {
            case 'Food':
                return fake()->randomElement([
                    'Grocery Store',
                    'Supermarket',
                    'Restaurant',
                    'Fast Food',
                    'Coffee Shop',
                    'Trader Joe\'s',
                    'Whole Foods',
                    'Chipotle',
                    'Starbucks',
                    'McDonald\'s',
                    'Subway',
                    'Pizza Delivery',
                    'Local Restaurant',
                    'Bakery',
                    'Food Delivery'
                ]);
            case 'Transportation':
                return fake()->randomElement([
                    'Gas Station',
                    'Fuel',
                    'Uber',
                    'Lyft',
                    'Public Transport',
                    'Taxi',
                    'Parking',
                    'Car Repair',
                    'Auto Service',
                    'Toll',
                    'Train Ticket',
                    'Bus Fare',
                    'Car Wash',
                    'Electric Charging'
                ]);
            case 'Entertainment':
                return fake()->randomElement([
                    'Movie Theater',
                    'Concert Tickets',
                    'Streaming Service',
                    'Gaming',
                    'Sporting Event',
                    'Theme Park',
                    'Museum',
                    'Music Purchase',
                    'App Store',
                    'Book Store',
                    'Theater Ticket',
                    'Live Event'
                ]);
            case 'Shopping':
                return fake()->randomElement([
                    'Department Store',
                    'Online Shopping',
                    'Clothing Store',
                    'Electronics Store',
                    'Target',
                    'Walmart',
                    'Amazon',
                    'Best Buy',
                    'Home Depot',
                    'Ikea',
                    'Macy\'s',
                    'Home Goods',
                    'Apple Store'
                ]);
            case 'Healthcare':
                return fake()->randomElement([
                    'Pharmacy',
                    'Doctor\'s Office',
                    'Hospital',
                    'Dental Clinic',
                    'Optometrist',
                    'Specialist Visit',
                    'Therapist',
                    'Medical Lab',
                    'CVS',
                    'Walgreens',
                    'Medical Supply',
                    'Urgent Care'
                ]);
            case 'Education':
                return fake()->randomElement([
                    'Bookstore',
                    'Online Course',
                    'Tuition',
                    'School Supplies',
                    'Workshop Fee',
                    'Conference Registration',
                    'Professional Development',
                    'Online Learning Platform',
                    'Educational Software'
                ]);
            case 'Travel':
                return fake()->randomElement([
                    'Airline Ticket',
                    'Hotel Booking',
                    'Vacation Package',
                    'Car Rental',
                    'Travel Insurance',
                    'Resort',
                    'Cruise Payment',
                    'Airbnb',
                    'Travel Agency',
                    'Tourism Activity',
                    'Luggage Purchase'
                ]);
            default:
                return fake()->company() . ' Purchase';
        }
    }
}
