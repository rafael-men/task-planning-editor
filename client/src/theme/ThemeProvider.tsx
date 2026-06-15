import { CssBaseline, ThemeProvider as MuiTheme, createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary:    { main: "#c0392b", light: "#e74c3c", dark: "#922b21" },
    secondary:  { main: "#1a3a5c", light: "#2e5f96", dark: "#0f2236" },
    error:      { main: "#e74c3c" },
    background: { default: "#07111f", paper: "rgba(15, 25, 45, 0.72)" },
    text:       { primary: "#f0f4ff", secondary: "#8fa3c8" },
    divider:    "rgba(192, 57, 43, 0.22)",
  },
  shape: { borderRadius: 12 },
  typography: { fontFamily: "'Forum', system-ui, 'Segoe UI', sans-serif" },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          letterSpacing: "0.01em",
          "&.MuiButton-containedPrimary": {
            background: "linear-gradient(135deg, #c0392b 0%, #922b21 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #e74c3c 0%, #a93226 100%)",
            },
          },
        },
      },
    },
    MuiTextField: { defaultProps: { variant: "outlined" } },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backdropFilter: "blur(20px) saturate(165%)",
          border: "1px solid rgba(192, 57, 43, 0.18)",
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: { backdropFilter: "blur(12px)" },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          background: "rgba(8, 15, 30, 0.90)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(192, 57, 43, 0.18)",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          background: "rgba(8, 15, 30, 0.90)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(192, 57, 43, 0.20)",
          fontSize: "0.75rem",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: "#8fa3c8",
          "&:hover": {
            color: "#f0f4ff",
            background: "rgba(192, 57, 43, 0.12)",
          },
        },
      },
    },
  },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <MuiTheme theme={theme}>
      <CssBaseline />
      {children}
    </MuiTheme>
  );
}
