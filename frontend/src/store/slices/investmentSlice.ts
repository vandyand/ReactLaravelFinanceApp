import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

// Define types
export interface Investment {
  id: number;
  name: string;
  type: string;
  purchase_value: number;
  current_value: number;
  purchase_date: string;
  symbol: string | null;
  units: number | null;
  notes: string | null;
  performance_value: number;
  performance_percentage: number;
  created_at: string;
  updated_at: string;
}

interface InvestmentsState {
  investments: Investment[];
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: InvestmentsState = {
  investments: [],
  isLoading: false,
  error: null,
};

// Define API URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Fetch investments
export const fetchInvestments = createAsyncThunk(
  "investments/fetchInvestments",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string } };
      const response = await axios.get(`${API_URL}/investments`, {
        headers: {
          Authorization: `Bearer ${state.auth.token}`,
        },
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        return rejectWithValue(
          response.data.message || "Failed to fetch investments"
        );
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          "An error occurred while fetching investments"
      );
    }
  }
);

// Create investment
export const createInvestment = createAsyncThunk(
  "investments/createInvestment",
  async (
    investmentData: Partial<Investment>,
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { auth: { token: string } };
      const response = await axios.post(
        `${API_URL}/investments`,
        investmentData,
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
          response.data.message || "Failed to create investment"
        );
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          "An error occurred while creating the investment"
      );
    }
  }
);

// Update investment
export const updateInvestment = createAsyncThunk(
  "investments/updateInvestment",
  async (
    { id, ...investmentData }: Partial<Investment> & { id: number },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { auth: { token: string } };
      const response = await axios.put(
        `${API_URL}/investments/${id}`,
        investmentData,
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
          response.data.message || "Failed to update investment"
        );
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          "An error occurred while updating the investment"
      );
    }
  }
);

// Delete investment
export const deleteInvestment = createAsyncThunk(
  "investments/deleteInvestment",
  async (id: number, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string } };
      const response = await axios.delete(`${API_URL}/investments/${id}`, {
        headers: {
          Authorization: `Bearer ${state.auth.token}`,
        },
      });

      if (response.data.success) {
        return id;
      } else {
        return rejectWithValue(
          response.data.message || "Failed to delete investment"
        );
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          "An error occurred while deleting the investment"
      );
    }
  }
);

// Investments slice
const investmentsSlice = createSlice({
  name: "investments",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch investments
    builder
      .addCase(fetchInvestments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInvestments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.investments = action.payload;
      })
      .addCase(fetchInvestments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create investment
    builder
      .addCase(createInvestment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createInvestment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.investments.push(action.payload);
      })
      .addCase(createInvestment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update investment
    builder
      .addCase(updateInvestment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateInvestment.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.investments.findIndex(
          (investment) => investment.id === action.payload.id
        );
        if (index !== -1) {
          state.investments[index] = action.payload;
        }
      })
      .addCase(updateInvestment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete investment
    builder
      .addCase(deleteInvestment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteInvestment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.investments = state.investments.filter(
          (investment) => investment.id !== action.payload
        );
      })
      .addCase(deleteInvestment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = investmentsSlice.actions;
export default investmentsSlice.reducer;
