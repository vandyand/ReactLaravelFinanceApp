import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
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
  LinearProgress,
  CircularProgress,
  Chip,
  Menu,
  ListItemIcon,
  InputAdornment,
  Tabs,
  Tab,
  Paper,
  FormHelperText,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  MonetizationOn as BudgetIcon,
  CheckCircleOutline as CheckIcon,
  ErrorOutline as WarningIcon,
  NewReleases as DangerIcon,
  HelpOutline as HelpIcon,
} from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  format,
  startOfMonth,
  endOfMonth,
  isAfter,
  isBefore,
  isWithinInterval,
} from "date-fns";

import { RootState } from "../store";

// Budget type
interface Budget {
  id: number;
  name: string;
  amount: number;
  start_date: string;
  end_date: string;
  category_id: number | null;
  notes: string | null;
  is_active: boolean;
  current_amount: number;
  remaining: number;
  percentage: number;
  created_at: string;
  updated_at: string;
  period: string; // 'daily', 'weekly', 'monthly', or 'annual'
  category: {
    id: number;
    name: string;
    color: string;
  } | null;
}

// Category type
interface Category {
  id: number;
  name: string;
  type: "income" | "expense";
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
      id={`budget-tabpanel-${index}`}
      aria-labelledby={`budget-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `budget-tab-${index}`,
    "aria-controls": `budget-tabpanel-${index}`,
  };
}

const Budgets = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedBudgetId, setSelectedBudgetId] = useState<number | null>(null);

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
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy");
  };

  // Fetch budgets and categories
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [budgetsResponse, categoriesResponse] = await Promise.all([
          axios.get(`${API_URL}/budgets`, {
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

        if (budgetsResponse.data.success) {
          setBudgets(budgetsResponse.data.data);
        } else {
          setError("Failed to fetch budgets");
        }

        if (categoriesResponse.data.success) {
          // Filter categories to only include expense categories
          const expenseCategories = categoriesResponse.data.data.filter(
            (category: Category) => category.type === "expense"
          );
          setCategories(expenseCategories);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, API_URL]);

  // Form validation schema
  const validationSchema = Yup.object({
    name: Yup.string().required("Budget name is required"),
    amount: Yup.number()
      .required("Amount is required")
      .moreThan(0, "Amount must be greater than 0"),
    start_date: Yup.date().required("Start date is required"),
    end_date: Yup.date()
      .required("End date is required")
      .min(Yup.ref("start_date"), "End date must be after start date"),
    category_id: Yup.number().nullable(),
    notes: Yup.string().nullable(),
    is_active: Yup.boolean(),
    period: Yup.string().required("Period is required"),
  });

  // Form handling
  const formik = useFormik({
    initialValues: {
      name: "",
      amount: "",
      start_date: startOfMonth(new Date()),
      end_date: endOfMonth(new Date()),
      category_id: "",
      notes: "",
      is_active: true,
      period: "monthly", // Default to monthly period
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setActionInProgress(true);
      try {
        // Format dates and values
        const formattedValues = {
          ...values,
          start_date: format(values.start_date, "yyyy-MM-dd"),
          end_date: format(values.end_date, "yyyy-MM-dd"),
          amount: parseFloat(values.amount as unknown as string),
          category_id: values.category_id
            ? parseInt(values.category_id as unknown as string, 10)
            : null,
        };

        if (dialogMode === "add") {
          // Create new budget
          const response = await axios.post(
            `${API_URL}/budgets`,
            formattedValues,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.data.success) {
            setBudgets([...budgets, response.data.data]);
            setSnackbar({
              open: true,
              message: "Budget created successfully",
              severity: "success",
            });
            handleCloseDialog();
          }
        } else if (dialogMode === "edit" && currentBudget) {
          // Update existing budget
          const response = await axios.put(
            `${API_URL}/budgets/${currentBudget.id}`,
            formattedValues,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.data.success) {
            setBudgets(
              budgets.map((budget) =>
                budget.id === currentBudget.id ? response.data.data : budget
              )
            );
            setSnackbar({
              open: true,
              message: "Budget updated successfully",
              severity: "success",
            });
            handleCloseDialog();
          }
        }
      } catch (err) {
        console.error("Error saving budget:", err);
        setSnackbar({
          open: true,
          message: "Failed to save budget",
          severity: "error",
        });
      } finally {
        setActionInProgress(false);
      }
    },
  });

  // Handle budget menu click
  const handleBudgetMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    budgetId: number
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedBudgetId(budgetId);
  };

  // Handle budget menu close
  const handleBudgetMenuClose = () => {
    setAnchorEl(null);
    setSelectedBudgetId(null);
  };

  // Handle edit budget
  const handleEditBudget = () => {
    handleBudgetMenuClose();
    const budget = budgets.find((b) => b.id === selectedBudgetId);
    if (budget) {
      setCurrentBudget(budget);
      setDialogMode("edit");
      formik.setValues({
        name: budget.name,
        amount: budget.amount.toString(),
        start_date: new Date(budget.start_date),
        end_date: new Date(budget.end_date),
        category_id: budget.category_id ? budget.category_id.toString() : "",
        notes: budget.notes || "",
        is_active: budget.is_active,
        period: budget.period || "monthly", // Use budget period or default to monthly
      });
      setOpenDialog(true);
    }
  };

  // Handle delete budget
  const handleDeleteConfirm = () => {
    handleBudgetMenuClose();
    // Make sure we're keeping the selected budget ID when closing the menu
    const budgetToDelete = selectedBudgetId;
    setSelectedBudgetId(budgetToDelete);
    setConfirmDeleteDialog(true);
  };

  // Confirm delete budget
  const confirmDelete = async () => {
    if (!selectedBudgetId) return;

    setActionInProgress(true);
    try {
      const response = await axios.delete(
        `${API_URL}/budgets/${selectedBudgetId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setBudgets(budgets.filter((budget) => budget.id !== selectedBudgetId));
        setSnackbar({
          open: true,
          message: "Budget deleted successfully",
          severity: "success",
        });
      }
    } catch (err) {
      console.error("Error deleting budget:", err);
      setSnackbar({
        open: true,
        message: "Failed to delete budget",
        severity: "error",
      });
    } finally {
      setConfirmDeleteDialog(false);
      setActionInProgress(false);
      setSelectedBudgetId(null);
    }
  };

  // Handle add budget button click
  const handleAddBudgetClick = () => {
    setDialogMode("add");
    setCurrentBudget(null);
    formik.resetForm();
    setOpenDialog(true);
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    formik.resetForm();
  };

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Filter budgets based on tab
  const getCurrentDate = new Date();

  const filteredBudgets = budgets.filter((budget) => {
    if (tabValue === 0) {
      // Active
      const budgetStartDate = new Date(budget.start_date);
      const budgetEndDate = new Date(budget.end_date);
      return (
        budget.is_active &&
        isWithinInterval(getCurrentDate, {
          start: budgetStartDate,
          end: budgetEndDate,
        })
      );
    } else if (tabValue === 1) {
      // Upcoming
      const budgetStartDate = new Date(budget.start_date);
      return budget.is_active && isAfter(budgetStartDate, getCurrentDate);
    } else if (tabValue === 2) {
      // Past
      const budgetEndDate = new Date(budget.end_date);
      return isBefore(budgetEndDate, getCurrentDate);
    } else {
      // All
      return true;
    }
  });

  // Get budget status color
  const getBudgetStatusInfo = (budget: Budget) => {
    const percentUsed = budget.percentage;

    if (percentUsed <= 50) {
      return {
        color: "success.main",
        icon: <CheckIcon />,
        label: "On Track",
      };
    } else if (percentUsed <= 75) {
      return {
        color: "warning.main",
        icon: <WarningIcon />,
        label: "Watch",
      };
    } else if (percentUsed <= 100) {
      return {
        color: "error.main",
        icon: <DangerIcon />,
        label: "Warning",
      };
    } else {
      return {
        color: "error.dark",
        icon: <DangerIcon />,
        label: "Exceeded",
      };
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Budgets
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Set spending limits and track your financial goals
        </Typography>
      </Box>

      {/* Budget summary */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography variant="h6" gutterBottom>
              Budget Overview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You have {filteredBudgets.length}{" "}
              {tabValue === 0
                ? "active"
                : tabValue === 1
                ? "upcoming"
                : tabValue === 2
                ? "past"
                : ""}{" "}
              budget{filteredBudgets.length !== 1 ? "s" : ""}
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddBudgetClick}
          >
            Create Budget
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Active" {...a11yProps(0)} />
          <Tab label="Upcoming" {...a11yProps(1)} />
          <Tab label="Past" {...a11yProps(2)} />
          <Tab label="All Budgets" {...a11yProps(3)} />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        {renderBudgetGrid()}
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        {renderBudgetGrid()}
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        {renderBudgetGrid()}
      </TabPanel>
      <TabPanel value={tabValue} index={3}>
        {renderBudgetGrid()}
      </TabPanel>

      {/* Add/Edit Budget Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === "add" ? "Create New Budget" : "Edit Budget"}
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="name"
                  name="name"
                  label="Budget Name"
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
                <TextField
                  fullWidth
                  id="amount"
                  name="amount"
                  label="Budget Amount"
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
                <FormControl fullWidth margin="normal" variant="outlined">
                  <InputLabel id="category-label">
                    Category (Optional)
                  </InputLabel>
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
                    label="Category (Optional)"
                  >
                    <MenuItem value="">No specific category</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label={
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        Start Date
                        <Tooltip
                          title="The date when your budget tracking begins. Combined with the end date, this defines the overall period your budget is active."
                          arrow
                        >
                          <HelpIcon
                            fontSize="small"
                            sx={{
                              ml: 0.5,
                              fontSize: 16,
                              color: "text.secondary",
                            }}
                          />
                        </Tooltip>
                      </Box>
                    }
                    value={formik.values.start_date}
                    onChange={(date) =>
                      formik.setFieldValue("start_date", date)
                    }
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: "normal",
                        variant: "outlined",
                        error:
                          formik.touched.start_date &&
                          Boolean(formik.errors.start_date),
                        helperText:
                          formik.touched.start_date &&
                          (formik.errors.start_date as string),
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label={
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        End Date
                        <Tooltip
                          title="The date when your budget tracking ends. This is the last day the budget is considered active."
                          arrow
                        >
                          <HelpIcon
                            fontSize="small"
                            sx={{
                              ml: 0.5,
                              fontSize: 16,
                              color: "text.secondary",
                            }}
                          />
                        </Tooltip>
                      </Box>
                    }
                    value={formik.values.end_date}
                    onChange={(date) => formik.setFieldValue("end_date", date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: "normal",
                        variant: "outlined",
                        error:
                          formik.touched.end_date &&
                          Boolean(formik.errors.end_date),
                        helperText:
                          formik.touched.end_date &&
                          (formik.errors.end_date as string),
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" variant="outlined">
                  <InputLabel id="period-label">
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      Period
                      <Tooltip
                        title="The recurring time unit for budget calculations. For example, a 'monthly' period with a $300 budget means you can spend up to $300 each month within your start and end dates."
                        arrow
                      >
                        <HelpIcon
                          fontSize="small"
                          sx={{
                            ml: 0.5,
                            fontSize: 16,
                            color: "text.secondary",
                          }}
                        />
                      </Tooltip>
                    </Box>
                  </InputLabel>
                  <Select
                    labelId="period-label"
                    id="period"
                    name="period"
                    value={formik.values.period}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.period && Boolean(formik.errors.period)
                    }
                    label={
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        Period
                        <HelpIcon
                          fontSize="small"
                          sx={{ ml: 0.5, fontSize: 16, opacity: 0 }}
                        />
                      </Box>
                    }
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly (Default)</MenuItem>
                    <MenuItem value="annual">Annual</MenuItem>
                  </Select>
                  {formik.touched.period && formik.errors.period && (
                    <FormHelperText error>
                      {formik.errors.period}
                    </FormHelperText>
                  )}
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
                "Create Budget"
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
            Are you sure you want to delete this budget? This action cannot be
            undone.
          </Typography>

          {selectedBudgetId && (
            <Typography sx={{ mt: 2, fontWeight: "bold" }}>
              {`Budget: "${
                budgets.find((b) => b.id === selectedBudgetId)?.name ||
                "Unknown"
              }"`}
            </Typography>
          )}
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

      {/* Budget Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleBudgetMenuClose}
      >
        <MenuItem onClick={handleEditBudget}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Edit Budget
        </MenuItem>
        <MenuItem onClick={handleDeleteConfirm}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          Delete Budget
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

  // Helper function to render budget grid
  function renderBudgetGrid() {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (filteredBudgets.length === 0) {
      return (
        <Card elevation={0} sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
          <BudgetIcon sx={{ fontSize: 60, color: "primary.light", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No budgets found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {tabValue === 0
              ? "You don't have any active budgets. Create one to start tracking your spending"
              : tabValue === 1
              ? "You don't have any upcoming budgets"
              : tabValue === 2
              ? "You don't have any past budgets"
              : "You haven't created any budgets yet"}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddBudgetClick}
          >
            Create Budget
          </Button>
        </Card>
      );
    }

    return (
      <Grid container spacing={3}>
        {filteredBudgets.map((budget) => {
          const statusInfo = getBudgetStatusInfo(budget);

          return (
            <Grid item key={budget.id} xs={12} sm={6} md={4}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2,
                  height: "100%",
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
                        {budget.name}
                      </Typography>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mt: 0.5 }}
                      >
                        {budget.category ? (
                          <Chip
                            size="small"
                            label={budget.category.name}
                            sx={{
                              backgroundColor: `${budget.category.color}20`,
                              color: budget.category.color,
                              mr: 1,
                            }}
                          />
                        ) : null}
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(budget.start_date)} -{" "}
                          {formatDate(budget.end_date)}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton
                      aria-label="budget settings"
                      onClick={(e) => handleBudgetMenuClick(e, budget.id)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  <Box sx={{ mt: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Budget
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {formatCurrency(budget.amount)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Spent
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatCurrency(budget.current_amount)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Remaining
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight="medium"
                        color={
                          budget.remaining >= 0 ? "success.main" : "error.main"
                        }
                      >
                        {formatCurrency(budget.remaining)}
                      </Typography>
                    </Box>

                    <Box sx={{ mt: 2, mb: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(budget.percentage, 100)}
                        color={
                          budget.percentage <= 50
                            ? "success"
                            : budget.percentage <= 75
                            ? "warning"
                            : "error"
                        }
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Chip
                        size="small"
                        icon={statusInfo.icon}
                        label={statusInfo.label}
                        sx={{
                          color: statusInfo.color,
                          borderColor: statusInfo.color,
                        }}
                        variant="outlined"
                      />
                      <Typography variant="body2">
                        {budget.percentage.toFixed(0)}% used
                      </Typography>
                    </Box>

                    {budget.notes && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          {budget.notes}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  }
};

export default Budgets;
