import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
  Menu,
  ListItemIcon,
  Tabs,
  Tab,
  TablePagination,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Paper,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  MoreVert as MoreVertIcon,
  AttachMoney as MoneyIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";

import { RootState } from "../store";

// Transaction type
interface Transaction {
  id: number;
  user_id: number;
  account_id: number;
  category_id: number | null;
  amount: number | string;
  name: string;
  description: string | null;
  transaction_date: string;
  type: "income" | "expense";
  status: "completed" | "pending" | "reconciled";
  reference_number: string | null;
  payment_method: string | null;
  currency: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  account: {
    id: number;
    name: string;
  };
  category: {
    id: number;
    name: string;
    color: string;
  } | null;
}

// Account type
interface Account {
  id: number;
  name: string;
}

// Category type
interface Category {
  id: number;
  name: string;
  color: string;
}

// Tab interface
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`transaction-tabpanel-${index}`}
      aria-labelledby={`transaction-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `transaction-tab-${index}`,
    "aria-controls": `transaction-tabpanel-${index}`,
  };
}

const Transactions = () => {
  const { token } = useSelector((state: RootState) => state.auth);

  // State management
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [currentTransaction, setCurrentTransaction] =
    useState<Transaction | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [filters, setFilters] = useState({
    search: "",
    account_id: "",
    category_id: "",
    type: "",
    date_from: null as Date | null,
    date_to: null as Date | null,
  });
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    number | null
  >(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    // Fix for timezone issue: Parse the date parts directly to prevent timezone shifts
    const [year, month, day] = dateString.split("T")[0].split("-").map(Number);
    // Create date with explicit year, month (0-indexed), and day
    const date = new Date(year, month - 1, day);

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // Format date for API
  const formatDateForApi = (date: Date | null): string | null => {
    if (!date) return null;
    // Format as YYYY-MM-DD
    return date.toISOString().split("T")[0];
  };

  // Fetch accounts and categories
  useEffect(() => {
    const fetchAccountsAndCategories = async () => {
      try {
        const [accountsResponse, categoriesResponse] = await Promise.all([
          axios.get(`${API_URL}/accounts`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          axios.get(`${API_URL}/categories`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if (accountsResponse.data.success) {
          setAccounts(accountsResponse.data.data);
        }

        if (categoriesResponse.data.success) {
          setCategories(categoriesResponse.data.data);
        }
      } catch (err) {
        console.error("Error fetching reference data:", err);
      }
    };

    fetchAccountsAndCategories();
  }, [token, API_URL]);

  // Fetch transactions function
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Prepare query parameters
      const params = new URLSearchParams();
      params.append("page", (page + 1).toString());
      // Ensure we're using the correct parameter name for Laravel pagination
      params.append("per_page", rowsPerPage.toString()); // 'per_page' instead of 'limit'

      if (filters.search) params.append("search", filters.search);
      if (filters.account_id)
        params.append("account_id", filters.account_id.toString());
      if (filters.category_id)
        params.append("category_id", filters.category_id.toString());
      if (filters.type) params.append("type", filters.type);

      // Properly format dates for the API
      const fromDate = formatDateForApi(filters.date_from);
      const toDate = formatDateForApi(filters.date_to);

      if (fromDate) {
        params.append("date_from", fromDate);
      }

      if (toDate) {
        params.append("date_to", toDate);
      }

      // Tab filter
      if (tabValue === 1) params.append("type", "income");
      if (tabValue === 2) params.append("type", "expense");

      const response = await axios.get(
        `${API_URL}/transactions?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data && response.data.success) {
        // Based on your console logs, the response has a specific structure:
        // response.data.data contains properties:
        // - current_page, data (array of transactions), first_page_url, etc.

        let transactionsData = [];
        let total = 0;

        if (response.data.data) {
          // Check if data is in Laravel's paginated response format
          if (
            response.data.data.data &&
            Array.isArray(response.data.data.data)
          ) {
            // This is the format in your logs - data.data is the array of transactions
            transactionsData = response.data.data.data;
            total = response.data.data.total || 0;
          } else if (Array.isArray(response.data.data)) {
            // Direct array of transactions
            transactionsData = response.data.data;
            total = transactionsData.length;
          }
        }

        setTransactions(transactionsData);
        setTotalTransactions(total);
      } else {
        console.error("API response indicates failure:", response.data);
        setError("Failed to fetch transactions");
        setTransactions([]);
        setTotalTransactions(0);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError("An error occurred while fetching transactions");
      setTransactions([]);
      setTotalTransactions(0);
    } finally {
      setLoading(false);
    }
  };

  // Fetch transactions on component mount and when dependencies change
  useEffect(() => {
    fetchTransactions();
  }, [token, API_URL, page, rowsPerPage, filters, tabValue]);

  // Form validation schema
  const validationSchema = Yup.object({
    account_id: Yup.number().required("Account is required"),
    category_id: Yup.number().nullable(),
    amount: Yup.number()
      .required("Amount is required")
      .moreThan(0, "Amount must be greater than 0"),
    name: Yup.string().required("Name is required"),
    transaction_date: Yup.date()
      .required("Date is required")
      .max(new Date(), "Date cannot be in the future"),
    type: Yup.string()
      .oneOf(["income", "expense"])
      .required("Type is required"),
    status: Yup.string()
      .oneOf(["completed", "pending", "reconciled"])
      .required("Status is required"),
    reference_number: Yup.string().nullable(),
    notes: Yup.string().nullable(),
  });

  // Form handling
  const formik = useFormik({
    initialValues: {
      account_id: "",
      category_id: "",
      amount: "",
      name: "",
      description: "",
      transaction_date: new Date(),
      type: "expense",
      status: "completed",
      reference_number: "",
      notes: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setActionInProgress(true);
      try {
        // Format date
        const formattedValues = {
          ...values,
          transaction_date:
            values.transaction_date instanceof Date
              ? values.transaction_date.toISOString().split("T")[0]
              : values.transaction_date,
          amount: parseFloat(values.amount as unknown as string),
          account_id: parseInt(values.account_id as unknown as string, 10),
          category_id: values.category_id
            ? parseInt(values.category_id as unknown as string, 10)
            : null,
        };

        if (dialogMode === "add") {
          // Create new transaction
          const response = await axios.post(
            `${API_URL}/transactions`,
            formattedValues,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.data.success) {
            setSnackbar({
              open: true,
              message: "Transaction created successfully",
              severity: "success",
            });
            handleCloseDialog();
            // Refresh transactions
            setPage(0);
          }
        } else if (dialogMode === "edit" && currentTransaction) {
          // Update existing transaction
          const response = await axios.put(
            `${API_URL}/transactions/${currentTransaction.id}`,
            formattedValues,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.data.success) {
            setSnackbar({
              open: true,
              message: "Transaction updated successfully",
              severity: "success",
            });
            handleCloseDialog();
            // Refresh transactions
            setPage(0);
          }
        }
      } catch (err) {
        console.error("Error saving transaction:", err);
        setSnackbar({
          open: true,
          message: "Failed to save transaction",
          severity: "error",
        });
      } finally {
        setActionInProgress(false);
      }
    },
  });

  // Handle transaction menu click
  const handleTransactionMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    transactionId: number
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedTransactionId(transactionId);
  };

  // Handle transaction menu close
  const handleTransactionMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle edit transaction
  const handleEditTransaction = () => {
    handleTransactionMenuClose();
    const transaction = transactions.find(
      (t) => t.id === selectedTransactionId
    );
    if (transaction) {
      setCurrentTransaction(transaction);
      setDialogMode("edit");
      formik.setValues({
        account_id: transaction.account_id.toString(),
        category_id: transaction.category_id
          ? transaction.category_id.toString()
          : "",
        amount: transaction.amount.toString(),
        name: transaction.name,
        description: transaction.description || "",
        transaction_date: new Date(transaction.transaction_date),
        type: transaction.type,
        status: transaction.status,
        reference_number: transaction.reference_number || "",
        notes: transaction.notes || "",
      });
      setOpenDialog(true);
    }
  };

  // Handle delete transaction
  const handleDeleteConfirm = () => {
    handleTransactionMenuClose();
    setConfirmDeleteDialog(true);
  };

  // Confirm delete transaction
  const confirmDelete = async () => {
    if (!selectedTransactionId) {
      return;
    }

    setActionInProgress(true);
    try {
      const response = await axios.delete(
        `${API_URL}/transactions/${selectedTransactionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Remove the deleted transaction from the state
        setTransactions(
          transactions.filter(
            (transaction) => transaction.id !== selectedTransactionId
          )
        );
        setSnackbar({
          open: true,
          message: "Transaction deleted successfully",
          severity: "success",
        });
        // Refresh the transactions list after deletion
        fetchTransactions();
      } else {
        console.error("API indicated failure:", response.data);
        setSnackbar({
          open: true,
          message:
            "Failed to delete transaction: " +
            (response.data.message || "Unknown error"),
          severity: "error",
        });
      }
    } catch (err) {
      console.error("Error deleting transaction:", err);
      setSnackbar({
        open: true,
        message:
          "Failed to delete transaction: " +
          (err instanceof Error ? err.message : "Unknown error"),
        severity: "error",
      });
    } finally {
      setConfirmDeleteDialog(false);
      setActionInProgress(false);
      setSelectedTransactionId(null);
    }
  };

  // Handle add transaction button click
  const handleAddTransactionClick = () => {
    setDialogMode("add");
    setCurrentTransaction(null);
    formik.resetForm();
    setOpenDialog(true);
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    formik.resetForm();
  };

  // Handle page change
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    // Update rowsPerPage from the event
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);

    // Reset to first page when changing rows per page
    setPage(0);
  };

  // Handle filter change
  const handleFilterChange = (name: string, value: any) => {
    setFilters({
      ...filters,
      [name]: value,
    });
    // Reset to first page when changing filters
    setPage(0);
  };

  // Handle date filter change specifically
  const handleDateFilterChange = (
    name: "date_from" | "date_to",
    date: Date | null
  ) => {
    setFilters((prev) => ({
      ...prev,
      [name]: date,
    }));
    // Reset to first page when changing filters
    setPage(0);
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      search: "",
      account_id: "",
      category_id: "",
      type: "",
      date_from: null,
      date_to: null,
    });
    setPage(0);
  };

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Transactions
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage your income and expenses
        </Typography>
      </Box>

      {/* Filter and action bar */}
      <Card elevation={0} sx={{ mb: 3, p: 2, borderRadius: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <TextField
            size="small"
            placeholder="Search transactions..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            sx={{ flexGrow: 1, minWidth: "200px" }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <FormControl size="small" sx={{ minWidth: "150px" }}>
            <InputLabel id="account-filter-label">Account</InputLabel>
            <Select
              labelId="account-filter-label"
              id="account-filter"
              value={filters.account_id}
              onChange={(e) => handleFilterChange("account_id", e.target.value)}
              label="Account"
            >
              <MenuItem value="">All Accounts</MenuItem>
              {accounts.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  {account.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: "150px" }}>
            <InputLabel id="category-filter-label">Category</InputLabel>
            <Select
              labelId="category-filter-label"
              id="category-filter"
              value={filters.category_id}
              onChange={(e) =>
                handleFilterChange("category_id", e.target.value)
              }
              label="Category"
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: "150px" }}>
            <InputLabel id="type-filter-label">Type</InputLabel>
            <Select
              labelId="type-filter-label"
              id="type-filter"
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              label="Type"
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="income">Income</MenuItem>
              <MenuItem value="expense">Expense</MenuItem>
            </Select>
          </FormControl>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="From Date"
              value={filters.date_from}
              onChange={(date) => handleDateFilterChange("date_from", date)}
              slotProps={{
                textField: {
                  size: "small",
                  sx: { minWidth: "150px" },
                  onBlur: () => fetchTransactions(), // Trigger fetch on blur
                },
              }}
            />
            <DatePicker
              label="To Date"
              value={filters.date_to}
              onChange={(date) => handleDateFilterChange("date_to", date)}
              slotProps={{
                textField: {
                  size: "small",
                  sx: { minWidth: "150px" },
                  onBlur: () => fetchTransactions(), // Trigger fetch on blur
                },
              }}
            />
          </LocalizationProvider>

          <Tooltip title="Clear Filters">
            <IconButton
              onClick={handleClearFilters}
              disabled={
                !filters.search &&
                !filters.account_id &&
                !filters.category_id &&
                !filters.type &&
                !filters.date_from &&
                !filters.date_to
              }
            >
              <ClearIcon />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddTransactionClick}
            sx={{ ml: "auto" }}
          >
            Add Transaction
          </Button>
        </Box>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Transactions" {...a11yProps(0)} />
          <Tab
            label="Income"
            icon={<IncomeIcon />}
            iconPosition="start"
            {...a11yProps(1)}
          />
          <Tab
            label="Expenses"
            icon={<ExpenseIcon />}
            iconPosition="start"
            {...a11yProps(2)}
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        {renderTransactionTable()}
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        {renderTransactionTable()}
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        {renderTransactionTable()}
      </TabPanel>

      {/* Add/Edit Transaction Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === "add" ? "Add New Transaction" : "Edit Transaction"}
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" variant="outlined">
                  <InputLabel id="type-label">Transaction Type</InputLabel>
                  <Select
                    labelId="type-label"
                    id="type"
                    name="type"
                    value={formik.values.type}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.type && Boolean(formik.errors.type)}
                    label="Transaction Type"
                  >
                    <MenuItem value="income">Income</MenuItem>
                    <MenuItem value="expense">Expense</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" variant="outlined">
                  <InputLabel id="account-label">Account</InputLabel>
                  <Select
                    labelId="account-label"
                    id="account_id"
                    name="account_id"
                    value={formik.values.account_id}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.account_id &&
                      Boolean(formik.errors.account_id)
                    }
                    label="Account"
                  >
                    {accounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="amount"
                  name="amount"
                  label="Amount"
                  type="number"
                  value={formik.values.amount}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.amount && Boolean(formik.errors.amount)}
                  helperText={formik.touched.amount && formik.errors.amount}
                  margin="normal"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">$</InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Transaction Date"
                    value={formik.values.transaction_date}
                    onChange={(date) =>
                      formik.setFieldValue("transaction_date", date)
                    }
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: "normal",
                        variant: "outlined",
                        error:
                          formik.touched.transaction_date &&
                          Boolean(formik.errors.transaction_date),
                        helperText:
                          formik.touched.transaction_date &&
                          (formik.errors.transaction_date as string),
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="name"
                  name="name"
                  label="Name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="description"
                  name="description"
                  label="Description (Optional)"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.description &&
                    Boolean(formik.errors.description)
                  }
                  helperText={
                    formik.touched.description && formik.errors.description
                  }
                  margin="normal"
                  variant="outlined"
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" variant="outlined">
                  <InputLabel id="category-label">Category</InputLabel>
                  <Select
                    labelId="category-label"
                    id="category_id"
                    name="category_id"
                    value={formik.values.category_id}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.category_id &&
                      Boolean(formik.errors.category_id)
                    }
                    label="Category"
                  >
                    <MenuItem value="">No Category</MenuItem>
                    {categories
                      .filter((category) =>
                        formik.values.type === "income"
                          ? category.name.toLowerCase().includes("income")
                          : !category.name.toLowerCase().includes("income")
                      )
                      .map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" variant="outlined">
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    id="status"
                    name="status"
                    value={formik.values.status}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.status && Boolean(formik.errors.status)
                    }
                    label="Status"
                  >
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="reconciled">Reconciled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="reference_number"
                  name="reference_number"
                  label="Reference (Optional)"
                  value={formik.values.reference_number}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.reference_number &&
                    Boolean(formik.errors.reference_number)
                  }
                  helperText={
                    formik.touched.reference_number &&
                    formik.errors.reference_number
                  }
                  margin="normal"
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="notes"
                  name="notes"
                  label="Notes (Optional)"
                  value={formik.values.notes}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.notes && Boolean(formik.errors.notes)}
                  helperText={formik.touched.notes && formik.errors.notes}
                  margin="normal"
                  variant="outlined"
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={actionInProgress}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={actionInProgress}
            >
              {actionInProgress ? (
                <CircularProgress size={24} color="inherit" />
              ) : dialogMode === "add" ? (
                "Add Transaction"
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog
        open={confirmDeleteDialog}
        onClose={() => setConfirmDeleteDialog(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this transaction? This action cannot
            be undone.
          </Typography>
          <Typography sx={{ mt: 2, fontWeight: "bold" }}>
            Transaction ID: {selectedTransactionId}
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
            onClick={() => {
              confirmDelete();
            }}
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

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleTransactionMenuClose}
      >
        <MenuItem onClick={handleEditTransaction}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Edit Transaction
        </MenuItem>
        <MenuItem onClick={handleDeleteConfirm}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          Delete Transaction
        </MenuItem>
      </Menu>

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

  // Helper function to render transaction table
  function renderTransactionTable() {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (!transactions || transactions.length === 0) {
      return (
        <Card elevation={0} sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
          <MoneyIcon sx={{ fontSize: 60, color: "primary.light", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No transactions found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {tabValue === 0
              ? "Start tracking your finances by adding your first transaction"
              : tabValue === 1
              ? "No income transactions found for the selected filters"
              : "No expense transactions found for the selected filters"}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddTransactionClick}
          >
            Add Transaction
          </Button>
        </Card>
      );
    }

    return (
      <>
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ borderRadius: 2 }}
        >
          <Table sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Account</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(transactions) && transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {transaction.transaction_date
                        ? formatDate(transaction.transaction_date)
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {transaction.name ||
                        transaction.description ||
                        "Unnamed Transaction"}
                    </TableCell>
                    <TableCell>
                      {transaction.category ? (
                        <Chip
                          label={transaction.category.name}
                          size="small"
                          sx={{
                            backgroundColor: `${
                              transaction.category.color || "#777"
                            }20`,
                            color: transaction.category.color || "#777",
                          }}
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No Category
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {transaction.account?.name || "Unknown Account"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          transaction.status
                            ? transaction.status.charAt(0).toUpperCase() +
                              transaction.status.slice(1)
                            : "Unknown"
                        }
                        size="small"
                        color={
                          transaction.status === "completed"
                            ? "success"
                            : transaction.status === "pending"
                            ? "warning"
                            : "info"
                        }
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        color={
                          transaction.type === "income"
                            ? "success.main"
                            : "error.main"
                        }
                        fontWeight="medium"
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {formatCurrency(
                          Math.abs(Number(transaction.amount) || 0)
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) =>
                          handleTransactionMenuClick(e, transaction.id)
                        }
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No transactions found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalTransactions}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ mt: 2 }}
        />
      </>
    );
  }
};

export default Transactions;
