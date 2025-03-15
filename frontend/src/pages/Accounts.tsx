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
  Tooltip,
  LinearProgress,
  Chip,
  Divider,
  Avatar,
  CardContent,
  Menu,
  ListItemIcon,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountBalance as BankIcon,
  CreditCard as CreditCardIcon,
  Savings as SavingsIcon,
  MoreVert as MoreVertIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
} from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";

import { RootState } from "../store";

// Account type definitions
type AccountType =
  | "checking"
  | "savings"
  | "credit_card"
  | "investment"
  | "cash"
  | "other";

interface Account {
  id: number;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  institution: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const accountTypeIcons: Record<AccountType, React.ReactNode> = {
  checking: <BankIcon />,
  savings: <SavingsIcon />,
  credit_card: <CreditCardIcon />,
  investment: <SavingsIcon />,
  cash: <BankIcon />,
  other: <BankIcon />,
};

const accountTypeLabels: Record<AccountType, string> = {
  checking: "Checking",
  savings: "Savings",
  credit_card: "Credit Card",
  investment: "Investment",
  cash: "Cash",
  other: "Other",
};

// Currency options
const currencies = [
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British Pound (£)" },
  { value: "JPY", label: "Japanese Yen (¥)" },
  { value: "CAD", label: "Canadian Dollar (C$)" },
  { value: "AUD", label: "Australian Dollar (A$)" },
];

const Accounts = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(
    null
  );

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

  // Format currency
  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Fetch accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await axios.get(`${API_URL}/accounts`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          setAccounts(response.data.data);
        } else {
          setError("Failed to fetch accounts");
        }
      } catch (err) {
        console.error("Error fetching accounts:", err);
        setError("An error occurred while fetching accounts");
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [token, API_URL]);

  // Form validation schema
  const validationSchema = Yup.object({
    name: Yup.string().required("Account name is required"),
    type: Yup.string().required("Account type is required"),
    balance: Yup.number().required("Balance is required"),
    currency: Yup.string().required("Currency is required"),
    institution: Yup.string().required("Institution name is required"),
    is_active: Yup.boolean(),
    notes: Yup.string().nullable(),
  });

  // Form handling
  const formik = useFormik({
    initialValues: {
      name: "",
      type: "checking" as AccountType,
      balance: 0,
      currency: "USD",
      institution: "",
      is_active: true,
      notes: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setActionInProgress(true);
      try {
        if (dialogMode === "add") {
          // Create new account
          const response = await axios.post(`${API_URL}/accounts`, values, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.data.success) {
            setAccounts([...accounts, response.data.data]);
            setSnackbar({
              open: true,
              message: "Account created successfully",
              severity: "success",
            });
            handleCloseDialog();
          }
        } else if (dialogMode === "edit" && currentAccount) {
          // Update existing account
          const response = await axios.put(
            `${API_URL}/accounts/${currentAccount.id}`,
            values,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.data.success) {
            setAccounts(
              accounts.map((account) =>
                account.id === currentAccount.id ? response.data.data : account
              )
            );
            setSnackbar({
              open: true,
              message: "Account updated successfully",
              severity: "success",
            });
            handleCloseDialog();
          }
        }
      } catch (err) {
        console.error("Error saving account:", err);
        setSnackbar({
          open: true,
          message: "Failed to save account",
          severity: "error",
        });
      } finally {
        setActionInProgress(false);
      }
    },
  });

  // Handle account menu click
  const handleAccountMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    accountId: number
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedAccountId(accountId);
  };

  // Handle account menu close
  const handleAccountMenuClose = () => {
    setAnchorEl(null);
    setSelectedAccountId(null);
  };

  // Handle edit account
  const handleEditAccount = () => {
    handleAccountMenuClose();
    const account = accounts.find((a) => a.id === selectedAccountId);
    if (account) {
      setCurrentAccount(account);
      setDialogMode("edit");
      formik.setValues({
        name: account.name,
        type: account.type,
        balance: account.balance,
        currency: account.currency,
        institution: account.institution,
        is_active: account.is_active,
        notes: account.notes || "",
      });
      setOpenDialog(true);
    }
  };

  // Handle delete account
  const handleDeleteConfirm = () => {
    handleAccountMenuClose();
    setConfirmDeleteDialog(true);
  };

  // Confirm delete account
  const confirmDelete = async () => {
    if (!selectedAccountId) return;

    setActionInProgress(true);
    try {
      const response = await axios.delete(
        `${API_URL}/accounts/${selectedAccountId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setAccounts(
          accounts.filter((account) => account.id !== selectedAccountId)
        );
        setSnackbar({
          open: true,
          message: "Account deleted successfully",
          severity: "success",
        });
      }
    } catch (err) {
      console.error("Error deleting account:", err);
      setSnackbar({
        open: true,
        message: "Failed to delete account",
        severity: "error",
      });
    } finally {
      setConfirmDeleteDialog(false);
      setActionInProgress(false);
      setSelectedAccountId(null);
    }
  };

  // Handle add account button click
  const handleAddAccountClick = () => {
    setDialogMode("add");
    setCurrentAccount(null);
    formik.resetForm();
    setOpenDialog(true);
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    formik.resetForm();
  };

  // Calculate total balance
  const totalBalance = accounts.reduce((sum, account) => {
    // For credit cards, we typically subtract the balance
    if (account.type === "credit_card") {
      return sum - account.balance;
    }
    return sum + account.balance;
  }, 0);

  // Group accounts by type
  const accountsByType = accounts.reduce((acc, account) => {
    const type = account.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(account);
    return acc;
  }, {} as Record<AccountType, Account[]>);

  if (loading) {
    return (
      <Box sx={{ width: "100%", mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Accounts
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage your financial accounts
        </Typography>
      </Box>

      {/* Total Balance Summary */}
      <Box sx={{ mb: 4 }}>
        <Card elevation={0} sx={{ p: 3, borderRadius: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography variant="h6" color="text.secondary">
                Total Balance
              </Typography>
              <Typography variant="h3" fontWeight="bold" sx={{ mt: 1 }}>
                {formatCurrency(totalBalance)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Across {accounts.length}{" "}
                {accounts.length === 1 ? "account" : "accounts"}
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddAccountClick}
            >
              Add Account
            </Button>
          </Box>
        </Card>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* Account Cards */}
      {Object.entries(accountsByType).map(([type, accountsOfType]) => (
        <Box key={type} sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: "flex", alignItems: "center" }}
          >
            {accountTypeIcons[type as AccountType]}
            <Box sx={{ ml: 1 }}>
              {accountTypeLabels[type as AccountType]} Accounts
            </Box>
          </Typography>
          <Grid container spacing={3}>
            {accountsOfType.map((account) => (
              <Grid item key={account.id} xs={12} sm={6} md={4}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 2,
                    height: "100%",
                    position: "relative",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
                    },
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {account.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {account.institution}
                        </Typography>
                        {!account.is_active && (
                          <Chip
                            size="small"
                            label="Inactive"
                            color="default"
                            sx={{ mt: 1, bgcolor: "rgba(0,0,0,0.08)" }}
                          />
                        )}
                      </Box>
                      <IconButton
                        aria-label="account settings"
                        onClick={(e) => handleAccountMenuClick(e, account.id)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>

                    <Box sx={{ mt: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Current Balance
                      </Typography>
                      <Typography
                        variant="h5"
                        fontWeight="bold"
                        sx={{ mt: 0.5 }}
                      >
                        {formatCurrency(account.balance, account.currency)}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        position: "absolute",
                        bottom: 16,
                        right: 16,
                      }}
                    >
                      <Typography variant="body2" color="primary">
                        View Transactions
                      </Typography>
                      <KeyboardArrowRightIcon
                        color="primary"
                        fontSize="small"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}

      {accounts.length === 0 && !loading && !error && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Box sx={{ mb: 2 }}>
            <Avatar
              sx={{
                bgcolor: "primary.light",
                width: 80,
                height: 80,
                margin: "0 auto",
              }}
            >
              <BankIcon sx={{ fontSize: 40 }} />
            </Avatar>
          </Box>
          <Typography variant="h6" gutterBottom>
            No Accounts Yet
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Add your first account to start tracking your finances
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddAccountClick}
          >
            Add Account
          </Button>
        </Box>
      )}

      {/* Add/Edit Account Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === "add" ? "Add New Account" : "Edit Account"}
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="name"
                  name="name"
                  label="Account Name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" variant="outlined">
                  <InputLabel id="type-label">Account Type</InputLabel>
                  <Select
                    labelId="type-label"
                    id="type"
                    name="type"
                    value={formik.values.type}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.type && Boolean(formik.errors.type)}
                    label="Account Type"
                  >
                    <MenuItem value="checking">Checking</MenuItem>
                    <MenuItem value="savings">Savings</MenuItem>
                    <MenuItem value="credit_card">Credit Card</MenuItem>
                    <MenuItem value="investment">Investment</MenuItem>
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="institution"
                  name="institution"
                  label="Institution"
                  value={formik.values.institution}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.institution &&
                    Boolean(formik.errors.institution)
                  }
                  helperText={
                    formik.touched.institution && formik.errors.institution
                  }
                  margin="normal"
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="balance"
                  name="balance"
                  label="Balance"
                  type="number"
                  value={formik.values.balance}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.balance && Boolean(formik.errors.balance)
                  }
                  helperText={formik.touched.balance && formik.errors.balance}
                  margin="normal"
                  variant="outlined"
                  InputProps={{
                    startAdornment: formik.values.currency === "USD" ? "$" : "",
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" variant="outlined">
                  <InputLabel id="currency-label">Currency</InputLabel>
                  <Select
                    labelId="currency-label"
                    id="currency"
                    name="currency"
                    value={formik.values.currency}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.currency && Boolean(formik.errors.currency)
                    }
                    label="Currency"
                  >
                    {currencies.map((currency) => (
                      <MenuItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth margin="normal" variant="outlined">
                  <InputLabel id="is_active-label">Status</InputLabel>
                  <Select
                    labelId="is_active-label"
                    id="is_active"
                    name="is_active"
                    value={formik.values.is_active}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.is_active &&
                      Boolean(formik.errors.is_active)
                    }
                    label="Status"
                  >
                    <MenuItem value={true}>Active</MenuItem>
                    <MenuItem value={false}>Inactive</MenuItem>
                  </Select>
                </FormControl>
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
                "Add Account"
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
            Are you sure you want to delete this account? All related
            transactions will be kept, but will no longer be associated with
            this account.
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

      {/* Account Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleAccountMenuClose}
      >
        <MenuItem onClick={handleEditAccount}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Edit Account
        </MenuItem>
        <MenuItem onClick={handleDeleteConfirm}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          Delete Account
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
};

export default Accounts;
