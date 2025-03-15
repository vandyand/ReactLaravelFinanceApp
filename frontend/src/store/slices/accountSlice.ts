import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "../../services/api";

// Define types
export interface Account {
  id: number;
  name: string;
  type: string;
  balance: number;
  currency: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface AccountsState {
  accounts: Account[];
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: AccountsState = {
  accounts: [],
  isLoading: false,
  error: null,
};

// Fetch accounts
export const fetchAccounts = createAsyncThunk(
  "accounts/fetchAccounts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`/accounts`);

      if (response.data.success) {
        return response.data.data;
      } else {
        return rejectWithValue(
          response.data.message || "Failed to fetch accounts"
        );
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          "An error occurred while fetching accounts"
      );
    }
  }
);

// Create account
export const createAccount = createAsyncThunk(
  "accounts/createAccount",
  async (accountData: Partial<Account>, { rejectWithValue }) => {
    try {
      const response = await api.post(`/accounts`, accountData);

      if (response.data.success) {
        return response.data.data;
      } else {
        return rejectWithValue(
          response.data.message || "Failed to create account"
        );
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          "An error occurred while creating the account"
      );
    }
  }
);

// Update account
export const updateAccount = createAsyncThunk(
  "accounts/updateAccount",
  async (
    { id, ...accountData }: Partial<Account> & { id: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.put(`/accounts/${id}`, accountData);

      if (response.data.success) {
        return response.data.data;
      } else {
        return rejectWithValue(
          response.data.message || "Failed to update account"
        );
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          "An error occurred while updating the account"
      );
    }
  }
);

// Delete account
export const deleteAccount = createAsyncThunk(
  "accounts/deleteAccount",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/accounts/${id}`);

      if (response.data.success) {
        return id;
      } else {
        return rejectWithValue(
          response.data.message || "Failed to delete account"
        );
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          "An error occurred while deleting the account"
      );
    }
  }
);

// Accounts slice
const accountsSlice = createSlice({
  name: "accounts",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch accounts
    builder
      .addCase(fetchAccounts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accounts = action.payload;
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create account
    builder
      .addCase(createAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createAccount.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accounts.push(action.payload);
      })
      .addCase(createAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update account
    builder
      .addCase(updateAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateAccount.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.accounts.findIndex(
          (account) => account.id === action.payload.id
        );
        if (index !== -1) {
          state.accounts[index] = action.payload;
        }
      })
      .addCase(updateAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete account
    builder
      .addCase(deleteAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteAccount.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accounts = state.accounts.filter(
          (account) => account.id !== action.payload
        );
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = accountsSlice.actions;
export default accountsSlice.reducer;
