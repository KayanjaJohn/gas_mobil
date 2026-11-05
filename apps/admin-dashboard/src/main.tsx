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
        typography: { fontFamily: '"DM Sans", sans-serif', h1: { fontFamily: '"DM Sans", sans-serif' }, h2: { fontFamily: '"DM Sans", sans-serif' }, h3: { fontFamily: '"DM Sans", sans-serif' }, h4: { fontFamily: '"DM Sans", sans-serif' }, h5: { fontFamily: '"DM Sans", sans-serif' }, h6: { fontFamily: '"DM Sans", sans-serif' }, button: { fontFamily: '"DM Sans", sans-serif', fontWeight: 800 } },
        palette: {
          mode,
          primary: { main: "#12834B", dark: "#0B6339", contrastText: "#FFFFFF" },
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
          MuiTypography: { styleOverrides: { h4: { color: mode === "dark" ? "#FFF8EE" : "#0B3D2E", fontWeight: 800 } } },
          MuiTableCell: { styleOverrides: { root: { color: mode === "light" ? "#0B3D2E" : "#FFF8EE", borderColor: mode === "light" ? "#D8CDBB" : "#315C4D" }, head: { color: mode === "light" ? "#0B3D2E" : "#FFF8EE", fontWeight: 700 } } },
          MuiInputBase: { styleOverrides: { root: { color: mode === "light" ? "#0B3D2E" : "#FFF8EE" } } },
          MuiInputLabel: { styleOverrides: { root: { color: mode === "light" ? "#68786F" : "#D8E7DE", "&.Mui-focused": { color: "#F36A21" } } } },
          MuiFormLabel: { styleOverrides: { root: { color: mode === "light" ? "#68786F" : "#D8E7DE" } } },
          MuiMenuItem: { styleOverrides: { root: { color: mode === "dark" ? "#FFF8EE" : "#0B3D2E" } } },
          MuiDialogTitle: { styleOverrides: { root: { color: mode === "light" ? "#0B3D2E" : "#FFF8EE" } } },
          MuiDialogContent: { styleOverrides: { root: { color: mode === "light" ? "#0B3D2E" : "#FFF8EE" } } },
          MuiButton: { styleOverrides: {
            root: { textTransform: "none", fontWeight: 700 },
            containedPrimary: { backgroundColor: "#12834B", color: "#FFFFFF", "&:hover": { backgroundColor: "#0B6339" } },
            outlinedPrimary: { borderColor: "#F36A21", color: "#D95B17", "&:hover": { borderColor: "#F36A21", backgroundColor: "rgba(243,106,33,.08)" } },
          } },
          MuiChip: { styleOverrides: { label: { fontWeight: 600 } } },
        },
      }),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter basename="/admin">
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