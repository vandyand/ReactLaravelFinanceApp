<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Category;
use App\Models\Budget;
use Carbon\Carbon;

class BudgetSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::all();
        $currentMonth = Carbon::now()->startOfMonth();

        foreach ($users as $user) {
            // Get expense categories for this user
            $expenseCategories = Category::where('user_id', $user->id)
                ->where('type', 'expense')
                ->whereNull('parent_id') // Only top-level categories
                ->get();

            if ($expenseCategories->isEmpty()) {
                continue;
            }

            // Define common budget categories and their relative amounts
            $budgetableCategories = [
                'Food' => [
                    'amount_range' => [300, 800],
                    'probability' => 90, // 90% of users have this budget
                ],
                'Transportation' => [
                    'amount_range' => [100, 500],
                    'probability' => 85,
                ],
                'Shopping' => [
                    'amount_range' => [100, 600],
                    'probability' => 75,
                ],
                'Entertainment' => [
                    'amount_range' => [50, 300],
                    'probability' => 80,
                ],
                'Housing' => [
                    'amount_range' => [800, 3000],
                    'probability' => 70,
                ],
                'Utilities' => [
                    'amount_range' => [150, 500],
                    'probability' => 80,
                ],
                'Healthcare' => [
                    'amount_range' => [100, 500],
                    'probability' => 60,
                ],
                'Education' => [
                    'amount_range' => [50, 400],
                    'probability' => 40,
                ],
                'Travel' => [
                    'amount_range' => [100, 1000],
                    'probability' => 50,
                ],
                'Debt Payments' => [
                    'amount_range' => [200, 1000],
                    'probability' => 65,
                ],
                'Subscriptions' => [
                    'amount_range' => [30, 150],
                    'probability' => 75,
                ],
            ];

            // Create budgets for the current and next two months
            for ($i = 0; $i < 3; $i++) {
                $monthStart = clone $currentMonth;
                $monthStart->addMonths($i);
                $monthEnd = clone $monthStart->copy()->endOfMonth();

                // Create budgets for each category
                foreach ($budgetableCategories as $categoryName => $budgetInfo) {
                    if (fake()->boolean($budgetInfo['probability'])) {
                        $category = $expenseCategories->firstWhere('name', $categoryName);

                        if (!$category) {
                            continue;
                        }

                        $amount = fake()->randomFloat(2, $budgetInfo['amount_range'][0], $budgetInfo['amount_range'][1]);

                        Budget::create([
                            'user_id' => $user->id,
                            'category_id' => $category->id,
                            'name' => $categoryName . ' Budget',
                            'amount' => $amount,
                            'period' => 'monthly',
                            'start_date' => $monthStart,
                            'end_date' => $monthEnd,
                            'description' => 'Monthly budget for ' . $categoryName,
                            'currency' => 'USD',
                            'is_active' => true,
                        ]);
                    }
                }

                // Create some specific subcategory budgets
                if ($i === 0) { // Only for current month
                    $foodCategory = Category::where('user_id', $user->id)
                        ->where('name', 'Food')
                        ->first();

                    if ($foodCategory) {
                        $foodSubcategories = Category::where('user_id', $user->id)
                            ->where('parent_id', $foodCategory->id)
                            ->get();

                        if (!$foodSubcategories->isEmpty()) {
                            foreach ($foodSubcategories as $subcategory) {
                                if (fake()->boolean(70)) {
                                    $amount = fake()->randomFloat(2, 100, 300);

                                    Budget::create([
                                        'user_id' => $user->id,
                                        'category_id' => $subcategory->id,
                                        'name' => $subcategory->name . ' Budget',
                                        'amount' => $amount,
                                        'period' => 'monthly',
                                        'start_date' => $monthStart,
                                        'end_date' => $monthEnd,
                                        'description' => 'Monthly budget for ' . $subcategory->name,
                                        'currency' => 'USD',
                                        'is_active' => true,
                                    ]);
                                }
                            }
                        }
                    }
                }
            }

            // Create some quarterly or annual budgets
            $longTermBudgets = [
                'Travel' => [
                    'amount_range' => [1000, 5000],
                    'period' => 'annual',
                    'probability' => 60,
                ],
                'Education' => [
                    'amount_range' => [500, 3000],
                    'period' => 'annual',
                    'probability' => 40,
                ],
                'Shopping' => [
                    'amount_range' => [500, 2000],
                    'period' => 'quarterly',
                    'probability' => 50,
                ],
            ];

            foreach ($longTermBudgets as $categoryName => $budgetInfo) {
                if (fake()->boolean($budgetInfo['probability'])) {
                    $category = $expenseCategories->firstWhere('name', $categoryName);

                    if (!$category) {
                        continue;
                    }

                    $amount = fake()->randomFloat(2, $budgetInfo['amount_range'][0], $budgetInfo['amount_range'][1]);
                    $startDate = clone $currentMonth;

                    if ($budgetInfo['period'] === 'annual') {
                        $endDate = clone $startDate->copy()->addYear()->subDay();
                    } else { // quarterly
                        $endDate = clone $startDate->copy()->addMonths(3)->subDay();
                    }

                    Budget::create([
                        'user_id' => $user->id,
                        'category_id' => $category->id,
                        'name' => $categoryName . ' ' . ucfirst($budgetInfo['period']) . ' Budget',
                        'amount' => $amount,
                        'period' => $budgetInfo['period'],
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                        'description' => ucfirst($budgetInfo['period']) . ' budget for ' . $categoryName,
                        'currency' => 'USD',
                        'is_active' => true,
                    ]);
                }
            }
        }
    }
}
