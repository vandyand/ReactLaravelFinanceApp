<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Budget;
use App\Models\Investment;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get dashboard data including account balances, recent transactions,
     * spending by category, budgets, and investment performance.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        $user = Auth::user();

        // Get financial summary
        $summary = $this->getFinancialSummary($user->id);

        // Get recent transactions
        $recentTransactions = Transaction::where('user_id', $user->id)
            ->with(['account', 'category'])
            ->orderBy('transaction_date', 'desc')
            ->limit(5)
            ->get();

        // Get spending by category for the current month
        $spendingByCategory = $this->getSpendingByCategory($user->id);

        // Get budget status
        $budgets = Budget::where('user_id', $user->id)
            ->where('is_active', true)
            ->with('category')
            ->get();

        // Get investment performance
        $investments = Investment::where('user_id', $user->id)
            ->get()
            ->map(function ($investment) {
                return [
                    'id' => $investment->id,
                    'name' => $investment->name,
                    'symbol' => $investment->symbol,
                    'current_value' => $investment->getCurrentValue(),
                    'profit_loss' => $investment->getProfitLoss(),
                    'profit_loss_percentage' => $investment->getProfitLossPercentage(),
                ];
            });

        // Get income vs expenses chart data
        $incomeVsExpenses = $this->getIncomeVsExpenses($user->id);

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $summary,
                'recent_transactions' => $recentTransactions,
                'spending_by_category' => $spendingByCategory,
                'budgets' => $budgets,
                'investments' => $investments,
                'income_vs_expenses' => $incomeVsExpenses,
            ]
        ]);
    }

    /**
     * Get financial summary for the user.
     *
     * @param int $userId
     * @return array
     */
    private function getFinancialSummary($userId)
    {
        // Total balance across all accounts
        $totalBalance = Account::where('user_id', $userId)
            ->where('is_active', true)
            ->sum('balance');

        // Total income for current month
        $totalIncome = Transaction::where('user_id', $userId)
            ->where('type', 'income')
            ->whereMonth('transaction_date', now()->month)
            ->whereYear('transaction_date', now()->year)
            ->sum('amount');

        // Total expenses for current month
        $totalExpenses = Transaction::where('user_id', $userId)
            ->where('type', 'expense')
            ->whereMonth('transaction_date', now()->month)
            ->whereYear('transaction_date', now()->year)
            ->sum('amount');

        // Net worth calculation
        $assets = Account::where('user_id', $userId)
            ->whereIn('type', ['checking', 'savings', 'investment'])
            ->where('is_active', true)
            ->sum('balance');

        $liabilities = Account::where('user_id', $userId)
            ->whereIn('type', ['credit', 'loan'])
            ->where('is_active', true)
            ->sum('balance');

        $netWorth = $assets - $liabilities;

        return [
            'total_balance' => $totalBalance,
            'total_income' => $totalIncome,
            'total_expenses' => $totalExpenses,
            'net_worth' => $netWorth,
        ];
    }

    /**
     * Get spending by category for the current month.
     *
     * @param int $userId
     * @return array
     */
    private function getSpendingByCategory($userId)
    {
        return Transaction::where('transactions.user_id', $userId)
            ->where('transactions.type', 'expense')
            ->whereMonth('transactions.transaction_date', now()->month)
            ->whereYear('transactions.transaction_date', now()->year)
            ->join('categories', 'transactions.category_id', '=', 'categories.id')
            ->select(
                'categories.name',
                'categories.color',
                DB::raw('SUM(transactions.amount) as total')
            )
            ->groupBy('categories.id', 'categories.name', 'categories.color')
            ->orderBy('total', 'desc')
            ->get();
    }

    /**
     * Get income vs expenses for the last 6 months.
     *
     * @param int $userId
     * @return array
     */
    private function getIncomeVsExpenses($userId)
    {
        $result = [];

        // Get data for the last 6 months
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $month = $date->format('M');
            $year = $date->format('Y');

            $income = Transaction::where('user_id', $userId)
                ->where('type', 'income')
                ->whereMonth('transaction_date', $date->month)
                ->whereYear('transaction_date', $date->year)
                ->sum('amount');

            $expenses = Transaction::where('user_id', $userId)
                ->where('type', 'expense')
                ->whereMonth('transaction_date', $date->month)
                ->whereYear('transaction_date', $date->year)
                ->sum('amount');

            $result[] = [
                'month' => $month,
                'year' => $year,
                'income' => $income,
                'expenses' => $expenses,
                'savings' => $income - $expenses,
            ];
        }

        return $result;
    }
}
