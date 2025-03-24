import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Avatar,
  CircularProgress,
  Snackbar,
  Alert,
  Divider,
} from "@mui/material";
import { Person as PersonIcon } from "@mui/icons-material";
import { RootState, AppDispatch } from "../store";
import { getCurrentUser } from "../store/slices/authSlice";
import * as Yup from "yup";
import { useFormik } from "formik";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const Profile = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading, token } = useSelector(
    (state: RootState) => state.auth
  );

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(getCurrentUser());
  }, [dispatch]);

  // Form validation schema
  const validationSchema = Yup.object({
    name: Yup.string().required("Name is required"),
    current_password: Yup.string().when("new_password", {
      is: (val: string) => val && val.length > 0,
      then: (schema) => schema.required("Current password is required"),
      otherwise: (schema) => schema,
    }),
    new_password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    new_password_confirmation: Yup.string()
      .oneOf([Yup.ref("new_password")], "Passwords must match")
      .when("new_password", {
        is: (val: string) => val && val.length > 0,
        then: (schema) => schema.required("Please confirm your password"),
        otherwise: (schema) => schema,
      }),
  });

  const formik = useFormik({
    initialValues: {
      name: user?.name || "",
      email: user?.email || "",
      current_password: "",
      new_password: "",
      new_password_confirmation: "",
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      setSaving(true);

      try {
        // Only send password update request if new password is provided
        if (values.new_password) {
          await axios.put(
            `${API_URL}/update-password`,
            {
              current_password: values.current_password,
              new_password: values.new_password,
              new_password_confirmation: values.new_password_confirmation,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        }

        setSnackbar({
          open: true,
          message: "Profile updated successfully",
          severity: "success",
        });

        // Reset password fields and their validation state
        formik.resetForm({
          values: {
            ...values,
            current_password: "",
            new_password: "",
            new_password_confirmation: "",
          },
          touched: {
            ...formik.touched,
            current_password: false,
            new_password: false,
            new_password_confirmation: false,
          },
          errors: {
            ...formik.errors,
            current_password: undefined,
            new_password: undefined,
            new_password_confirmation: undefined,
          },
        });
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.errors?.new_password?.[0] ||
          "An error occurred while updating your profile";

        setSnackbar({
          open: true,
          message: errorMessage,
          severity: "error",
        });
      } finally {
        setSaving(false);
      }
    },
  });

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "50vh",
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Profile
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage your account settings
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, height: "100%" }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  mb: 2,
                  bgcolor: "primary.main",
                }}
              >
                <PersonIcon sx={{ fontSize: 60 }} />
              </Avatar>
              <Typography variant="h6">{user?.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary" paragraph>
              Member since:{" "}
              {new Date(user?.created_at || Date.now()).toLocaleDateString()}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Edit Profile
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <form onSubmit={formik.handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.name && Boolean(formik.errors.name)}
                    helperText={formik.touched.name && formik.errors.name}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    disabled
                    helperText="Email cannot be changed"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                    Change Password
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    name="current_password"
                    type="password"
                    value={formik.values.current_password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.current_password &&
                      Boolean(formik.errors.current_password)
                    }
                    helperText={
                      formik.touched.current_password &&
                      formik.errors.current_password
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="New Password"
                    name="new_password"
                    type="password"
                    value={formik.values.new_password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.new_password &&
                      Boolean(formik.errors.new_password)
                    }
                    helperText={
                      formik.touched.new_password && formik.errors.new_password
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    name="new_password_confirmation"
                    type="password"
                    value={formik.values.new_password_confirmation}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.new_password_confirmation &&
                      Boolean(formik.errors.new_password_confirmation)
                    }
                    helperText={
                      formik.touched.new_password_confirmation &&
                      formik.errors.new_password_confirmation
                    }
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box
                    sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}
                  >
                    <Button
                      variant="contained"
                      color="primary"
                      type="submit"
                      disabled={saving}
                    >
                      {saving ? <CircularProgress size={24} /> : "Save Changes"}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Profile;
