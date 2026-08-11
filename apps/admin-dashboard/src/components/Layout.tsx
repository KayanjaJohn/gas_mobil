import { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import {
  Box, Drawer, AppBar, Toolbar, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, IconButton, Typography, Divider,
  useTheme, CssBaseline, Badge,
} from "@mui/material";
import {
  Menu as MenuIcon, Dashboard, ShoppingCart, LocalShipping,
  People, Store, Assessment, Notifications, ChevronLeft, ChevronRight,
  Brightness4, Brightness7, Logout,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import ColorModeContext from "../theme";

const expandedDrawerWidth = 260;
const collapsedDrawerWidth = 72;

const navItems = [
  { text: "Dashboard", path: "/dashboard", icon: <Dashboard /> },
  { text: "Orders", path: "/orders", icon: <ShoppingCart /> },
  { text: "Products", path: "/products", icon: <Store /> },
  { text: "Drivers", path: "/drivers", icon: <LocalShipping /> },
  { text: "Customers", path: "/customers", icon: <People /> },
  { text: "Stations", path: "/stations", icon: <Store /> },
  { text: "Reports", path: "/reports", icon: <Assessment /> },
  { text: "Notifications", path: "/notifications", icon: <Notifications /> },
];

export default function Layout() {
  const { user, isLoading, logout, error } = useAuth();
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
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar sx={{ justifyContent: "center" }}>
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
                  borderRadius: 1,
                  mb: 0.5,
                  justifyContent: drawerCollapsed ? "center" : "flex-start",
                  px: 2,
                  "&.Mui-selected": {
                    backgroundColor: theme.palette.action.selected,
                    color: theme.palette.primary.main,
                    "& .MuiListItemIcon-root": { color: theme.palette.primary.main },
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
        sx={{
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
          <IconButton color="inherit" onClick={() => navigate("/notifications")}>
            <Badge badgeContent={0} color="error">
              <Notifications />
            </Badge>
          </IconButton>
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
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: expandedDrawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth, transition: theme.transitions.create("width") },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
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