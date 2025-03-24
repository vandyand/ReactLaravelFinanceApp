import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// Define types
export interface Budget {
  id: number;
  name: string;
  amount: number;
  start_date: string;
  end_date: string;
  category_id: number | null;
  notes: string | null;
  is_active: boolean;
  spend_amount: number;
  remaining_amount: number;
  percentage_used: number;
  created_at: string;
  updated_at: string;
  category: {
    id: number;
    name: string;
    color: string;
  } | null;
}

interface BudgetsState {
  budgets: Budget[];
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: BudgetsState = {
  budgets: [],
  isLoading: false,
  error: null,
};

// Fetch budgets
export const fetchBudgets = createAsyncThunk(
  "budgets/fetchBudgets",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`/budgets`);

      if (response.data.success) {
        return response.data.data;
      } else {
        return rejectWithValue(
          response.data.message || "Failed to fetch budgets"
        );
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          "An error occurred while fetching budgets"
      );
    }
  }
);

// Create budget
export const createBudget = createAsyncThunk(
  "budgets/createBudget",
  async (budgetData: Partial<Budget>, { rejectWithValue }) => {
    try {
      const response = await api.post(`/budgets`, budgetData);

      if (response.data.success) {
        return response.data.data;
      } else {
        return rejectWithValue(
          response.data.message || "Failed to create budget"
        );
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          "An error occurred while creating the budget"
      );
    }
  }
);

// Update budget
export const updateBudget = createAsyncThunk(
  "budgets/updateBudget",
  async (
    { id, ...budgetData }: Partial<Budget> & { id: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.put(`/budgets/${id}`, budgetData);

      if (response.data.success) {
        return response.data.data;
      } else {
        return rejectWithValue(
          response.data.message || "Failed to update budget"
        );
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          "An error occurred while updating the budget"
      );
    }
  }
);

// Delete budget
export const deleteBudget = createAsyncThunk(
  "budgets/deleteBudget",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/budgets/${id}`);

      if (response.data.success) {
        return id;
      } else {
        return rejectWithValue(
          response.data.message || "Failed to delete budget"
        );
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          "An error occurred while deleting the budget"
      );
    }
  }
);

// Budgets slice
const budgetsSlice = createSlice({
  name: "budgets",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch budgets
    builder
      .addCase(fetchBudgets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBudgets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.budgets = action.payload;
      })
      .addCase(fetchBudgets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create budget
    builder
      .addCase(createBudget.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createBudget.fulfilled, (state, action) => {
        state.isLoading = false;
        state.budgets.push(action.payload);
      })
      .addCase(createBudget.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update budget
    builder
      .addCase(updateBudget.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateBudget.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.budgets.findIndex(
          (budget) => budget.id === action.payload.id
        );
        if (index !== -1) {
          state.budgets[index] = action.payload;
        }
      })
      .addCase(updateBudget.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete budget
    builder
      .addCase(deleteBudget.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteBudget.fulfilled, (state, action) => {
        state.isLoading = false;
        state.budgets = state.budgets.filter(
          (budget) => budget.id !== action.payload
        );
      })
      .addCase(deleteBudget.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = budgetsSlice.actions;
export default budgetsSlice.reducer;
