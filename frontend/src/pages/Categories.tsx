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
  Divider,
  Chip,
  CircularProgress,
  Avatar,
  InputAdornment,
  Tabs,
  Tab,
  Menu,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Label as LabelIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  ColorLens as ColorLensIcon,
} from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { ChromePicker } from "react-color";

import { RootState } from "../store";

// Category type
interface Category {
  id: number;
  name: string;
  type: "income" | "expense";
  color: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  transaction_count: number;
  created_at: string;
  updated_at: string;
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
      id={`category-tabpanel-${index}`}
      aria-labelledby={`category-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `category-tab-${index}`,
    "aria-controls": `category-tabpanel-${index}`,
  };
}

// Default colors
const defaultColors = [
  "#2E5BFF", // Primary blue
  "#00C9A7", // Secondary teal
  "#FF4D4F", // Error red
  "#FAAD14", // Warning yellow
  "#1890FF", // Info blue
  "#52C41A", // Success green
  "#722ED1", // Purple
  "#EB2F96", // Pink
  "#FA8C16", // Orange
  "#13C2C2", // Cyan
];

const Categories = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [search, setSearch] = useState("");
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/categories`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          setCategories(response.data.data);
        } else {
          setError("Failed to fetch categories");
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("An error occurred while fetching categories");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [token, API_URL]);

  // Form validation schema
  const validationSchema = Yup.object({
    name: Yup.string().required("Category name is required"),
    type: Yup.string()
      .oneOf(["income", "expense"])
      .required("Category type is required"),
    color: Yup.string().required("Color is required"),
    description: Yup.string().nullable(),
    icon: Yup.string().nullable(),
    is_active: Yup.boolean(),
  });

  // Form handling
  const formik = useFormik({
    initialValues: {
      name: "",
      type: "expense" as "income" | "expense",
      color: defaultColors[0],
      description: "",
      icon: "",
      is_active: true,
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setActionInProgress(true);
      try {
        if (dialogMode === "add") {
          // Create new category
          const response = await axios.post(`${API_URL}/categories`, values, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.data.success) {
            setCategories([...categories, response.data.data]);
            setSnackbar({
              open: true,
              message: "Category created successfully",
              severity: "success",
            });
            handleCloseDialog();
          }
        } else if (dialogMode === "edit" && currentCategory) {
          // Update existing category
          const response = await axios.put(
            `${API_URL}/categories/${currentCategory.id}`,
            values,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.data.success) {
            setCategories(
              categories.map((category) =>
                category.id === currentCategory.id
                  ? response.data.data
                  : category
              )
            );
            setSnackbar({
              open: true,
              message: "Category updated successfully",
              severity: "success",
            });
            handleCloseDialog();
          }
        }
      } catch (err) {
        console.error("Error saving category:", err);
        setSnackbar({
          open: true,
          message: "Failed to save category",
          severity: "error",
        });
      } finally {
        setActionInProgress(false);
      }
    },
  });

  // Handle category menu click
  const handleCategoryMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    categoryId: number
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedCategoryId(categoryId);
  };

  // Handle category menu close
  const handleCategoryMenuClose = () => {
    setAnchorEl(null);
    setSelectedCategoryId(null);
  };

  // Handle edit category
  const handleEditCategory = () => {
    handleCategoryMenuClose();
    const category = categories.find((c) => c.id === selectedCategoryId);
    if (category) {
      setCurrentCategory(category);
      setDialogMode("edit");
      formik.setValues({
        name: category.name,
        type: category.type,
        color: category.color,
        description: category.description || "",
        icon: category.icon || "",
        is_active: category.is_active,
      });
      setOpenDialog(true);
    }
  };

  // Handle delete category
  const handleDeleteConfirm = () => {
    handleCategoryMenuClose();
    setConfirmDeleteDialog(true);
  };

  // Confirm delete category
  const confirmDelete = async () => {
    if (!selectedCategoryId) return;

    setActionInProgress(true);
    try {
      const response = await axios.delete(
        `${API_URL}/categories/${selectedCategoryId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setCategories(
          categories.filter((category) => category.id !== selectedCategoryId)
        );
        setSnackbar({
          open: true,
          message: "Category deleted successfully",
          severity: "success",
        });
      }
    } catch (err) {
      console.error("Error deleting category:", err);
      setSnackbar({
        open: true,
        message:
          "Failed to delete category. It may be in use by existing transactions.",
        severity: "error",
      });
    } finally {
      setConfirmDeleteDialog(false);
      setActionInProgress(false);
      setSelectedCategoryId(null);
    }
  };

  // Handle add category button click
  const handleAddCategoryClick = () => {
    setDialogMode("add");
    setCurrentCategory(null);
    formik.resetForm();
    // Set the type based on the current tab
    formik.setFieldValue("type", tabValue === 0 ? "expense" : "income");
    setOpenDialog(true);
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setColorPickerOpen(false);
    formik.resetForm();
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Filter categories based on tab and search
  const filteredCategories = categories.filter((category) => {
    const matchesTab =
      tabValue === 0 ? category.type === "expense" : category.type === "income";

    const matchesSearch =
      search === "" ||
      category.name.toLowerCase().includes(search.toLowerCase()) ||
      (category.description &&
        category.description.toLowerCase().includes(search.toLowerCase()));

    return matchesTab && matchesSearch;
  });

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Categories
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage your expense and income categories
        </Typography>
      </Box>

      {/* Tabs and Search Bar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Expenses" {...a11yProps(0)} />
          <Tab label="Income" {...a11yProps(1)} />
        </Tabs>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
            onClick={handleAddCategoryClick}
          >
            Add Category
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        {renderCategoryGrid()}
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        {renderCategoryGrid()}
      </TabPanel>

      {/* Add/Edit Category Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === "add" ? "Add New Category" : "Edit Category"}
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="name"
                  name="name"
                  label="Category Name"
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
                  <InputLabel id="type-label">Category Type</InputLabel>
                  <Select
                    labelId="type-label"
                    id="type"
                    name="type"
                    value={formik.values.type}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.type && Boolean(formik.errors.type)}
                    label="Category Type"
                  >
                    <MenuItem value="expense">Expense</MenuItem>
                    <MenuItem value="income">Income</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" variant="outlined">
                  <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: 1,
                        bgcolor: formik.values.color,
                        mr: 2,
                        border: "1px solid rgba(0, 0, 0, 0.12)",
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={() => setColorPickerOpen(!colorPickerOpen)}
                      startIcon={<ColorLensIcon />}
                      size="small"
                    >
                      {colorPickerOpen ? "Close Color Picker" : "Choose Color"}
                    </Button>
                  </Box>
                  {colorPickerOpen && (
                    <Box sx={{ mt: 2, mb: 1 }}>
                      <ChromePicker
                        color={formik.values.color}
                        onChange={(color) =>
                          formik.setFieldValue("color", color.hex)
                        }
                        disableAlpha
                      />
                      <Box
                        sx={{
                          mt: 2,
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 1,
                        }}
                      >
                        {defaultColors.map((color) => (
                          <Box
                            key={color}
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: 1,
                              bgcolor: color,
                              cursor: "pointer",
                              border:
                                formik.values.color === color
                                  ? "2px solid black"
                                  : "1px solid rgba(0, 0, 0, 0.12)",
                            }}
                            onClick={() => formik.setFieldValue("color", color)}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </FormControl>
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

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formik.values.is_active}
                      onChange={(e) =>
                        formik.setFieldValue("is_active", e.target.checked)
                      }
                      name="is_active"
                      color="primary"
                    />
                  }
                  label="Active Category"
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
                "Add Category"
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
            Are you sure you want to delete this category? If it's used by any
            transactions, they will become uncategorized.
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

      {/* Category Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCategoryMenuClose}
      >
        <MenuItem onClick={handleEditCategory}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Edit Category
        </MenuItem>
        <MenuItem onClick={handleDeleteConfirm}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          Delete Category
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

  // Helper function to render category grid
  function renderCategoryGrid() {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (filteredCategories.length === 0) {
      return (
        <Card elevation={0} sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
          <LabelIcon sx={{ fontSize: 60, color: "primary.light", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No categories found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {search
              ? "No categories match your search criteria"
              : tabValue === 0
              ? "Create expense categories to organize your spending"
              : "Create income categories to track your earnings"}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddCategoryClick}
          >
            Add Category
          </Button>
        </Card>
      );
    }

    return (
      <Grid container spacing={3}>
        {filteredCategories.map((category) => (
          <Grid item key={category.id} xs={12} sm={6} md={4} lg={3}>
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
                opacity: category.is_active ? 1 : 0.6,
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
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Avatar
                      sx={{
                        bgcolor: category.color,
                        width: 40,
                        height: 40,
                        mr: 2,
                      }}
                    >
                      <LabelIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ wordBreak: "break-word" }}>
                        {category.name}
                      </Typography>
                      <Chip
                        label={
                          category.type.charAt(0).toUpperCase() +
                          category.type.slice(1)
                        }
                        size="small"
                        color={
                          category.type === "income" ? "success" : "primary"
                        }
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Box>
                  <IconButton
                    aria-label="category settings"
                    onClick={(e) => handleCategoryMenuClick(e, category.id)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                {category.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 2, wordBreak: "break-word" }}
                  >
                    {category.description}
                  </Typography>
                )}

                <Box sx={{ mt: 2 }}>
                  <Tooltip title="Number of transactions using this category">
                    <Typography variant="body2" color="text.secondary">
                      {category.transaction_count}{" "}
                      {category.transaction_count === 1
                        ? "transaction"
                        : "transactions"}
                    </Typography>
                  </Tooltip>
                </Box>

                {!category.is_active && (
                  <Chip
                    label="Inactive"
                    size="small"
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }
};

export default Categories;
