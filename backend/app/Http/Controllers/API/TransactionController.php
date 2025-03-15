<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Transaction;
use App\Models\Account;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TransactionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = Transaction::where('user_id', $user->id)
            ->with(['account', 'category']);

        // Apply filters if provided
        if ($request->has('account_id')) {
            $query->where('account_id', $request->account_id);
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('start_date')) {
            $query->where('transaction_date', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->where('transaction_date', '<=', $request->end_date);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('reference_number', 'like', "%{$search}%");
            });
        }

        // Apply sorting
        $sortField = $request->input('sort_by', 'transaction_date');
        $sortDirection = $request->input('sort_dir', 'desc');
        $query->orderBy($sortField, $sortDirection);

        // Pagination
        $perPage = $request->input('per_page', 15);
        $transactions = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'account_id' => 'required|exists:accounts,id',
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0.01',
            'type' => 'required|string|in:income,expense,transfer',
            'status' => 'required|string|in:pending,completed,failed,refunded',
            'transaction_date' => 'required|date',
            'description' => 'nullable|string',
            'reference_number' => 'nullable|string|max:50',
            'payment_method' => 'nullable|string|max:50',
            'currency' => 'nullable|string|size:3',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();

        // Verify account belongs to the user
        $account = Account::where('id', $request->account_id)
            ->where('user_id', $user->id)
            ->first();

        if (!$account) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid account'
            ], 400);
        }

        $transaction = new Transaction($request->all());
        $transaction->user_id = $user->id;
        $transaction->save();

        // Update account balance if the transaction is completed
        if ($request->status === 'completed') {
            $this->updateAccountBalance($account, $transaction);
        }

        return response()->json([
            'success' => true,
            'message' => 'Transaction created successfully',
            'data' => $transaction->load(['account', 'category'])
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = Auth::user();
        $transaction = Transaction::where('user_id', $user->id)
            ->with(['account', 'category'])
            ->find($id);

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $transaction
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = Auth::user();
        $transaction = Transaction::where('user_id', $user->id)->find($id);

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'account_id' => 'exists:accounts,id',
            'category_id' => 'exists:categories,id',
            'name' => 'string|max:255',
            'amount' => 'numeric|min:0.01',
            'type' => 'string|in:income,expense,transfer',
            'status' => 'string|in:pending,completed,failed,refunded',
            'transaction_date' => 'date',
            'description' => 'nullable|string',
            'reference_number' => 'nullable|string|max:50',
            'payment_method' => 'nullable|string|max:50',
            'currency' => 'nullable|string|size:3',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // If account is changing, verify new account belongs to user
        if ($request->has('account_id') && $request->account_id != $transaction->account_id) {
            $account = Account::where('id', $request->account_id)
                ->where('user_id', $user->id)
                ->first();

            if (!$account) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid account'
                ], 400);
            }
        }

        // Get old transaction data for balance update
        $oldData = [
            'amount' => $transaction->amount,
            'type' => $transaction->type,
            'status' => $transaction->status,
            'account_id' => $transaction->account_id
        ];

        $transaction->update($request->all());

        // Handle account balance updates if status, amount, type, or account changed
        if ($oldData['status'] === 'completed' || $request->status === 'completed') {
            // Revert old transaction effect if needed
            if ($oldData['status'] === 'completed') {
                $oldAccount = Account::find($oldData['account_id']);
                $this->revertAccountBalance($oldAccount, $oldData);
            }

            // Apply new transaction effect if needed
            if ($request->status === 'completed') {
                $newAccount = Account::find($transaction->account_id);
                $this->updateAccountBalance($newAccount, $transaction);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Transaction updated successfully',
            'data' => $transaction->load(['account', 'category'])
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $user = Auth::user();
        $transaction = Transaction::where('user_id', $user->id)->find($id);

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction not found'
            ], 404);
        }

        // Revert account balance if transaction was completed
        if ($transaction->status === 'completed') {
            $account = Account::find($transaction->account_id);
            $this->revertAccountBalance($account, $transaction);
        }

        $transaction->delete();

        return response()->json([
            'success' => true,
            'message' => 'Transaction deleted successfully'
        ]);
    }

    /**
     * Get transactions grouped by category
     */
    public function byCategory(Request $request)
    {
        $user = Auth::user();

        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());
        $type = $request->input('type', 'expense');

        $transactions = Transaction::where('user_id', $user->id)
            ->where('type', $type)
            ->where('status', 'completed')
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->join('categories', 'transactions.category_id', '=', 'categories.id')
            ->select(
                'categories.id',
                'categories.name as category_name',
                'categories.color',
                DB::raw('SUM(transactions.amount) as total_amount'),
                DB::raw('COUNT(transactions.id) as transaction_count')
            )
            ->groupBy('categories.id', 'categories.name', 'categories.color')
            ->orderBy('total_amount', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    }

    /**
     * Get transactions grouped by date
     */
    public function byDate(Request $request)
    {
        $user = Auth::user();

        $startDate = $request->input('start_date', Carbon::now()->subMonths(2)->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());
        $groupBy = $request->input('group_by', 'day'); // day, week, month

        $dateFormat = 'Y-m-d';
        $dateColumn = 'DATE(transaction_date)';

        if ($groupBy === 'week') {
            $dateFormat = 'Y-W';
            $dateColumn = 'YEARWEEK(transaction_date)';
        } else if ($groupBy === 'month') {
            $dateFormat = 'Y-m';
            $dateColumn = 'DATE_FORMAT(transaction_date, "%Y-%m")';
        }

        $incomeQuery = Transaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->where('status', 'completed')
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->select(
                DB::raw("$dateColumn as date"),
                DB::raw('SUM(amount) as total')
            )
            ->groupBy('date')
            ->orderBy('date');

        $expenseQuery = Transaction::where('user_id', $user->id)
            ->where('type', 'expense')
            ->where('status', 'completed')
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->select(
                DB::raw("$dateColumn as date"),
                DB::raw('SUM(amount) as total')
            )
            ->groupBy('date')
            ->orderBy('date');

        $income = $incomeQuery->get()->pluck('total', 'date')->toArray();
        $expense = $expenseQuery->get()->pluck('total', 'date')->toArray();

        // Generate all dates in the range
        $dates = [];
        $period = new \DatePeriod(
            new \DateTime($startDate),
            new \DateInterval('P1D'),
            new \DateTime($endDate . ' 23:59:59')
        );

        foreach ($period as $date) {
            $formattedDate = $date->format($dateFormat);
            if (!isset($dates[$formattedDate])) {
                $dates[$formattedDate] = [
                    'date' => $formattedDate,
                    'income' => 0,
                    'expense' => 0,
                    'net' => 0
                ];
            }
        }

        // Merge income and expense data
        foreach ($income as $date => $total) {
            if (isset($dates[$date])) {
                $dates[$date]['income'] = (float) $total;
                $dates[$date]['net'] = $dates[$date]['income'] - $dates[$date]['expense'];
            }
        }

        foreach ($expense as $date => $total) {
            if (isset($dates[$date])) {
                $dates[$date]['expense'] = (float) $total;
                $dates[$date]['net'] = $dates[$date]['income'] - $dates[$date]['expense'];
            }
        }

        return response()->json([
            'success' => true,
            'data' => array_values($dates)
        ]);
    }

    /**
     * Update account balance based on transaction
     */
    private function updateAccountBalance($account, $transaction)
    {
        if (!$account) return;

        if ($transaction->type === 'income') {
            $account->balance += $transaction->amount;
        } else if ($transaction->type === 'expense') {
            $account->balance -= $transaction->amount;
        }

        $account->save();
    }

    /**
     * Revert account balance changes from a transaction
     */
    private function revertAccountBalance($account, $transaction)
    {
        if (!$account) return;

        $type = is_array($transaction) ? $transaction['type'] : $transaction->type;
        $amount = is_array($transaction) ? $transaction['amount'] : $transaction->amount;

        if ($type === 'income') {
            $account->balance -= $amount;
        } else if ($type === 'expense') {
            $account->balance += $amount;
        }

        $account->save();
    }
}
