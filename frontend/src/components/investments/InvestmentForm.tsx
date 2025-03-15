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
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Investment } from "../../pages/Investments";

interface InvestmentFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: any) => Promise<void>;
  currentInvestment: Investment | null;
  mode: "add" | "edit";
  actionInProgress: boolean;
}

// Investment types
const investmentTypes = [
  "Stocks",
  "Bonds",
  "ETFs",
  "Mutual Funds",
  "Real Estate",
  "Cryptocurrency",
  "Commodities",
  "Retirement",
  "Other",
];

const InvestmentForm = ({
  open,
  onClose,
  onSubmit,
  currentInvestment,
  mode,
  actionInProgress,
}: InvestmentFormProps) => {
  // Form validation schema
  const validationSchema = Yup.object({
    name: Yup.string().required("Investment name is required"),
    type: Yup.string().required("Investment type is required"),
    purchase_value: Yup.number()
      .required("Purchase value is required")
      .moreThan(0, "Value must be greater than 0"),
    current_value: Yup.number()
      .required("Current value is required")
      .moreThan(0, "Value must be greater than 0"),
    purchase_date: Yup.date().required("Purchase date is required"),
    symbol: Yup.string().nullable(),
    units: Yup.number()
      .nullable()
      .transform((value) => (isNaN(value) ? null : value))
      .test(
        "is-positive",
        "Units must be greater than 0",
        (value) => value === null || value > 0
      ),
    notes: Yup.string().nullable(),
  });

  // Form handling
  const formik = useFormik({
    initialValues: {
      name: currentInvestment?.name || "",
      type: currentInvestment?.type || "Stocks",
      purchase_value: currentInvestment?.purchase_value.toString() || "",
      current_value: currentInvestment?.current_value.toString() || "",
      purchase_date: currentInvestment?.purchase_date
        ? new Date(currentInvestment.purchase_date)
        : new Date(),
      symbol: currentInvestment?.symbol || "",
      units: currentInvestment?.units?.toString() || "",
      notes: currentInvestment?.notes || "",
    },
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
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="purchase_value"
                name="purchase_value"
                label="Purchase Value"
                type="number"
                value={formik.values.purchase_value}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.purchase_value &&
                  Boolean(formik.errors.purchase_value)
                }
                helperText={
                  formik.touched.purchase_value && formik.errors.purchase_value
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
                id="current_value"
                name="current_value"
                label="Current Value"
                type="number"
                value={formik.values.current_value}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.current_value &&
                  Boolean(formik.errors.current_value)
                }
                helperText={
                  formik.touched.current_value && formik.errors.current_value
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
                id="units"
                name="units"
                label="Units/Shares (Optional)"
                type="number"
                value={formik.values.units}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.units && Boolean(formik.errors.units)}
                helperText={formik.touched.units && formik.errors.units}
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
