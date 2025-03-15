import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

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

// Define API URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Fetch accounts
export const fetchAccounts = createAsyncThunk(
  "accounts/fetchAccounts",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string } };
      const response = await axios.get(`${API_URL}/accounts`, {
        headers: {
          Authorization: `Bearer ${state.auth.token}`,
        },
      });

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
  async (accountData: Partial<Account>, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string } };
      const response = await axios.post(`${API_URL}/accounts`, accountData, {
        headers: {
          Authorization: `Bearer ${state.auth.token}`,
        },
      });

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
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { auth: { token: string } };
      const response = await axios.put(
        `${API_URL}/accounts/${id}`,
        accountData,
        {
          headers: {
            Authorization: `Bearer ${state.auth.token}`,
          },
        }
      );

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
  async (id: number, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string } };
      const response = await axios.delete(`${API_URL}/accounts/${id}`, {
        headers: {
          Authorization: `Bearer ${state.auth.token}`,
        },
      });

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
