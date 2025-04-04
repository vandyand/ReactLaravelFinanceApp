import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { Provider, useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import store
import { store, RootState } from "./store";

// Import theme
import theme from "./theme";

// Import components
import Layout from "./components/Layout";
import AuthGuard from "./components/AuthGuard";

// Import services
import sessionService from "./services/SessionService";

// Import pages
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Accounts from "./pages/Accounts";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import Investments from "./pages/Investments";
import Categories from "./pages/Categories";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

// Session monitoring component
const SessionMonitor = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      // Start session monitoring when user is authenticated
      sessionService.startMonitoring();
    } else {
      // Stop monitoring when user logs out
      sessionService.stopMonitoring();
    }

    // Clean up on unmount
    return () => {
      sessionService.stopMonitoring();
    };
  }, [isAuthenticated]);

  return null; // This component doesn't render anything
};

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <Router>
          {/* Session monitor component */}
          <SessionMonitor />

          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route element={<AuthGuard />}>
              <Route element={<Layout />}>
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/accounts" element={<Accounts />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/budgets" element={<Budgets />} />
                <Route path="/investments" element={<Investments />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Route>

            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
