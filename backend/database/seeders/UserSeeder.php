<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'phone' => '555-123-4567',
            'address' => '123 Admin St, Finance City, FC 12345',
            'profile_picture' => null,
        ]);

        // Assign admin role
        $admin->assignRole('admin');

        // Create regular users
        $users = [
            [
                'name' => 'John Doe',
                'email' => 'john@example.com',
                'password' => Hash::make('password'),
                'phone' => '555-111-2222',
                'address' => '456 Main St, Anytown, AT 67890',
                'profile_picture' => null,
            ],
            [
                'name' => 'Jane Smith',
                'email' => 'jane@example.com',
                'password' => Hash::make('password'),
                'phone' => '555-333-4444',
                'address' => '789 Oak Ave, Springfield, SP 54321',
                'profile_picture' => null,
            ],
            [
                'name' => 'Michael Johnson',
                'email' => 'michael@example.com',
                'password' => Hash::make('password'),
                'phone' => '555-555-6666',
                'address' => '101 Pine Blvd, Westville, WV 13579',
                'profile_picture' => null,
            ],
            [
                'name' => 'Sarah Williams',
                'email' => 'sarah@example.com',
                'password' => Hash::make('password'),
                'phone' => '555-777-8888',
                'address' => '202 Maple Dr, Easttown, ET 24680',
                'profile_picture' => null,
            ],
            [
                'name' => 'Robert Brown',
                'email' => 'robert@example.com',
                'password' => Hash::make('password'),
                'phone' => '555-999-0000',
                'address' => '303 Cedar Ln, Northville, NV 97531',
                'profile_picture' => null,
            ],
        ];

        foreach ($users as $userData) {
            $user = User::create($userData);
            // Assign user role
            $user->assignRole('user');
        }
    }
}
