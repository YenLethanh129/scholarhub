import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Create a theme with Navy Blue primary and Pastel Orange accent
const theme = createTheme({
  palette: {
    primary: {
      main: "#1e3a8a", // Navy Blue
      light: "#3b5998",
      dark: "#0f172a",
    },
    secondary: {
      main: "#fb923c", // Pastel Orange
      light: "#fdba74",
      dark: "#f97316",
    },
    warning: {
      main: "#fbbf24", // Light Yellow
    },
    background: {
      default: "#f3f4f6",
      paper: "#ffffff",
    },
    text: {
      primary: "#1f2937",
      secondary: "#6b7280",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RouterProvider router={router} />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
