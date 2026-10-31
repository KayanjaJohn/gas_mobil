import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import App from "./App";
import ColorModeContext from "./theme";

function Main() {
  const [mode, setMode] = useState<"light" | "dark">("light");

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prev) => (prev === "light" ? "dark" : "light"));
      },
    }),
    [],
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: "#0B3D2E", contrastText: "#FFF8EE" },
          secondary: { main: "#F36A21", contrastText: "#FFF8EE" },
          success: { main: "#21865D" },
          warning: { main: "#D97706" },
          background: {
            default: mode === "light" ? "#F3EBDD" : "#0B3D2E",
            paper: mode === "light" ? "#FFF8EE" : "#123F32",
          },
          text: {
            primary: mode === "light" ? "#0B3D2E" : "#FFF8EE",
            secondary: mode === "light" ? "#68786F" : "#D8E7DE",
          },
          divider: mode === "light" ? "#D8CDBB" : "#315C4D",
        },
        components: {
          MuiTableCell: { styleOverrides: { root: { color: mode === "light" ? "#0B3D2E" : "#FFF8EE", borderColor: mode === "light" ? "#D8CDBB" : "#315C4D" }, head: { color: mode === "light" ? "#0B3D2E" : "#FFF8EE", fontWeight: 700 } } },
          MuiInputBase: { styleOverrides: { root: { color: mode === "light" ? "#0B3D2E" : "#FFF8EE" } } },
          MuiInputLabel: { styleOverrides: { root: { color: mode === "light" ? "#68786F" : "#D8E7DE", "&.Mui-focused": { color: "#F36A21" } } } },
          MuiFormLabel: { styleOverrides: { root: { color: mode === "light" ? "#68786F" : "#D8E7DE" } } },
          MuiMenuItem: { styleOverrides: { root: { color: "#0B3D2E" } } },
          MuiDialogTitle: { styleOverrides: { root: { color: mode === "light" ? "#0B3D2E" : "#FFF8EE" } } },
          MuiDialogContent: { styleOverrides: { root: { color: mode === "light" ? "#0B3D2E" : "#FFF8EE" } } },
          MuiButton: { styleOverrides: { root: { textTransform: "none", fontWeight: 600 } } },
          MuiChip: { styleOverrides: { label: { fontWeight: 600 } } },
        },
      }),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>,
);