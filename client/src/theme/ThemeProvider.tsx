import { CssBaseline, ThemeProvider as MuiTheme, createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#aa3bff" },
    background: { default: "#0f172a", paper: "#1e293b" },
    text: { primary: "#f1f5f9", secondary: "#94a3b8" },
    divider: "#334155",
  },
  shape: { borderRadius: 8 },
  typography: { fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif" },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiTextField: { defaultProps: { variant: "outlined" } },
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
