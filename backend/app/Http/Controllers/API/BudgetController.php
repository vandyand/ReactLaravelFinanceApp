<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Budget;
use App\Models\Category;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class BudgetController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = Budget::where('user_id', $user->id)
            ->with('category');

        // Filter by active status if provided
        if ($request->has('is_active')) {
            $isActive = filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN);
            $query->where('is_active', $isActive);
        }

        // Filter by period if provided
        if ($request->has('period')) {
            $query->where('period', $request->period);
        }

        // Filter by category if provided
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $budgets = $query->get();

        // Calculate current spending for each budget
        $budgets->each(function ($budget) {
            $budget->current_amount = $this->getCurrentSpending($budget);
            $budget->remaining = $budget->amount - $budget->current_amount;
            $budget->percentage = $budget->amount > 0 ?
                min(100, round(($budget->current_amount / $budget->amount) * 100, 2)) : 0;
        });

        return response()->json([
            'success' => true,
            'data' => $budgets
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'category_id' => 'required|exists:categories,id',
            'amount' => 'required|numeric|min:0',
            'period' => 'required|string|in:daily,weekly,monthly,annual',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_active' => 'boolean',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();

        // Verify category belongs to user or is a default category
        $category = Category::where(function ($query) use ($user) {
            $query->where('user_id', $user->id)
                ->orWhereNull('user_id');
        })
            ->find($request->category_id);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid category'
            ], 400);
        }

        $budget = new Budget($request->all());
        $budget->user_id = $user->id;
        $budget->save();

        // Calculate current spending
        $budget->current_amount = $this->getCurrentSpending($budget);
        $budget->remaining = $budget->amount - $budget->current_amount;
        $budget->percentage = $budget->amount > 0 ?
            min(100, round(($budget->current_amount / $budget->amount) * 100, 2)) : 0;

        return response()->json([
            'success' => true,
            'message' => 'Budget created successfully',
            'data' => $budget->load('category')
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = Auth::user();
        $budget = Budget::where('user_id', $user->id)
            ->with('category')
            ->find($id);

        if (!$budget) {
            return response()->json([
                'success' => false,
                'message' => 'Budget not found'
            ], 404);
        }

        // Calculate current spending
        $budget->current_amount = $this->getCurrentSpending($budget);
        $budget->remaining = $budget->amount - $budget->current_amount;
        $budget->percentage = $budget->amount > 0 ?
            min(100, round(($budget->current_amount / $budget->amount) * 100, 2)) : 0;

        return response()->json([
            'success' => true,
            'data' => $budget
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = Auth::user();
        $budget = Budget::where('user_id', $user->id)->find($id);

        if (!$budget) {
            return response()->json([
                'success' => false,
                'message' => 'Budget not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'category_id' => 'exists:categories,id',
            'amount' => 'numeric|min:0',
            'period' => 'string|in:daily,weekly,monthly,annual',
            'start_date' => 'date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_active' => 'boolean',
            'name' => 'string|max:255',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // If category is changing, verify it belongs to user or is default
        if ($request->has('category_id') && $request->category_id != $budget->category_id) {
            $category = Category::where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhereNull('user_id');
            })
                ->find($request->category_id);

            if (!$category) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid category'
                ], 400);
            }
        }

        $budget->update($request->all());

        // Calculate current spending
        $budget->current_amount = $this->getCurrentSpending($budget);
        $budget->remaining = $budget->amount - $budget->current_amount;
        $budget->percentage = $budget->amount > 0 ?
            min(100, round(($budget->current_amount / $budget->amount) * 100, 2)) : 0;

        return response()->json([
            'success' => true,
            'message' => 'Budget updated successfully',
            'data' => $budget->load('category')
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $user = Auth::user();
        $budget = Budget::where('user_id', $user->id)->find($id);

        if (!$budget) {
            return response()->json([
                'success' => false,
                'message' => 'Budget not found'
            ], 404);
        }

        $budget->delete();

        return response()->json([
            'success' => true,
            'message' => 'Budget deleted successfully'
        ]);
    }

    /**
     * Get budget performance data
     */
    public function performance(Request $request)
    {
        $user = Auth::user();
        $month = $request->input('month', Carbon::now()->month);
        $year = $request->input('year', Carbon::now()->year);

        // Get all active budgets for the period
        $budgets = Budget::where('user_id', $user->id)
            ->where('is_active', true)
            ->with('category')
            ->get();

        $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endDate = Carbon::createFromDate($year, $month, 1)->endOfMonth();

        $result = $budgets->map(function ($budget) use ($startDate, $endDate) {
            // Get transactions for this budget's category within the date range
            $transactions = Transaction::where('user_id', $budget->user_id)
                ->where('category_id', $budget->category_id)
                ->where('type', 'expense')
                ->where('status', 'completed')
                ->whereBetween('transaction_date', [$startDate, $endDate])
                ->get();

            $spent = $transactions->sum('amount');
            $remaining = $budget->amount - $spent;
            $percentage = $budget->amount > 0 ?
                min(100, round(($spent / $budget->amount) * 100, 2)) : 0;

            // Status calculation
            $status = 'on_track'; // default

            // Calculate what percentage of the month has passed
            $now = Carbon::now();
            $daysInMonth = $endDate->day;
            $daysPassed = $now->day;
            $monthProgress = min(100, round(($daysPassed / $daysInMonth) * 100, 2));

            // If spent more than budget, status is 'exceeded'
            if ($percentage >= 100) {
                $status = 'exceeded';
            }
            // If spent percentage is significantly higher than the month progress, status is 'warning'
            else if ($percentage > ($monthProgress * 1.2)) {
                $status = 'warning';
            }
            // If spent percentage is significantly lower than the month progress, status is 'under'
            else if ($percentage < ($monthProgress * 0.5) && $monthProgress > 30) {
                $status = 'under';
            }

            return [
                'id' => $budget->id,
                'name' => $budget->name,
                'category' => $budget->category->name,
                'category_id' => $budget->category_id,
                'color' => $budget->category->color,
                'amount' => $budget->amount,
                'spent' => $spent,
                'remaining' => $remaining,
                'percentage' => $percentage,
                'status' => $status,
                'transaction_count' => $transactions->count(),
            ];
        });

        // Summary statistics
        $totalBudgeted = $budgets->sum('amount');
        $totalSpent = $result->sum('spent');
        $totalRemaining = $totalBudgeted - $totalSpent;
        $overallPercentage = $totalBudgeted > 0 ?
            min(100, round(($totalSpent / $totalBudgeted) * 100, 2)) : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'budgets' => $result,
                'summary' => [
                    'total_budgeted' => $totalBudgeted,
                    'total_spent' => $totalSpent,
                    'total_remaining' => $totalRemaining,
                    'overall_percentage' => $overallPercentage,
                    'month' => $startDate->format('F Y'),
                ]
            ]
        ]);
    }

    /**
     * Calculate current spending for a budget
     */
    private function getCurrentSpending($budget)
    {
        // Determine date range based on budget period
        $now = Carbon::now();
        $startDate = null;
        $endDate = null;

        switch ($budget->period) {
            case 'daily':
                $startDate = $now->startOfDay();
                $endDate = $now->endOfDay();
                break;
            case 'weekly':
                $startDate = $now->startOfWeek();
                $endDate = $now->endOfWeek();
                break;
            case 'monthly':
                $startDate = $now->startOfMonth();
                $endDate = $now->endOfMonth();
                break;
            case 'annual':
                $startDate = $now->startOfYear();
                $endDate = $now->endOfYear();
                break;
            default:
                // If custom period, use budget start/end dates
                $startDate = $budget->start_date ? new Carbon($budget->start_date) : $now->startOfMonth();
                $endDate = $budget->end_date ? new Carbon($budget->end_date) : $now->endOfMonth();
        }

        // Adjust if budget has specific start/end dates that override the period
        if ($budget->start_date && new Carbon($budget->start_date) > $startDate) {
            $startDate = new Carbon($budget->start_date);
        }

        if ($budget->end_date && new Carbon($budget->end_date) < $endDate) {
            $endDate = new Carbon($budget->end_date);
        }

        // Get total expenses for this category within the date range
        return Transaction::where('user_id', $budget->user_id)
            ->where('category_id', $budget->category_id)
            ->where('type', 'expense')
            ->where('status', 'completed')
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->sum('amount');
    }
}
