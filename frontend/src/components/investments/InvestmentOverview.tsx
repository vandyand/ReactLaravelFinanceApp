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
      totalValue += investment.current_value;
      totalPurchaseValue += investment.purchase_value;
      totalGainLoss += investment.performance_value;

      // Track best and worst performing investments
      if (
        investment.performance_percentage >
        bestPerforming.performance_percentage
      ) {
        bestPerforming = investment;
      }
      if (
        investment.performance_percentage <
        worstPerforming.performance_percentage
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
      investmentsByType[investment.type].value += investment.current_value;
    });

    // Calculate overall percentage return
    const percentageReturn =
      totalPurchaseValue > 0
        ? ((totalValue - totalPurchaseValue) / totalPurchaseValue) * 100
        : 0;

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
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Value
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {formatCurrency(summary.totalValue)}
              </Typography>
            </Box>
          </Grid>

          {/* Total Gain/Loss */}
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Gain/Loss
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  color={
                    summary.totalGainLoss >= 0 ? "success.main" : "error.main"
                  }
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
                  sx={{ ml: 1 }}
                />
              </Box>
            </Box>
          </Grid>

          {/* Best Performer */}
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Best Performer
              </Typography>
              {summary.bestPerforming && (
                <Tooltip
                  title={`${summary.bestPerforming.name}: ${formatPercentage(
                    summary.bestPerforming.performance_percentage
                  )}`}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography variant="h5" fontWeight="bold">
                      {summary.bestPerforming.name.length > 10
                        ? `${summary.bestPerforming.name.substring(0, 10)}...`
                        : summary.bestPerforming.name}
                    </Typography>
                    <Chip
                      size="small"
                      icon={<GrowthIcon fontSize="small" />}
                      label={formatPercentage(
                        summary.bestPerforming.performance_percentage
                      )}
                      color="success"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                </Tooltip>
              )}
            </Box>
          </Grid>

          {/* Worst Performer */}
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Worst Performer
              </Typography>
              {summary.worstPerforming && (
                <Tooltip
                  title={`${summary.worstPerforming.name}: ${formatPercentage(
                    summary.worstPerforming.performance_percentage
                  )}`}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography variant="h5" fontWeight="bold">
                      {summary.worstPerforming.name.length > 10
                        ? `${summary.worstPerforming.name.substring(0, 10)}...`
                        : summary.worstPerforming.name}
                    </Typography>
                    <Chip
                      size="small"
                      icon={<DeclineIcon fontSize="small" />}
                      label={formatPercentage(
                        summary.worstPerforming.performance_percentage
                      )}
                      color="error"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                </Tooltip>
              )}
            </Box>
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
                        {type}
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
