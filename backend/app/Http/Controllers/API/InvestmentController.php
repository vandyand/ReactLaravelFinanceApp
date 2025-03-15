<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Investment;
use App\Models\Account;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class InvestmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = Investment::where('user_id', $user->id)
            ->with('account');

        // Filter by account if provided
        if ($request->has('account_id')) {
            $query->where('account_id', $request->account_id);
        }

        // Filter by investment type if provided
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter by symbol if provided
        if ($request->has('symbol')) {
            $query->where('symbol', 'like', '%' . $request->symbol . '%');
        }

        // Filter sold/unsold investments
        if ($request->has('is_sold')) {
            $isSold = filter_var($request->is_sold, FILTER_VALIDATE_BOOLEAN);
            if ($isSold) {
                $query->whereNotNull('sell_date');
            } else {
                $query->whereNull('sell_date');
            }
        }

        // Apply sorting
        $sortField = $request->input('sort_by', 'purchase_date');
        $sortDirection = $request->input('sort_dir', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $investments = $query->get();

        // Calculate additional fields for each investment
        $investments->transform(function ($investment) {
            // Add calculated fields 
            $investment->current_value = $investment->getCurrentValue();
            $investment->profit_loss = $investment->getProfitLoss();
            $investment->profit_loss_percentage = $investment->getProfitLossPercentage();
            $investment->annual_return = $investment->getAnnualReturn();

            return $investment;
        });

        return response()->json([
            'success' => true,
            'data' => $investments
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'account_id' => 'required|exists:accounts,id',
            'name' => 'required|string|max:255',
            'symbol' => 'required|string|max:50',
            'type' => 'required|string|in:stock,etf,mutual_fund,bond,cryptocurrency,other',
            'purchase_price' => 'required|numeric|min:0',
            'current_price' => 'required|numeric|min:0',
            'quantity' => 'required|numeric|min:0',
            'purchase_date' => 'required|date',
            'sell_date' => 'nullable|date|after_or_equal:purchase_date',
            'sell_price' => 'nullable|required_with:sell_date|numeric|min:0',
            'currency' => 'required|string|size:3',
            'notes' => 'nullable|string',
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

        $investment = new Investment($request->all());
        $investment->user_id = $user->id;
        $investment->save();

        // Calculate additional fields
        $investment->current_value = $investment->getCurrentValue();
        $investment->profit_loss = $investment->getProfitLoss();
        $investment->profit_loss_percentage = $investment->getProfitLossPercentage();
        $investment->annual_return = $investment->getAnnualReturn();

        return response()->json([
            'success' => true,
            'message' => 'Investment created successfully',
            'data' => $investment->load('account')
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = Auth::user();
        $investment = Investment::where('user_id', $user->id)
            ->with('account')
            ->find($id);

        if (!$investment) {
            return response()->json([
                'success' => false,
                'message' => 'Investment not found'
            ], 404);
        }

        // Calculate additional fields
        $investment->current_value = $investment->getCurrentValue();
        $investment->profit_loss = $investment->getProfitLoss();
        $investment->profit_loss_percentage = $investment->getProfitLossPercentage();
        $investment->annual_return = $investment->getAnnualReturn();

        return response()->json([
            'success' => true,
            'data' => $investment
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = Auth::user();
        $investment = Investment::where('user_id', $user->id)->find($id);

        if (!$investment) {
            return response()->json([
                'success' => false,
                'message' => 'Investment not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'account_id' => 'exists:accounts,id',
            'name' => 'string|max:255',
            'symbol' => 'string|max:50',
            'type' => 'string|in:stock,etf,mutual_fund,bond,cryptocurrency,other',
            'purchase_price' => 'numeric|min:0',
            'current_price' => 'numeric|min:0',
            'quantity' => 'numeric|min:0',
            'purchase_date' => 'date',
            'sell_date' => 'nullable|date|after_or_equal:purchase_date',
            'sell_price' => 'nullable|required_with:sell_date|numeric|min:0',
            'currency' => 'string|size:3',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // If account is changing, verify new account belongs to user
        if ($request->has('account_id') && $request->account_id != $investment->account_id) {
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

        $investment->update($request->all());

        // Calculate additional fields
        $investment->current_value = $investment->getCurrentValue();
        $investment->profit_loss = $investment->getProfitLoss();
        $investment->profit_loss_percentage = $investment->getProfitLossPercentage();
        $investment->annual_return = $investment->getAnnualReturn();

        return response()->json([
            'success' => true,
            'message' => 'Investment updated successfully',
            'data' => $investment->load('account')
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $user = Auth::user();
        $investment = Investment::where('user_id', $user->id)->find($id);

        if (!$investment) {
            return response()->json([
                'success' => false,
                'message' => 'Investment not found'
            ], 404);
        }

        $investment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Investment deleted successfully'
        ]);
    }

    /**
     * Get investment performance metrics
     */
    public function performance(Request $request)
    {
        $user = Auth::user();

        // Get all unsold investments
        $investments = Investment::where('user_id', $user->id)
            ->whereNull('sell_date')
            ->with('account')
            ->get();

        // Get all sold investments in the past year
        $soldInvestments = Investment::where('user_id', $user->id)
            ->whereNotNull('sell_date')
            ->where('sell_date', '>=', Carbon::now()->subYear())
            ->with('account')
            ->get();

        // Calculate portfolio value and metrics
        $totalInvested = $investments->sum(function ($investment) {
            return $investment->purchase_price * $investment->quantity;
        });

        $totalValue = $investments->sum(function ($investment) {
            return $investment->current_price * $investment->quantity;
        });

        $totalGainLoss = $totalValue - $totalInvested;
        $totalGainLossPercentage = $totalInvested > 0 ?
            round(($totalGainLoss / $totalInvested) * 100, 2) : 0;

        // Calculate realized gains/losses from sold investments
        $totalRealizedGainLoss = $soldInvestments->sum(function ($investment) {
            $sellValue = $investment->sell_price * $investment->quantity;
            $purchaseValue = $investment->purchase_price * $investment->quantity;
            return $sellValue - $purchaseValue;
        });

        // Group by investment type
        $byType = $investments->groupBy('type')->map(function ($group) {
            $invested = $group->sum(function ($investment) {
                return $investment->purchase_price * $investment->quantity;
            });

            $currentValue = $group->sum(function ($investment) {
                return $investment->current_price * $investment->quantity;
            });

            $gainLoss = $currentValue - $invested;
            $gainLossPercentage = $invested > 0 ? round(($gainLoss / $invested) * 100, 2) : 0;

            return [
                'type' => $group->first()->type,
                'count' => $group->count(),
                'invested' => $invested,
                'current_value' => $currentValue,
                'gain_loss' => $gainLoss,
                'gain_loss_percentage' => $gainLossPercentage,
            ];
        })->values();

        // Top performing investments
        $topPerformers = $investments->sortByDesc(function ($investment) {
            return $investment->getProfitLossPercentage();
        })->take(5)->map(function ($investment) {
            return [
                'id' => $investment->id,
                'name' => $investment->name,
                'symbol' => $investment->symbol,
                'purchase_price' => $investment->purchase_price,
                'current_price' => $investment->current_price,
                'profit_loss' => $investment->getProfitLoss(),
                'profit_loss_percentage' => $investment->getProfitLossPercentage(),
            ];
        })->values();

        // Worst performing investments
        $worstPerformers = $investments->sortBy(function ($investment) {
            return $investment->getProfitLossPercentage();
        })->take(5)->map(function ($investment) {
            return [
                'id' => $investment->id,
                'name' => $investment->name,
                'symbol' => $investment->symbol,
                'purchase_price' => $investment->purchase_price,
                'current_price' => $investment->current_price,
                'profit_loss' => $investment->getProfitLoss(),
                'profit_loss_percentage' => $investment->getProfitLossPercentage(),
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => [
                    'total_invested' => $totalInvested,
                    'total_value' => $totalValue,
                    'total_gain_loss' => $totalGainLoss,
                    'total_gain_loss_percentage' => $totalGainLossPercentage,
                    'total_realized_gain_loss' => $totalRealizedGainLoss,
                    'investment_count' => $investments->count(),
                ],
                'by_type' => $byType,
                'top_performers' => $topPerformers,
                'worst_performers' => $worstPerformers,
            ]
        ]);
    }
}
