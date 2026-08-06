import { useState, useContext, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItemIcon,
  ListItemText, IconButton, Button, Divider, Container, Alert,
  ListItemButton, useTheme,
} from "@mui/material";
import {
  Menu as MenuIcon, ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon, Dashboard as DashboardIcon,
  ShoppingCart as ShoppingCartIcon, Inventory as InventoryIcon,
  People as PeopleIcon, Store as StoreIcon, Assessment as AssessmentIcon,
  Brightness4 as Brightness4Icon, Brightness7 as Brightness7Icon,
  Notifications as NotificationsIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import ColorModeContext from "../theme";
import NotificationBell from "./NotificationBell";

const expandedDrawerWidth = 240;
const collapsedDrawerWidth = 72;

const navItems = [
  { text: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
  { text: "Orders", path: "/orders", icon: <ShoppingCartIcon /> },
  { text: "Products", path: "/products", icon: <InventoryIcon /> },
  { text: "Drivers", path: "/drivers", icon: <PeopleIcon /> },
  { text: "Customers", path: "/customers", icon: <PeopleIcon /> },
  { text: "Stations", path: "/stations", icon: <StoreIcon /> },
  { text: "Reports", path: "/reports", icon: <AssessmentIcon /> },
  { text: "Notifications", path: "/notifications", icon: <NotificationsIcon /> },
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

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div>
      <Toolbar sx={{ justifyContent: drawerCollapsed ? "center" : "flex-start", px: 2 }}>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700 }}>
          {drawerCollapsed ? "GM" : "GasMobil"}
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1 }}>
        {navItems.map((item) => {
          const active = isActiveRoute(item.path);
          return (
            <ListItemButton
              key={item.text}
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
          );
        })}
      </List>
      <Divider />
      <Box sx={{ p: 2, textAlign: drawerCollapsed ? "center" : "left" }}>
        <Typography variant="caption" color="text.secondary">
          Signed in as
        </Typography>
        <Typography variant="body2" fontWeight={600} noWrap>
          {user?.email}
        </Typography>
      </Box>
    </div>
  );

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            GasMobil Admin
          </Typography>
          {/* ── NOTIFICATION BELL ADDED ── */}
          <NotificationBell />
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
          <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleColorMode} color="inherit">
            {theme.palette.mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Container maxWidth="xl">
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}