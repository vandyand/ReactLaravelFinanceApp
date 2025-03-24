import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  CircularProgress,
  ButtonBase,
  useTheme,
} from "@mui/material";
import {
  AccountBalance as AccountIcon,
  TrendingUp as InvestmentIcon,
  AccountBalanceWallet as WalletIcon,
  Receipt as TransactionIcon,
} from "@mui/icons-material";
import { Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

import { RootState } from "../store";
import axios from "axios";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Interface for dashboard data
interface DashboardData {
  summary: {
    total_balance: number;
    total_income: number;
    total_expenses: number;
    net_worth: number;
  };
  recent_transactions: {
    id: number;
    amount: number;
    type: string;
    name: string;
    transaction_date: string;
    category: {
      name: string;
      color: string;
    } | null;
    account: {
      name: string;
    };
  }[];
  spending_by_category: {
    name: string;
    color: string;
    total: number;
  }[];
  income_vs_expenses: {
    month: string;
    year: string;
    income: number;
    expenses: number;
    savings: number;
  }[];
  budgets: {
    id: number;
    name: string;
    amount: number;
    category: {
      name: string;
      color: string;
    } | null;
  }[];
  investments: {
    id: number;
    name: string;
    symbol: string;
    current_value: number;
    profit_loss: number;
    profit_loss_percentage: number;
  }[];
}

const Dashboard = () => {
  const theme = useTheme();
  const { token } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get(`${API_URL}/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          setDashboardData(response.data.data);
        } else {
          setError("Failed to fetch dashboard data");
        }
      } catch (err) {
        console.error("Dashboard data fetch error:", err);
        setError("An error occurred while fetching dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token, API_URL]);

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
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  // Create data for income vs expenses chart
  const createIncomeExpensesChartData = () => {
    if (!dashboardData?.income_vs_expenses) return null;

    const labels = dashboardData.income_vs_expenses.map(
      (item) => `${item.month} ${item.year}`
    );
    const incomeData = dashboardData.income_vs_expenses.map(
      (item) => item.income
    );
    const expensesData = dashboardData.income_vs_expenses.map(
      (item) => item.expenses
    );
    const savingsData = dashboardData.income_vs_expenses.map(
      (item) => item.savings
    );

    return {
      labels,
      datasets: [
        {
          label: "Income",
          data: incomeData,
          borderColor: theme.palette.success.main,
          backgroundColor: theme.palette.success.light + "40",
          fill: false,
          tension: 0.4,
        },
        {
          label: "Expenses",
          data: expensesData,
          borderColor: theme.palette.error.main,
          backgroundColor: theme.palette.error.light + "40",
          fill: false,
          tension: 0.4,
        },
        {
          label: "Savings",
          data: savingsData,
          borderColor: theme.palette.primary.main,
          backgroundColor: theme.palette.primary.light + "40",
          fill: false,
          tension: 0.4,
        },
      ],
    };
  };

  // Create data for spending by category chart
  const createSpendingCategoryChartData = () => {
    if (
      !dashboardData?.spending_by_category ||
      dashboardData.spending_by_category.length === 0
    )
      return null;

    return {
      labels: dashboardData.spending_by_category.map(
        (category) => category.name
      ),
      datasets: [
        {
          data: dashboardData.spending_by_category.map(
            (category) => category.total
          ),
          backgroundColor: dashboardData.spending_by_category.map(
            (category) => category.color || theme.palette.primary.main
          ),
          borderWidth: 1,
        },
      ],
    };
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          minHeight: "80vh",
        }}
      >
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          minHeight: "80vh",
        }}
      >
        <Typography variant="h5" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          minHeight: "80vh",
        }}
      >
        <Typography variant="h5">No dashboard data available</Typography>
      </Box>
    );
  }

  const incomeExpensesChartData = createIncomeExpensesChartData();
  const spendingCategoryChartData = createSpendingCategoryChartData();

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Financial Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Overview of your financial health and recent activity
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6} lg={3}>
          <Card elevation={0} sx={{ borderRadius: 2, height: "100%" }}>
            <CardContent>
              <Box
                sx={{
                  mb: 2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="subtitle1" color="text.secondary">
                  Total Balance
                </Typography>
                <Avatar
                  sx={{
                    bgcolor: theme.palette.primary.light,
                    width: 40,
                    height: 40,
                  }}
                >
                  <AccountIcon />
                </Avatar>
              </Box>
              <Typography variant="h4" component="div" fontWeight="bold">
                {formatCurrency(dashboardData.summary.total_balance)}
              </Typography>
              <Box sx={{ mt: 1, display: "flex", alignItems: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Total across all accounts
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card elevation={0} sx={{ borderRadius: 2, height: "100%" }}>
            <CardContent>
              <Box
                sx={{
                  mb: 2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="subtitle1" color="text.secondary">
                  Total Income
                </Typography>
                <Avatar
                  sx={{
                    bgcolor: theme.palette.success.light,
                    width: 40,
                    height: 40,
                  }}
                >
                  <InvestmentIcon />
                </Avatar>
              </Box>
              <Typography variant="h4" component="div" fontWeight="bold">
                {formatCurrency(dashboardData.summary.total_income)}
              </Typography>
              <Box sx={{ mt: 1, display: "flex", alignItems: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  This month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card elevation={0} sx={{ borderRadius: 2, height: "100%" }}>
            <CardContent>
              <Box
                sx={{
                  mb: 2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="subtitle1" color="text.secondary">
                  Total Expenses
                </Typography>
                <Avatar
                  sx={{
                    bgcolor: theme.palette.error.light,
                    width: 40,
                    height: 40,
                  }}
                >
                  <TransactionIcon />
                </Avatar>
              </Box>
              <Typography variant="h4" component="div" fontWeight="bold">
                {formatCurrency(dashboardData.summary.total_expenses)}
              </Typography>
              <Box sx={{ mt: 1, display: "flex", alignItems: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  This month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card elevation={0} sx={{ borderRadius: 2, height: "100%" }}>
            <CardContent>
              <Box
                sx={{
                  mb: 2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="subtitle1" color="text.secondary">
                  Net Worth
                </Typography>
                <Avatar
                  sx={{
                    bgcolor: theme.palette.info.light,
                    width: 40,
                    height: 40,
                  }}
                >
                  <WalletIcon />
                </Avatar>
              </Box>
              <Typography variant="h4" component="div" fontWeight="bold">
                {formatCurrency(dashboardData.summary.net_worth)}
              </Typography>
              <Box sx={{ mt: 1, display: "flex", alignItems: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Assets - Liabilities
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts and Transactions */}
      <Grid container spacing={3}>
        {/* Income vs Expenses Chart */}
        <Grid item xs={12} lg={8}>
          <Card elevation={0} sx={{ borderRadius: 2, height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Income vs Expenses
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                6-month comparison of your income and expenses
              </Typography>

              {incomeExpensesChartData ? (
                <Box sx={{ height: 300, position: "relative" }}>
                  <Line
                    data={incomeExpensesChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "top",
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              let label = context.dataset.label || "";
                              if (label) {
                                label += ": ";
                              }
                              if (context.parsed.y !== null) {
                                label += formatCurrency(context.parsed.y);
                              }
                              return label;
                            },
                          },
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function (value) {
                              return formatCurrency(value as number);
                            },
                          },
                        },
                      },
                    }}
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    height: 300,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    No income or expense data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Spending by Category */}
        <Grid item xs={12} md={6} lg={4}>
          <Card elevation={0} sx={{ borderRadius: 2, height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Spending by Category
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                This month's expenses by category
              </Typography>

              {spendingCategoryChartData ? (
                <Box
                  sx={{
                    height: 300,
                    position: "relative",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Pie
                    data={spendingCategoryChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "bottom",
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              let label = context.label || "";
                              if (label) {
                                label += ": ";
                              }
                              if (context.parsed !== null) {
                                label += formatCurrency(context.parsed);
                              }
                              return label;
                            },
                          },
                        },
                      },
                    }}
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    height: 300,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    No category data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12} md={6} lg={6}>
          <Card elevation={0} sx={{ borderRadius: 2, height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Recent Transactions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Your latest financial activities
              </Typography>

              {dashboardData.recent_transactions.length > 0 ? (
                <List>
                  {dashboardData.recent_transactions.map((transaction) => (
                    <ButtonBase
                      key={transaction.id}
                      sx={{
                        width: "100%",
                        borderRadius: 1,
                        mb: 1,
                        "&:hover": {
                          backgroundColor: "rgba(0, 0, 0, 0.04)",
                        },
                      }}
                    >
                      <ListItem
                        alignItems="flex-start"
                        sx={{
                          width: "100%",
                          px: 2,
                          py: 1,
                          borderLeft: "4px solid",
                          borderColor:
                            transaction.type === "income"
                              ? theme.palette.success.main
                              : theme.palette.error.main,
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor:
                                transaction.category?.color ||
                                (transaction.type === "income"
                                  ? theme.palette.success.light
                                  : theme.palette.error.light),
                            }}
                          >
                            {transaction.type === "income" ? (
                              <InvestmentIcon />
                            ) : (
                              <TransactionIcon />
                            )}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2">
                              {transaction.name || "Transaction"}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                component="span"
                              >
                                {transaction.account.name} •{" "}
                                {formatDate(transaction.transaction_date)}
                              </Typography>
                              <Box
                                component="span"
                                sx={{ display: "block", mt: 1 }}
                              >
                                {transaction.category && (
                                  <Chip
                                    label={transaction.category.name}
                                    size="small"
                                    sx={{
                                      height: 20,
                                      backgroundColor:
                                        transaction.category.color + "20",
                                      color: transaction.category.color,
                                      fontSize: "0.7rem",
                                    }}
                                  />
                                )}
                              </Box>
                            </>
                          }
                        />
                        <Box
                          sx={{ display: "flex", alignItems: "center", ml: 2 }}
                        >
                          <Typography
                            variant="subtitle1"
                            color={
                              transaction.type === "income"
                                ? "success.main"
                                : "error.main"
                            }
                            fontWeight="bold"
                          >
                            {transaction.type === "income" ? "+" : "-"}
                            {formatCurrency(Math.abs(transaction.amount))}
                          </Typography>
                        </Box>
                      </ListItem>
                    </ButtonBase>
                  ))}
                </List>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: 200,
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    No recent transactions
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Investments Overview */}
        <Grid item xs={12} md={6} lg={6}>
          <Card elevation={0} sx={{ borderRadius: 2, height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Investment Portfolio
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Performance of your investments
              </Typography>

              {dashboardData.investments.length > 0 ? (
                <List>
                  {dashboardData.investments.map((investment) => (
                    <ButtonBase
                      key={investment.id}
                      sx={{
                        width: "100%",
                        borderRadius: 1,
                        mb: 1,
                        "&:hover": {
                          backgroundColor: "rgba(0, 0, 0, 0.04)",
                        },
                      }}
                    >
                      <ListItem
                        alignItems="flex-start"
                        sx={{
                          width: "100%",
                          px: 2,
                          py: 1,
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor:
                                investment.profit_loss >= 0
                                  ? theme.palette.success.light
                                  : theme.palette.error.light,
                            }}
                          >
                            {investment.profit_loss >= 0 ? (
                              <InvestmentIcon />
                            ) : (
                              <TransactionIcon />
                            )}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2">
                              {investment.name}{" "}
                              {investment.symbol && `(${investment.symbol})`}
                            </Typography>
                          }
                          secondary={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mt: 0.5,
                              }}
                            >
                              <Typography
                                variant="body2"
                                color={
                                  investment.profit_loss >= 0
                                    ? "success.main"
                                    : "error.main"
                                }
                                component="span"
                                sx={{ display: "flex", alignItems: "center" }}
                              >
                                {investment.profit_loss >= 0 ? (
                                  <InvestmentIcon />
                                ) : (
                                  <TransactionIcon />
                                )}
                                {investment.profit_loss_percentage.toFixed(2)}%
                              </Typography>
                            </Box>
                          }
                        />
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                            ml: 2,
                          }}
                        >
                          <Typography variant="subtitle1" fontWeight="bold">
                            {formatCurrency(investment.current_value)}
                          </Typography>
                          <Typography
                            variant="body2"
                            color={
                              investment.profit_loss >= 0
                                ? "success.main"
                                : "error.main"
                            }
                          >
                            {investment.profit_loss >= 0 ? "+" : ""}
                            {formatCurrency(investment.profit_loss)}
                          </Typography>
                        </Box>
                      </ListItem>
                    </ButtonBase>
                  ))}
                </List>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: 200,
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    No investments available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
