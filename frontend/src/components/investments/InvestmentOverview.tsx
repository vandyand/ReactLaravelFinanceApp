import {
  Box,
  Grid,
  Card,
  Typography,
  Paper,
  Tooltip,
  Chip,
} from "@mui/material";
import {
  TrendingUp as GrowthIcon,
  TrendingDown as DeclineIcon,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import { Investment } from "../../pages/Investments";

interface InvestmentOverviewProps {
  investments: Investment[];
}

// Function to format investment type for display
const formatInvestmentType = (type: string): string => {
  if (!type) return "";

  // Handle specific cases
  const typeMap: Record<string, string> = {
    mutual_fund: "Mutual Fund",
    etf: "ETF",
    stock: "Stock",
    cryptocurrency: "Cryptocurrency",
    bond: "Bond",
    real_estate: "Real Estate",
    commodity: "Commodity",
    retirement: "Retirement",
    other: "Other",
  };

  if (typeMap[type.toLowerCase()]) {
    return typeMap[type.toLowerCase()];
  }

  // For other types, capitalize each word
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const InvestmentOverview = ({ investments }: InvestmentOverviewProps) => {
  const [summary, setSummary] = useState({
    totalInvestments: 0,
    totalValue: 0,
    totalGainLoss: 0,
    percentageReturn: 0,
    bestPerforming: null as Investment | null,
    worstPerforming: null as Investment | null,
    investmentsByType: {} as Record<string, { count: number; value: number }>,
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  // Calculate purchase value for an investment
  const calculatePurchaseValue = (investment: Investment): number => {
    if (!investment.purchase_price || !investment.quantity) return 0;

    // Convert strings to numbers if needed
    const price =
      typeof investment.purchase_price === "string"
        ? parseFloat(investment.purchase_price)
        : investment.purchase_price;

    const qty =
      typeof investment.quantity === "string"
        ? parseFloat(investment.quantity)
        : investment.quantity;

    if (isNaN(price) || isNaN(qty)) return 0;

    return price * qty;
  };

  // Calculate summary metrics
  useEffect(() => {
    if (investments.length === 0) {
      return;
    }

    let totalValue = 0;
    let totalPurchaseValue = 0;
    let totalGainLoss = 0;
    let bestPerforming = investments[0];
    let worstPerforming = investments[0];
    const investmentsByType: Record<string, { count: number; value: number }> =
      {};

    investments.forEach((investment) => {
      // Calculate current value (ensure it's a number)
      const currentValue =
        typeof investment.current_value === "number"
          ? investment.current_value
          : 0;

      // Calculate purchase value using our helper function
      const purchaseValue =
        investment.purchase_value || calculatePurchaseValue(investment);

      // Update totals
      totalValue += currentValue;
      totalPurchaseValue += purchaseValue;
      totalGainLoss += currentValue - purchaseValue;

      // Track best and worst performing investments
      if (
        investment.profit_loss_percentage >
        bestPerforming.profit_loss_percentage
      ) {
        bestPerforming = investment;
      }
      if (
        investment.profit_loss_percentage <
        worstPerforming.profit_loss_percentage
      ) {
        worstPerforming = investment;
      }

      // Group by type
      if (!investmentsByType[investment.type]) {
        investmentsByType[investment.type] = {
          count: 0,
          value: 0,
        };
      }
      investmentsByType[investment.type].count += 1;
      investmentsByType[investment.type].value += currentValue;
    });

    // Calculate overall percentage return
    const percentageReturn =
      totalPurchaseValue > 0
        ? ((totalValue - totalPurchaseValue) / totalPurchaseValue) * 100
        : 0;

    console.log("Portfolio metrics:", {
      totalValue,
      totalPurchaseValue,
      totalGainLoss,
      percentageReturn,
    });

    setSummary({
      totalInvestments: investments.length,
      totalValue,
      totalGainLoss,
      percentageReturn,
      bestPerforming,
      worstPerforming,
      investmentsByType,
    });
  }, [investments]);

  if (investments.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Portfolio Overview
        </Typography>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Total Value */}
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: "background.default",
                height: "100%",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Total Value
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {formatCurrency(summary.totalValue)}
              </Typography>
            </Card>
          </Grid>

          {/* Total Gain/Loss */}
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: "background.default",
                height: "100%",
              }}
            >
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Gain/Loss
              </Typography>
              <Box>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  color={
                    summary.totalGainLoss >= 0 ? "success.main" : "error.main"
                  }
                  sx={{ mb: 0.5 }}
                >
                  {formatCurrency(summary.totalGainLoss)}
                </Typography>
                <Chip
                  size="small"
                  icon={
                    summary.percentageReturn >= 0 ? (
                      <GrowthIcon fontSize="small" />
                    ) : (
                      <DeclineIcon fontSize="small" />
                    )
                  }
                  label={formatPercentage(summary.percentageReturn)}
                  color={summary.percentageReturn >= 0 ? "success" : "error"}
                />
              </Box>
            </Card>
          </Grid>

          {/* Best Performer */}
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: "background.default",
                height: "100%",
              }}
            >
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Best Performer
              </Typography>
              {summary.bestPerforming && (
                <Tooltip
                  title={`${summary.bestPerforming.name}: ${formatPercentage(
                    summary.bestPerforming.profit_loss_percentage
                  )}`}
                >
                  <Box>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      sx={{
                        wordBreak: "break-word",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        lineHeight: 1.2,
                        mb: 0.5,
                        height: "2.4em",
                      }}
                    >
                      {summary.bestPerforming.name}
                    </Typography>
                    <Chip
                      size="small"
                      icon={<GrowthIcon fontSize="small" />}
                      label={formatPercentage(
                        summary.bestPerforming.profit_loss_percentage
                      )}
                      color="success"
                    />
                  </Box>
                </Tooltip>
              )}
            </Card>
          </Grid>

          {/* Worst Performer */}
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: "background.default",
                height: "100%",
              }}
            >
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Worst Performer
              </Typography>
              {summary.worstPerforming && (
                <Tooltip
                  title={`${summary.worstPerforming.name}: ${formatPercentage(
                    summary.worstPerforming.profit_loss_percentage
                  )}`}
                >
                  <Box>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      sx={{
                        wordBreak: "break-word",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        lineHeight: 1.2,
                        mb: 0.5,
                        height: "2.4em",
                      }}
                    >
                      {summary.worstPerforming.name}
                    </Typography>
                    <Chip
                      size="small"
                      icon={<DeclineIcon fontSize="small" />}
                      label={formatPercentage(
                        summary.worstPerforming.profit_loss_percentage
                      )}
                      color="error"
                    />
                  </Box>
                </Tooltip>
              )}
            </Card>
          </Grid>
        </Grid>

        {/* Asset Allocation */}
        {Object.keys(summary.investmentsByType).length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body1" fontWeight="bold" gutterBottom>
              Asset Allocation
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(summary.investmentsByType).map(
                ([type, { count, value }]) => (
                  <Grid item key={type} xs={6} sm={4} md={3} lg={2}>
                    <Card
                      elevation={0}
                      sx={{
                        p: 2,
                        bgcolor: "background.default",
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {formatInvestmentType(type)}
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {formatCurrency(value)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {count} {count === 1 ? "investment" : "investments"}
                      </Typography>
                    </Card>
                  </Grid>
                )
              )}
            </Grid>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default InvestmentOverview;
