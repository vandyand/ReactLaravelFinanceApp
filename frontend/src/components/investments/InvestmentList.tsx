import { useState } from "react";
import {
  Box,
  Typography,
  Card,
  Grid,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  CircularProgress,
  Button,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as GrowthIcon,
  TrendingDown as DeclineIcon,
  MoreVert as MoreVertIcon,
  AccountBalance as InvestmentIcon,
} from "@mui/icons-material";

import { Investment } from "../../pages/Investments";

interface InvestmentListProps {
  investments: Investment[];
  loading: boolean;
  onEditInvestment: (investment: Investment) => void;
  onDeleteInvestment: (investmentId: number) => void;
  onAddInvestment: () => void;
}

const InvestmentList = ({
  investments,
  loading,
  onEditInvestment,
  onDeleteInvestment,
  onAddInvestment,
}: InvestmentListProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<
    number | null
  >(null);

  // Format investment type for display
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

  // Calculate purchase value (since it's not provided by the API)
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

  // Format currency
  const formatCurrency = (amount: number | string | null | undefined) => {
    // Return a fallback if the amount is not valid
    if (amount === null || amount === undefined) {
      return "$0.00";
    }

    // Parse the amount if it's a string
    let numericAmount: number;
    if (typeof amount === "string") {
      numericAmount = parseFloat(amount);
    } else {
      numericAmount = amount;
    }

    // Return a fallback if the amount is not a valid number
    if (isNaN(numericAmount)) {
      return "$0.00";
    }

    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(numericAmount);
    } catch (error) {
      console.error("Error formatting currency:", error);
      return `$${numericAmount.toFixed(2)}`;
    }
  };

  // Format percentage
  const formatPercentage = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) {
      return "+0.00%";
    }

    // Parse the value if it's a string
    let numericValue: number;
    if (typeof value === "string") {
      numericValue = parseFloat(value);
    } else {
      numericValue = value;
    }

    // Handle NaN
    if (isNaN(numericValue)) {
      return "+0.00%";
    }

    return `${numericValue >= 0 ? "+" : ""}${numericValue.toFixed(2)}%`;
  };

  // Handle investment menu click
  const handleInvestmentMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    investmentId: number
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedInvestmentId(investmentId);
  };

  // Handle investment menu close
  const handleInvestmentMenuClose = () => {
    setAnchorEl(null);
    setSelectedInvestmentId(null);
  };

  // Handle edit investment
  const handleEditInvestment = () => {
    handleInvestmentMenuClose();
    const investment = investments.find((i) => i.id === selectedInvestmentId);
    if (investment) {
      onEditInvestment(investment);
    }
  };

  // Handle delete investment
  const handleDeleteInvestment = () => {
    handleInvestmentMenuClose();
    if (selectedInvestmentId) {
      onDeleteInvestment(selectedInvestmentId);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (investments.length === 0) {
    return (
      <Card elevation={0} sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
        <InvestmentIcon sx={{ fontSize: 60, color: "primary.light", mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          No investments found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Start tracking your portfolio by adding your first investment
        </Typography>
        <Button variant="contained" color="primary" onClick={onAddInvestment}>
          Add Investment
        </Button>
      </Card>
    );
  }

  return (
    <>
      <Grid container spacing={3}>
        {investments.map((investment) => (
          <Grid item key={investment.id} xs={12} sm={6} md={4} lg={3}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 2,
                height: "100%",
                transition: "transform 0.2s, box-shadow 0.2s",
                p: 2,
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 2,
                }}
              >
                <Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {investment.name}
                  </Typography>
                  <Chip
                    size="small"
                    label={formatInvestmentType(investment.type)}
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                <IconButton
                  aria-label="investment options"
                  onClick={(e) => handleInvestmentMenuClick(e, investment.id)}
                >
                  <MoreVertIcon />
                </IconButton>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Current Value
                </Typography>
                <Typography variant="h6" fontWeight="medium">
                  {formatCurrency(investment.current_value)}
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    color={
                      !isNaN(investment.profit_loss_percentage) &&
                      investment.profit_loss_percentage >= 0
                        ? "success.main"
                        : "error.main"
                    }
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    {!isNaN(investment.profit_loss_percentage) &&
                    investment.profit_loss_percentage >= 0 ? (
                      <GrowthIcon fontSize="small" />
                    ) : (
                      <DeclineIcon fontSize="small" />
                    )}
                    {formatPercentage(investment.profit_loss_percentage)}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Purchase Value:{" "}
                  {formatCurrency(calculatePurchaseValue(investment))}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {investment.symbol && `Symbol: ${investment.symbol}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {investment.units !== null &&
                  investment.units !== undefined &&
                  !isNaN(Number(investment.units))
                    ? `Units: ${Number(investment.units).toFixed(
                        investment.type === "cryptocurrency" ? 6 : 2
                      )}`
                    : investment.quantity !== null &&
                      investment.quantity !== undefined &&
                      !isNaN(Number(investment.quantity)) &&
                      `Units: ${Number(investment.quantity).toFixed(
                        investment.type === "cryptocurrency" ? 6 : 2
                      )}`}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Investment Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleInvestmentMenuClose}
      >
        <MenuItem onClick={handleEditInvestment}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Edit Investment
        </MenuItem>
        <MenuItem onClick={handleDeleteInvestment}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          Delete Investment
        </MenuItem>
      </Menu>
    </>
  );
};

export default InvestmentList;
