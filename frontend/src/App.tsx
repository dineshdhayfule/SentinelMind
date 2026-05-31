import { ThemeProvider, createTheme, CssBaseline, Box } from "@mui/material";
import Dashboard from "./components/Dashboard";
import "./App.css";

const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0a0e27",
      paper: "#1a1f3a",
    },
    primary: {
      main: "#2196F3",
    },
    secondary: {
      main: "#FF9800",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          background: "linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)",
          minHeight: "100vh",
        }}
      >
        <Dashboard />
      </Box>
    </ThemeProvider>
  );
}

export default App;
