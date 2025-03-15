<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Account;
use App\Models\User;

class AccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::all();

        foreach ($users as $user) {
            // Create checking accounts
            Account::create([
                'user_id' => $user->id,
                'name' => 'Primary Checking',
                'account_number' => 'CH' . fake()->unique()->numerify('########'),
                'institution' => 'National Bank',
                'type' => 'checking',
                'balance' => fake()->randomFloat(2, 1000, 15000),
                'currency' => 'USD',
                'description' => 'Main checking account for daily expenses',
                'is_active' => true,
            ]);

            if (fake()->boolean(70)) { // 70% of users have a secondary checking
                Account::create([
                    'user_id' => $user->id,
                    'name' => 'Secondary Checking',
                    'account_number' => 'CH' . fake()->unique()->numerify('########'),
                    'institution' => 'City Credit Union',
                    'type' => 'checking',
                    'balance' => fake()->randomFloat(2, 500, 5000),
                    'currency' => 'USD',
                    'description' => 'Secondary checking account for specific expenses',
                    'is_active' => true,
                ]);
            }

            // Create savings accounts
            Account::create([
                'user_id' => $user->id,
                'name' => 'Emergency Fund',
                'account_number' => 'SV' . fake()->unique()->numerify('########'),
                'institution' => 'National Bank',
                'type' => 'savings',
                'balance' => fake()->randomFloat(2, 2000, 30000),
                'currency' => 'USD',
                'description' => 'Emergency savings for unexpected expenses',
                'is_active' => true,
            ]);

            if (fake()->boolean(60)) { // 60% of users have a vacation savings
                Account::create([
                    'user_id' => $user->id,
                    'name' => 'Vacation Savings',
                    'account_number' => 'SV' . fake()->unique()->numerify('########'),
                    'institution' => 'Online Savings Bank',
                    'type' => 'savings',
                    'balance' => fake()->randomFloat(2, 500, 10000),
                    'currency' => 'USD',
                    'description' => 'Saving for upcoming vacations',
                    'is_active' => true,
                ]);
            }

            // Create credit cards
            $creditCards = [
                [
                    'name' => 'Rewards Credit Card',
                    'institution' => 'Capital One',
                    'balance' => fake()->randomFloat(2, 0, 5000),
                    'description' => 'Card used for earning travel points',
                ],
                [
                    'name' => 'Cashback Credit Card',
                    'institution' => 'Chase',
                    'balance' => fake()->randomFloat(2, 0, 3000),
                    'description' => 'Card used for cashback on purchases',
                ],
            ];

            foreach ($creditCards as $index => $card) {
                // First card for all users, second card only for 50% of users
                if ($index === 0 || fake()->boolean(50)) {
                    Account::create([
                        'user_id' => $user->id,
                        'name' => $card['name'],
                        'account_number' => 'CC' . fake()->unique()->numerify('############'),
                        'institution' => $card['institution'],
                        'type' => 'credit_card',
                        'balance' => -1 * $card['balance'], // Negative balance for credit cards
                        'currency' => 'USD',
                        'description' => $card['description'],
                        'is_active' => true,
                    ]);
                }
            }

            // Create loans
            $loans = [
                [
                    'name' => 'Mortgage',
                    'institution' => 'Home Loan Bank',
                    'balance' => fake()->randomFloat(2, 100000, 500000),
                    'description' => 'Home mortgage loan',
                    'probability' => 60, // 60% of users have a mortgage
                ],
                [
                    'name' => 'Auto Loan',
                    'institution' => 'Auto Finance',
                    'balance' => fake()->randomFloat(2, 5000, 40000),
                    'description' => 'Car loan',
                    'probability' => 70, // 70% of users have an auto loan
                ],
                [
                    'name' => 'Student Loan',
                    'institution' => 'Education Funding',
                    'balance' => fake()->randomFloat(2, 10000, 100000),
                    'description' => 'Student loan',
                    'probability' => 50, // 50% of users have student loans
                ],
                [
                    'name' => 'Personal Loan',
                    'institution' => 'Lending Tree',
                    'balance' => fake()->randomFloat(2, 2000, 20000),
                    'description' => 'Personal loan',
                    'probability' => 30, // 30% of users have a personal loan
                ],
            ];

            foreach ($loans as $loan) {
                if (fake()->boolean($loan['probability'])) {
                    Account::create([
                        'user_id' => $user->id,
                        'name' => $loan['name'],
                        'account_number' => 'LN' . fake()->unique()->numerify('#########'),
                        'institution' => $loan['institution'],
                        'type' => 'loan',
                        'balance' => -1 * $loan['balance'], // Negative balance for loans
                        'currency' => 'USD',
                        'description' => $loan['description'],
                        'is_active' => true,
                    ]);
                }
            }

            // Create investment accounts
            $investments = [
                [
                    'name' => '401(k)',
                    'institution' => 'Fidelity',
                    'balance' => fake()->randomFloat(2, 10000, 500000),
                    'description' => 'Employer-sponsored retirement account',
                    'probability' => 80, // 80% of users have a 401(k)
                ],
                [
                    'name' => 'IRA',
                    'institution' => 'Vanguard',
                    'balance' => fake()->randomFloat(2, 5000, 100000),
                    'description' => 'Individual Retirement Account',
                    'probability' => 60, // 60% of users have an IRA
                ],
                [
                    'name' => 'Brokerage Account',
                    'institution' => 'Schwab',
                    'balance' => fake()->randomFloat(2, 1000, 100000),
                    'description' => 'Individual investment account',
                    'probability' => 50, // 50% of users have a brokerage account
                ],
                [
                    'name' => 'Cryptocurrency',
                    'institution' => 'Coinbase',
                    'balance' => fake()->randomFloat(2, 100, 20000),
                    'description' => 'Cryptocurrency holdings',
                    'probability' => 40, // 40% of users have cryptocurrency
                ],
            ];

            foreach ($investments as $investment) {
                if (fake()->boolean($investment['probability'])) {
                    Account::create([
                        'user_id' => $user->id,
                        'name' => $investment['name'],
                        'account_number' => 'IN' . fake()->unique()->numerify('#########'),
                        'institution' => $investment['institution'],
                        'type' => 'investment',
                        'balance' => $investment['balance'],
                        'currency' => 'USD',
                        'description' => $investment['description'],
                        'is_active' => true,
                    ]);
                }
            }
        }
    }
}
