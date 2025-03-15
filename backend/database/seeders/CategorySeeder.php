<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\User;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::all();

        // Define common categories
        $expenseCategories = [
            ['name' => 'Housing', 'type' => 'expense', 'color' => '#4A90E2', 'icon' => 'home', 'description' => 'Rent, mortgage, property taxes, maintenance'],
            ['name' => 'Utilities', 'type' => 'expense', 'color' => '#50E3C2', 'icon' => 'flash', 'description' => 'Electric, water, gas, internet, phone'],
            ['name' => 'Food', 'type' => 'expense', 'color' => '#F5A623', 'icon' => 'restaurant', 'description' => 'Groceries, dining out, food delivery'],
            ['name' => 'Transportation', 'type' => 'expense', 'color' => '#9013FE', 'icon' => 'car', 'description' => 'Car payments, fuel, public transport, rideshare'],
            ['name' => 'Healthcare', 'type' => 'expense', 'color' => '#D0021B', 'icon' => 'medkit', 'description' => 'Insurance, doctor visits, medications'],
            ['name' => 'Debt Payments', 'type' => 'expense', 'color' => '#B8E986', 'icon' => 'card', 'description' => 'Credit cards, student loans, personal loans'],
            ['name' => 'Entertainment', 'type' => 'expense', 'color' => '#7ED321', 'icon' => 'happy', 'description' => 'Streaming services, movies, concerts, hobbies'],
            ['name' => 'Shopping', 'type' => 'expense', 'color' => '#F8E71C', 'icon' => 'cart', 'description' => 'Clothing, electronics, household items'],
            ['name' => 'Education', 'type' => 'expense', 'color' => '#BD10E0', 'icon' => 'school', 'description' => 'Tuition, books, courses, training'],
            ['name' => 'Travel', 'type' => 'expense', 'color' => '#4A4A4A', 'icon' => 'airplane', 'description' => 'Flights, accommodations, trips'],
            ['name' => 'Gifts & Donations', 'type' => 'expense', 'color' => '#8B572A', 'icon' => 'gift', 'description' => 'Presents, charitable contributions'],
            ['name' => 'Insurance', 'type' => 'expense', 'color' => '#417505', 'icon' => 'shield', 'description' => 'Life, home, auto insurance not covered elsewhere'],
            ['name' => 'Subscriptions', 'type' => 'expense', 'color' => '#9B9B9B', 'icon' => 'repeat', 'description' => 'Recurring subscriptions and memberships'],
            ['name' => 'Taxes', 'type' => 'expense', 'color' => '#FF9500', 'icon' => 'document', 'description' => 'Income tax, property tax, other taxes'],
            ['name' => 'Miscellaneous', 'type' => 'expense', 'color' => '#C7C7CC', 'icon' => 'ellipsis-horizontal', 'description' => 'Other expenses that don\'t fit elsewhere'],
        ];

        $incomeCategories = [
            ['name' => 'Salary', 'type' => 'income', 'color' => '#4CD964', 'icon' => 'briefcase', 'description' => 'Regular employment income'],
            ['name' => 'Freelance', 'type' => 'income', 'color' => '#5AC8FA', 'icon' => 'laptop', 'description' => 'Contract and freelance work income'],
            ['name' => 'Investments', 'type' => 'income', 'color' => '#FFCC00', 'icon' => 'trending-up', 'description' => 'Dividends, capital gains, interest'],
            ['name' => 'Gifts', 'type' => 'income', 'color' => '#FF2D55', 'icon' => 'gift', 'description' => 'Money received as gifts'],
            ['name' => 'Rental Income', 'type' => 'income', 'color' => '#8E8E93', 'icon' => 'key', 'description' => 'Income from rental properties'],
            ['name' => 'Bonus', 'type' => 'income', 'color' => '#007AFF', 'icon' => 'star', 'description' => 'Work bonuses and incentives'],
            ['name' => 'Refunds', 'type' => 'income', 'color' => '#FF3B30', 'icon' => 'return-down-back', 'description' => 'Tax refunds, purchase returns'],
            ['name' => 'Side Business', 'type' => 'income', 'color' => '#34AADC', 'icon' => 'storefront', 'description' => 'Income from side businesses or hustles'],
            ['name' => 'Other Income', 'type' => 'income', 'color' => '#5856D6', 'icon' => 'cash', 'description' => 'Any other income sources'],
        ];

        // Create categories for each user
        foreach ($users as $user) {
            // Create expense categories for this user
            foreach ($expenseCategories as $category) {
                Category::create([
                    'user_id' => $user->id,
                    'name' => $category['name'],
                    'type' => $category['type'],
                    'color' => $category['color'],
                    'icon' => $category['icon'],
                    'description' => $category['description'],
                ]);
            }

            // Create income categories for this user
            foreach ($incomeCategories as $category) {
                Category::create([
                    'user_id' => $user->id,
                    'name' => $category['name'],
                    'type' => $category['type'],
                    'color' => $category['color'],
                    'icon' => $category['icon'],
                    'description' => $category['description'],
                ]);
            }

            // Create some subcategories for specific categories
            $foodCategory = Category::where('user_id', $user->id)
                ->where('name', 'Food')
                ->first();

            if ($foodCategory) {
                $foodSubcategories = [
                    ['name' => 'Groceries', 'type' => 'expense', 'color' => '#F5A623', 'icon' => 'basket', 'description' => 'Food purchased from grocery stores'],
                    ['name' => 'Restaurants', 'type' => 'expense', 'color' => '#F5A623', 'icon' => 'restaurant', 'description' => 'Eating out at restaurants'],
                    ['name' => 'Delivery', 'type' => 'expense', 'color' => '#F5A623', 'icon' => 'bicycle', 'description' => 'Food delivery services'],
                ];

                foreach ($foodSubcategories as $subcategory) {
                    Category::create([
                        'user_id' => $user->id,
                        'parent_id' => $foodCategory->id,
                        'name' => $subcategory['name'],
                        'type' => $subcategory['type'],
                        'color' => $subcategory['color'],
                        'icon' => $subcategory['icon'],
                        'description' => $subcategory['description'],
                    ]);
                }
            }
        }
    }
}
