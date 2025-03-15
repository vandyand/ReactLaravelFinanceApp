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
  Tooltip,
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
                    label={investment.type}
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
                      investment.profit_loss >= 0
                        ? "success.main"
                        : "error.main"
                    }
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    {investment.profit_loss >= 0 ? (
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
                  Purchase Value: {formatCurrency(investment.purchase_value)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {investment.symbol && `Symbol: ${investment.symbol}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {investment.units && `Units: ${investment.units}`}
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
