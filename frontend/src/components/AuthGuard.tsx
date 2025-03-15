import { useEffect, useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { CircularProgress, Box } from "@mui/material";

import { RootState } from "../store";
import { getCurrentUser } from "../store/slices/authSlice";
import { AppDispatch } from "../store";

const AuthGuard = () => {
  const [isVerifying, setIsVerifying] = useState(true);
  const { isAuthenticated, token } = useSelector(
    (state: RootState) => state.auth
  );
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      if (token) {
        try {
          await dispatch(getCurrentUser()).unwrap();
        } catch (error) {
          console.error("Authentication verification failed:", error);
        }
      }
      setIsVerifying(false);
    };

    verifyAuth();
  }, [dispatch, token]);

  if (isVerifying) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with the current location stored in state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render the protected routes
  return <Outlet />;
};

export default AuthGuard;
