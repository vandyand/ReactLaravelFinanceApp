import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  CircularProgress,
  FormHelperText,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Investment } from "../../pages/Investments";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import { fetchAccounts } from "../../store/slices/accountSlice";

interface InvestmentFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: any) => Promise<void>;
  currentInvestment: Investment | null;
  mode: "add" | "edit";
  actionInProgress: boolean;
}

// Investment types in API format
const investmentTypes = [
  "stock",
  "bond",
  "etf",
  "mutual_fund",
  "real_estate",
  "cryptocurrency",
  "commodity",
  "retirement",
  "other",
];

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

// Currencies list
const currencies = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "INR", name: "Indian Rupee" },
  { code: "BTC", name: "Bitcoin" },
  { code: "ETH", name: "Ethereum" },
];

const InvestmentForm = ({
  open,
  onClose,
  onSubmit,
  currentInvestment,
  mode,
  actionInProgress,
}: InvestmentFormProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { accounts } = useSelector((state: RootState) => state.accounts);

  // Fetch accounts when component mounts
  useEffect(() => {
    dispatch(fetchAccounts());
  }, [dispatch]);

  // Create a state to hold the initial values
  const [initialValues, setInitialValues] = useState({
    name: "",
    type: "stock",
    purchase_price: "",
    current_price: "",
    purchase_date: new Date(),
    symbol: "",
    quantity: "",
    notes: "",
    account_id: "",
    currency: "USD",
  });

  // Set initial values when currentInvestment changes or mode changes
  useEffect(() => {
    if (currentInvestment) {
      setInitialValues({
        name: currentInvestment.name || "",
        type: currentInvestment.type || "stock",
        purchase_price:
          currentInvestment.purchase_price !== undefined
            ? currentInvestment.purchase_price.toString()
            : "",
        current_price:
          currentInvestment.current_price !== undefined
            ? currentInvestment.current_price.toString()
            : "",
        purchase_date: currentInvestment.purchase_date
          ? new Date(currentInvestment.purchase_date)
          : new Date(),
        symbol: currentInvestment.symbol || "",
        quantity:
          currentInvestment.quantity !== null &&
          currentInvestment.quantity !== undefined
            ? currentInvestment.quantity.toString()
            : "",
        notes: currentInvestment.notes || "",
        account_id: currentInvestment.account?.id?.toString() || "",
        currency: currentInvestment.account?.currency || "USD",
      });
    } else {
      // Reset to defaults for new investment
      setInitialValues({
        name: "",
        type: "stock",
        purchase_price: "",
        current_price: "",
        purchase_date: new Date(),
        symbol: "",
        quantity: "",
        notes: "",
        account_id: accounts.length > 0 ? accounts[0].id.toString() : "",
        currency: "USD",
      });
    }
  }, [currentInvestment, mode, accounts]);

  // Form validation schema
  const validationSchema = Yup.object({
    name: Yup.string().required("Investment name is required"),
    type: Yup.string().required("Investment type is required"),
    purchase_price: Yup.number()
      .required("Purchase price is required")
      .moreThan(0, "Price must be greater than 0"),
    current_price: Yup.number()
      .required("Current price is required")
      .moreThan(0, "Price must be greater than 0"),
    purchase_date: Yup.date().required("Purchase date is required"),
    symbol: Yup.string().nullable(),
    quantity: Yup.number()
      .nullable()
      .transform((value) => (isNaN(value) ? null : value))
      .test(
        "is-positive",
        "Quantity must be greater than 0",
        (value: number | null | undefined) =>
          value === null || value === undefined || value > 0
      ),
    notes: Yup.string().nullable(),
    account_id: Yup.number().required("Account is required"),
    currency: Yup.string().required("Currency is required"),
  });

  // Form handling
  const formik = useFormik({
    initialValues: initialValues,
    validationSchema: validationSchema,
    enableReinitialize: true,
    onSubmit: onSubmit,
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mode === "add" ? "Add New Investment" : "Edit Investment"}
      </DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            {/* Account Selection */}
            <Grid item xs={12} sm={6}>
              <FormControl
                fullWidth
                margin="normal"
                variant="outlined"
                error={
                  formik.touched.account_id && Boolean(formik.errors.account_id)
                }
              >
                <InputLabel id="account-label">Account</InputLabel>
                <Select
                  labelId="account-label"
                  id="account_id"
                  name="account_id"
                  value={formik.values.account_id}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  label="Account"
                >
                  {accounts.length === 0 ? (
                    <MenuItem disabled value="">
                      No accounts available
                    </MenuItem>
                  ) : (
                    accounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
                {formik.touched.account_id && formik.errors.account_id && (
                  <FormHelperText>{formik.errors.account_id}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Currency Selection */}
            <Grid item xs={12} sm={6}>
              <FormControl
                fullWidth
                margin="normal"
                variant="outlined"
                error={
                  formik.touched.currency && Boolean(formik.errors.currency)
                }
              >
                <InputLabel id="currency-label">Currency</InputLabel>
                <Select
                  labelId="currency-label"
                  id="currency"
                  name="currency"
                  value={formik.values.currency}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  label="Currency"
                >
                  {currencies.map((currency) => (
                    <MenuItem key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.currency && formik.errors.currency && (
                  <FormHelperText>{formik.errors.currency}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="name"
                name="name"
                label="Investment Name"
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
                <InputLabel id="type-label">Investment Type</InputLabel>
                <Select
                  labelId="type-label"
                  id="type"
                  name="type"
                  value={formik.values.type}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.type && Boolean(formik.errors.type)}
                  label="Investment Type"
                >
                  {investmentTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {formatInvestmentType(type)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="purchase_price"
                name="purchase_price"
                label="Purchase Price"
                type="number"
                value={formik.values.purchase_price}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.purchase_price &&
                  Boolean(formik.errors.purchase_price)
                }
                helperText={
                  formik.touched.purchase_price && formik.errors.purchase_price
                }
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
              <TextField
                fullWidth
                id="current_price"
                name="current_price"
                label="Current Price"
                type="number"
                value={formik.values.current_price}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.current_price &&
                  Boolean(formik.errors.current_price)
                }
                helperText={
                  formik.touched.current_price && formik.errors.current_price
                }
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
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Purchase Date"
                  value={formik.values.purchase_date}
                  onChange={(date) =>
                    formik.setFieldValue("purchase_date", date)
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: "normal",
                      variant: "outlined",
                      error:
                        formik.touched.purchase_date &&
                        Boolean(formik.errors.purchase_date),
                      helperText:
                        formik.touched.purchase_date &&
                        (formik.errors.purchase_date as string),
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="symbol"
                name="symbol"
                label="Symbol (Optional)"
                value={formik.values.symbol}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.symbol && Boolean(formik.errors.symbol)}
                helperText={formik.touched.symbol && formik.errors.symbol}
                margin="normal"
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="quantity"
                name="quantity"
                label="Quantity/Shares"
                type="number"
                value={formik.values.quantity}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.quantity && Boolean(formik.errors.quantity)
                }
                helperText={formik.touched.quantity && formik.errors.quantity}
                margin="normal"
                variant="outlined"
              />
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
          <Button onClick={onClose} disabled={actionInProgress}>
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
            ) : mode === "add" ? (
              "Add Investment"
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default InvestmentForm;
