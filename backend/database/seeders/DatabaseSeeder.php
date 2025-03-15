<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Disable foreign key checks
        Schema::disableForeignKeyConstraints();

        // Truncate all tables
        DB::table('investments')->truncate();
        DB::table('budgets')->truncate();
        DB::table('transactions')->truncate();
        DB::table('accounts')->truncate();
        DB::table('categories')->truncate();
        DB::table('model_has_roles')->truncate();
        DB::table('users')->truncate();

        // Re-enable foreign key checks
        Schema::enableForeignKeyConstraints();

        // Run the RoleSeeder to create roles
        $this->call(RoleSeeder::class);

        // Run our comprehensive seeders in the correct order
        $this->call([
            UserSeeder::class,            // First create the users
            CategorySeeder::class,        // Then create categories for those users
            AccountSeeder::class,         // Create accounts for users
            TransactionSeeder::class,     // Create transactions (requires users, categories, and accounts)
            BudgetSeeder::class,          // Create budgets (requires users and categories)
            InvestmentSeeder::class,      // Create investments (requires users and accounts)
        ]);
    }
}
