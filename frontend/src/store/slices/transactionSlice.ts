import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "../../services/api";

// Define types
export interface Transaction {
  id: number;
  account_id: number;
  category_id: number | null;
  amount: number;
  description: string;
  transaction_date: string;
  type: "income" | "expense";
  status: "completed" | "pending" | "reconciled";
  reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  account?: {
    id: number;
    name: string;
  };
  category?: {
    id: number;
    name: string;
    color: string;
  } | null;
}

interface TransactionsState {
  transactions: Transaction[];
  totalTransactions: number;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: TransactionsState = {
  transactions: [],
  totalTransactions: 0,
  isLoading: false,
  error: null,
};

// Fetch transactions
export const fetchTransactions = createAsyncThunk(
  "transactions/fetchTransactions",
  async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      account_id?: number;
      category_id?: number;
      type?: string;
      date_from?: string;
      date_to?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      // Prepare query parameters
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());
      if (params.search) queryParams.append("search", params.search);
      if (params.account_id)
        queryParams.append("account_id", params.account_id.toString());
      if (params.category_id)
        queryParams.append("category_id", params.category_id.toString());
      if (params.type) queryParams.append("type", params.type);
      if (params.date_from) queryParams.append("date_from", params.date_from);
      if (params.date_to) queryParams.append("date_to", params.date_to);

      const response = await api.get(`/transactions?${queryParams.toString()}`);

      if (response.data.success) {
        return {
          transactions: response.data.data,
          totalTransactions: response.data.meta.total,
        };
      } else {
        return rejectWithValue(
          response.data.message || "Failed to fetch transactions"
        );
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          "An error occurred while fetching transactions"
      );
    }
  }
);

// Create transaction
export const createTransaction = createAsyncThunk(
  "transactions/createTransaction",
  async (transactionData: Partial<Transaction>, { rejectWithValue }) => {
    try {
      const response = await api.post(`/transactions`, transactionData);

      if (response.data.success) {
        return response.data.data;
      } else {
        return rejectWithValue(
          response.data.message || "Failed to create transaction"
        );
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          "An error occurred while creating the transaction"
      );
    }
  }
);

// Update transaction
export const updateTransaction = createAsyncThunk(
  "transactions/updateTransaction",
  async (
    { id, ...transactionData }: Partial<Transaction> & { id: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.put(`/transactions/${id}`, transactionData);

      if (response.data.success) {
        return response.data.data;
      } else {
        return rejectWithValue(
          response.data.message || "Failed to update transaction"
        );
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          "An error occurred while updating the transaction"
      );
    }
  }
);

// Delete transaction
export const deleteTransaction = createAsyncThunk(
  "transactions/deleteTransaction",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/transactions/${id}`);

      if (response.data.success) {
        return id;
      } else {
        return rejectWithValue(
          response.data.message || "Failed to delete transaction"
        );
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          "An error occurred while deleting the transaction"
      );
    }
  }
);

// Transactions slice
const transactionsSlice = createSlice({
  name: "transactions",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch transactions
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = action.payload.transactions;
        state.totalTransactions = action.payload.totalTransactions;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create transaction
    builder
      .addCase(createTransaction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions.unshift(action.payload);
        state.totalTransactions += 1;
      })
      .addCase(createTransaction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update transaction
    builder
      .addCase(updateTransaction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTransaction.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.transactions.findIndex(
          (transaction) => transaction.id === action.payload.id
        );
        if (index !== -1) {
          state.transactions[index] = action.payload;
        }
      })
      .addCase(updateTransaction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete transaction
    builder
      .addCase(deleteTransaction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = state.transactions.filter(
          (transaction) => transaction.id !== action.payload
        );
        state.totalTransactions -= 1;
      })
      .addCase(deleteTransaction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = transactionsSlice.actions;
export default transactionsSlice.reducer;
