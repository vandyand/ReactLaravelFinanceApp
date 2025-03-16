<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Category;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();
        $categories = Category::where(function ($query) use ($user) {
            $query->where('user_id', $user->id)
                ->orWhereNull('user_id'); // Include system default categories
        })
            ->orderBy('name')
            ->withCount('transactions') // This adds a transactions_count attribute to each category
            ->get();

        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:income,expense,transfer',
            'color' => 'nullable|string|max:7',
            'icon' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:categories,id',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        $category = new Category($request->all());
        $category->user_id = $user->id;
        $category->save();

        return response()->json([
            'success' => true,
            'message' => 'Category created successfully',
            'data' => $category
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = Auth::user();
        $category = Category::where(function ($query) use ($user) {
            $query->where('user_id', $user->id)
                ->orWhereNull('user_id');
        })
            ->find($id);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Category not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $category
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = Auth::user();
        $category = Category::where('user_id', $user->id)->find($id);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Category not found or you do not have permission to edit this category'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'string|max:255',
            'type' => 'string|in:income,expense,transfer',
            'color' => 'nullable|string|max:7',
            'icon' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:categories,id',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $category->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Category updated successfully',
            'data' => $category
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $user = Auth::user();
        $category = Category::where('user_id', $user->id)->find($id);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Category not found or you do not have permission to delete this category'
            ], 404);
        }

        // Check if category has transactions
        if ($category->transactions()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete category with associated transactions'
            ], 400);
        }

        // Check if category has budgets
        if ($category->budgets()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete category with associated budgets'
            ], 400);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Category deleted successfully'
        ]);
    }
}
