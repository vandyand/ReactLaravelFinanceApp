import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  CircularProgress,
  InputAdornment,
  TextField,
} from "@mui/material";
import { Add as AddIcon, Search as SearchIcon } from "@mui/icons-material";
import axios from "axios";
import { format } from "date-fns";

import { RootState } from "../store";
import InvestmentList from "../components/investments/InvestmentList";
import InvestmentForm from "../components/investments/InvestmentForm";
import InvestmentOverview from "../components/investments/InvestmentOverview";

// Investment type
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

const Investments = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [currentInvestment, setCurrentInvestment] = useState<Investment | null>(
    null
  );
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [search, setSearch] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

  // Fetch investments
  useEffect(() => {
    const fetchInvestments = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/investments`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          setInvestments(response.data.data);
        } else {
          setError("Failed to fetch investments");
        }
      } catch (err) {
        console.error("Error fetching investments:", err);
        setError("An error occurred while fetching investments");
      } finally {
        setLoading(false);
      }
    };

    fetchInvestments();
  }, [token, API_URL]);

  // Filtered investments
  const filteredInvestments =
    search.trim() === ""
      ? investments
      : investments.filter(
          (investment) =>
            investment.name.toLowerCase().includes(search.toLowerCase()) ||
            investment.type.toLowerCase().includes(search.toLowerCase()) ||
            (investment.symbol &&
              investment.symbol.toLowerCase().includes(search.toLowerCase())) ||
            (investment.notes &&
              investment.notes.toLowerCase().includes(search.toLowerCase()))
        );

  // Handle add investment
  const handleAddInvestment = () => {
    setDialogMode("add");
    setCurrentInvestment(null);
    setOpenDialog(true);
  };

  // Handle edit investment
  const handleEditInvestment = (investment: Investment) => {
    setDialogMode("edit");
    setCurrentInvestment(investment);
    setOpenDialog(true);
  };

  // Handle delete investment
  const handleDeleteInvestment = (investmentId: number) => {
    setCurrentInvestment(
      investments.find((i) => i.id === investmentId) || null
    );
    setConfirmDeleteDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Handle form submit
  const handleFormSubmit = async (values: any) => {
    setActionInProgress(true);
    try {
      // Format values
      const formattedValues = {
        ...values,
        purchase_date: format(values.purchase_date, "yyyy-MM-dd"),
        purchase_value: parseFloat(values.purchase_value),
        current_value: parseFloat(values.current_value),
        units: values.units ? parseFloat(values.units) : null,
      };

      if (dialogMode === "add") {
        // Create new investment
        const response = await axios.post(
          `${API_URL}/investments`,
          formattedValues,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          setInvestments([...investments, response.data.data]);
          setSnackbar({
            open: true,
            message: "Investment created successfully",
            severity: "success",
          });
          handleCloseDialog();
        }
      } else if (dialogMode === "edit" && currentInvestment) {
        // Update existing investment
        const response = await axios.put(
          `${API_URL}/investments/${currentInvestment.id}`,
          formattedValues,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          setInvestments(
            investments.map((investment) =>
              investment.id === currentInvestment.id
                ? response.data.data
                : investment
            )
          );
          setSnackbar({
            open: true,
            message: "Investment updated successfully",
            severity: "success",
          });
          handleCloseDialog();
        }
      }
    } catch (err) {
      console.error("Error saving investment:", err);
      setSnackbar({
        open: true,
        message: "Failed to save investment",
        severity: "error",
      });
    } finally {
      setActionInProgress(false);
    }
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!currentInvestment) return;

    setActionInProgress(true);
    try {
      const response = await axios.delete(
        `${API_URL}/investments/${currentInvestment.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setInvestments(
          investments.filter(
            (investment) => investment.id !== currentInvestment.id
          )
        );
        setSnackbar({
          open: true,
          message: "Investment deleted successfully",
          severity: "success",
        });
      }
    } catch (err) {
      console.error("Error deleting investment:", err);
      setSnackbar({
        open: true,
        message: "Failed to delete investment",
        severity: "error",
      });
    } finally {
      setConfirmDeleteDialog(false);
      setActionInProgress(false);
      setCurrentInvestment(null);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Investments
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Track and manage your investment portfolio
        </Typography>
      </Box>

      {/* Investment Overview */}
      <InvestmentOverview investments={investments} />

      {/* Search and Add */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <TextField
          placeholder="Search investments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ flexGrow: 1, maxWidth: "400px" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddInvestment}
        >
          Add Investment
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Investment List */}
      <InvestmentList
        investments={filteredInvestments}
        loading={loading}
        onEditInvestment={handleEditInvestment}
        onDeleteInvestment={handleDeleteInvestment}
        onAddInvestment={handleAddInvestment}
      />

      {/* Investment Form */}
      <InvestmentForm
        open={openDialog}
        onClose={handleCloseDialog}
        onSubmit={handleFormSubmit}
        currentInvestment={currentInvestment}
        mode={dialogMode}
        actionInProgress={actionInProgress}
      />

      {/* Confirm Delete Dialog */}
      <Dialog
        open={confirmDeleteDialog}
        onClose={() => setConfirmDeleteDialog(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{" "}
            {currentInvestment
              ? `"${currentInvestment.name}"`
              : "this investment"}
            ? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDeleteDialog(false)}
            disabled={actionInProgress}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={actionInProgress}
          >
            {actionInProgress ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Delete"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Investments;
