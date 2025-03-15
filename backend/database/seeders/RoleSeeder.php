<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create roles if they don't exist
        if (!Role::where('name', 'admin')->exists()) {
            $adminRole = Role::create(['name' => 'admin']);
        } else {
            $adminRole = Role::where('name', 'admin')->first();
        }

        if (!Role::where('name', 'user')->exists()) {
            $userRole = Role::create(['name' => 'user']);
        } else {
            $userRole = Role::where('name', 'user')->first();
        }

        // You can add permissions here if needed
        // For example:
        // $permission = Permission::create(['name' => 'edit articles']);
        // $adminRole->givePermissionTo($permission);
    }
}
