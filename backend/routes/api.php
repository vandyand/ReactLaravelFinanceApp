<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\AccountController;
use App\Http\Controllers\API\TransactionController;
use App\Http\Controllers\API\BudgetController;
use App\Http\Controllers\API\InvestmentController;
use App\Http\Controllers\API\CategoryController;
use App\Http\Controllers\API\DashboardController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make fun!
|
*/

// Root API route
Route::get('/', function () {
    return response()->json([
        'name' => 'FinTec API',
        'version' => '1.0.0',
        'description' => 'Financial Technology Application API',
        'endpoints' => [
            '/api/login' => 'User authentication',
            '/api/register' => 'User registration',
            '/api/transactions' => 'Transaction management',
            '/api/categories' => 'Category management',
        ],
        'documentation' => 'Contact administrator for detailed API documentation',
    ]);
});

// Public routes
Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:api')->group(function () {
    // Auth routes
    Route::post('logout', [AuthController::class, 'logout']);
    Route::post('refresh', [AuthController::class, 'refresh']);
    Route::get('me', [AuthController::class, 'me']);
    Route::put('update-password', [AuthController::class, 'updatePassword']);

    // Dashboard
    Route::get('dashboard', [DashboardController::class, 'index']);

    // Accounts
    Route::apiResource('accounts', AccountController::class);

    // Transactions
    Route::apiResource('transactions', TransactionController::class);
    Route::get('transactions/by-category', [TransactionController::class, 'byCategory']);
    Route::get('transactions/by-date', [TransactionController::class, 'byDate']);

    // Categories
    Route::apiResource('categories', CategoryController::class);

    // Budgets
    Route::apiResource('budgets', BudgetController::class);
    Route::get('budgets/performance', [BudgetController::class, 'performance']);

    // Investments
    Route::apiResource('investments', InvestmentController::class);
    Route::get('investments/performance', [InvestmentController::class, 'performance']);
});
