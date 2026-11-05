import { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import {
  Box, Drawer, AppBar, Toolbar, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, IconButton, Typography, Divider,
  useTheme, CssBaseline,
} from "@mui/material";
import {
  Menu as MenuIcon, Dashboard, ShoppingCart, LocalShipping,
  People, Store, Assessment, Notifications, History as HistoryIcon, ChevronLeft, ChevronRight,
  Brightness4, Brightness7, Logout,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import ColorModeContext from "../theme";
import NotificationBell from "./NotificationBell";

const expandedDrawerWidth = 260;
const collapsedDrawerWidth = 72;

const navItems = [
  { text: "Dashboard", path: "/dashboard", icon: <Dashboard /> },
  { text: "Orders", path: "/orders", icon: <ShoppingCart /> },
  { text: "Products", path: "/products", icon: <Store /> },
  { text: "Drivers", path: "/drivers", icon: <LocalShipping /> },
  { text: "Customers", path: "/customers", icon: <People /> },
  { text: "Stations", path: "/stations", icon: <Store /> },
  { text: "Station History", path: "/station-history", icon: <HistoryIcon /> },
  { text: "Reports", path: "/reports", icon: <Assessment /> },
  { text: "Notifications", path: "/notifications", icon: <Notifications /> },
];

export default function Layout() {
  const { user, token, isLoading, logout, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerCollapsed, setDrawerCollapsed] = useState(false);
  const colorMode = useContext(ColorModeContext);

  const drawerWidth = drawerCollapsed ? collapsedDrawerWidth : expandedDrawerWidth;

  const isActiveRoute = (path: string) =>
    path === "/dashboard"
      ? location.pathname === "/dashboard" || location.pathname === "/"
      : location.pathname.startsWith(path);

  useEffect(() => {
    if (error && error.includes("Session expired")) {
      logout();
      navigate("/login");
    }
  }, [error, logout, navigate]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!user) {
    return <NavigateToLogin />;
  }

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", background: "radial-gradient(ellipse at 50% 22%, rgba(0,154,69,.36) 0%, rgba(0,74,40,.16) 42%, transparent 76%), linear-gradient(180deg,#002A19 0%,#00170C 100%)", color: "#FFF8EE", "& .MuiTypography-root": { color: "#FFF8EE" }, "& .MuiListItemIcon-root": { color: "#FFF8EE" }, "& .MuiDivider-root": { borderColor: "#315C4D" } }}>
      <Toolbar sx={{ justifyContent: "center", background: "radial-gradient(ellipse at 50% 22%, rgba(0,154,69,.36) 0%, rgba(0,74,40,.16) 42%, transparent 76%), linear-gradient(180deg,#002A19 0%,#00170C 100%)", gap: 1 }}>
        <Box component="img" src="/admin/gasmobil-mark.png?v=20261105" alt="GasMobil" sx={{ width: 38, height: 38, objectFit: "contain" }} />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {drawerCollapsed ? "GM" : "GasMobil"}
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ flex: 1, px: 1 }}>
        {navItems.map((item) => {
          const active = isActiveRoute(item.path);
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={active}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  color: "#FFF8EE",
                  "&:hover": { backgroundColor: "rgba(255,248,238,0.10)" },
                  justifyContent: drawerCollapsed ? "center" : "flex-start",
                  px: 2,
                  "&.Mui-selected": {
                    backgroundColor: "rgba(243,106,33,0.20)",
                    color: "#F36A21",
                    "& .MuiListItemIcon-root": { color: "#F36A21" },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: drawerCollapsed ? 0 : 40, justifyContent: "center" }}>
                  {item.icon}
                </ListItemIcon>
                {!drawerCollapsed && <ListItemText primary={item.text} />}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider />
      <Box sx={{ p: 2, textAlign: "center" }}>
        <Typography variant="caption" color="text.secondary">
          Signed in as
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {user?.email}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{ background: "radial-gradient(ellipse at 50% 22%, rgba(0,154,69,.36) 0%, rgba(0,74,40,.16) 42%, transparent 76%), linear-gradient(180deg,#002A19 0%,#00170C 100%)", color: "#FFF8EE",
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2, display: { sm: "none" } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            GasMobil Admin
          </Typography>
          <NotificationBell token={token || ""} userRole="admin" />
          <IconButton color="inherit" onClick={colorMode.toggleColorMode}>
            {theme.palette.mode === "dark" ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
          <IconButton color="inherit" onClick={() => { logout(); navigate("/login"); }}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: expandedDrawerWidth, background: "radial-gradient(ellipse at 50% 22%, rgba(0,154,69,.36) 0%, rgba(0,74,40,.16) 42%, transparent 76%), linear-gradient(180deg,#002A19 0%,#00170C 100%)", color: "#FFF8EE", borderColor: "#315C4D" },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth, transition: theme.transitions.create("width"), background: "radial-gradient(ellipse at 50% 22%, rgba(0,154,69,.36) 0%, rgba(0,74,40,.16) 42%, transparent 76%), linear-gradient(180deg,#002A19 0%,#00170C 100%)", color: "#FFF8EE", borderColor: "#315C4D" },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, minHeight: "100vh", background: "radial-gradient(ellipse at 55% 28%, rgba(0,146,66,.28) 0%, rgba(0,70,36,.12) 40%, transparent 75%), linear-gradient(145deg,#00170C 0%,#00351E 52%,#00140B 100%)" }}>
        <Toolbar />
        {error && (
          <Box sx={{ mb: 2, p: 2, bgcolor: "error.light", color: "error.contrastText", borderRadius: 1 }}>
            {error}
          </Box>
        )}
        <Outlet />
      </Box>
    </Box>
  );
}

function NavigateToLogin() {
  const navigate = useNavigate();
  useEffect(() => { navigate("/login"); }, [navigate]);
  return null;
}