import { createTheme } from "@mui/material/styles";

// Define color palette
const colors = {
  primary: {
    main: "#2E5BFF",
    light: "#6B8EFC",
    dark: "#0039CB",
    contrastText: "#FFFFFF",
  },
  secondary: {
    main: "#00C9A7",
    light: "#5EFBD6",
    dark: "#00987A",
    contrastText: "#FFFFFF",
  },
  error: {
    main: "#FF4D4F",
    light: "#FF7875",
    dark: "#CF1124",
    contrastText: "#FFFFFF",
  },
  warning: {
    main: "#FAAD14",
    light: "#FFD666",
    dark: "#D48806",
    contrastText: "#FFFFFF",
  },
  info: {
    main: "#1890FF",
    light: "#69C0FF",
    dark: "#0050B3",
    contrastText: "#FFFFFF",
  },
  success: {
    main: "#52C41A",
    light: "#95DE64",
    dark: "#237804",
    contrastText: "#FFFFFF",
  },
  background: {
    default: "#F8F9FA",
    paper: "#FFFFFF",
  },
  text: {
    primary: "#2C3E50",
    secondary: "#718096",
    disabled: "#A0AEC0",
  },
};

// Create theme
const theme = createTheme({
  palette: {
    primary: colors.primary,
    secondary: colors.secondary,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
    success: colors.success,
    background: colors.background,
    text: colors.text,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: "2.5rem",
    },
    h2: {
      fontWeight: 700,
      fontSize: "2rem",
    },
    h3: {
      fontWeight: 700,
      fontSize: "1.75rem",
    },
    h4: {
      fontWeight: 600,
      fontSize: "1.5rem",
    },
    h5: {
      fontWeight: 600,
      fontSize: "1.25rem",
    },
    h6: {
      fontWeight: 600,
      fontSize: "1rem",
    },
    subtitle1: {
      fontSize: "1rem",
      fontWeight: 500,
    },
    subtitle2: {
      fontSize: "0.875rem",
      fontWeight: 500,
    },
    body1: {
      fontSize: "1rem",
    },
    body2: {
      fontSize: "0.875rem",
    },
    button: {
      fontWeight: 600,
      textTransform: "none",
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
          },
        },
        containedPrimary: {
          "&:hover": {
            backgroundColor: colors.primary.dark,
          },
        },
        containedSecondary: {
          "&:hover": {
            backgroundColor: colors.secondary.dark,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)",
          borderRadius: 12,
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: "16px 20px",
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: "20px",
          "&:last-child": {
            paddingBottom: "20px",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid #EDF2F7",
          padding: "16px",
        },
        head: {
          fontWeight: 600,
          backgroundColor: "#F8FAFC",
        },
      },
    },
  },
});

export default theme;
