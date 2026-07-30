import { useState, useContext } from "react";
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
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import ColorModeContext from "../theme";

const expandedDrawerWidth = 240;
const collapsedDrawerWidth = 72;

const navItems = [
  { text: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
  { text: "Orders", path: "/orders", icon: <ShoppingCartIcon /> },
  { text: "Products", path: "/products", icon: <InventoryIcon /> },
  { text: "Drivers", path: "/drivers", icon: <PeopleIcon /> },
  { text: "Customers", path: "/customers", icon: <PeopleIcon /> },  // NEW
  { text: "Reports", path: "/reports", icon: <AssessmentIcon /> },
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
    path === "/dashboard" ? location.pathname === "/dashboard" || location.pathname === "/" : location.pathname.startsWith(path);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const drawer = (
    <Box sx={{ width: drawerWidth, height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar sx={{ px: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h6" noWrap sx={{ opacity: drawerCollapsed ? 0 : 1, transition: "opacity .2s" }}>
          GasMobil
        </Typography>
        <Button size="small" color="inherit" onClick={() => setDrawerCollapsed(!drawerCollapsed)}>
          {drawerCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </Button>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => {
          const active = isActiveRoute(item.path);
          return (
            <ListItemButton
              key={item.text}
              selected={active}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              sx={{
                borderRadius: 1, mb: 0.5,
                justifyContent: drawerCollapsed ? "center" : "flex-start",
                px: 2,
                "&.Mui-selected": {
                  backgroundColor: theme.palette.action.selected,
                  color: theme.palette.primary.main,
                  "& .MuiListItemIcon-root": { color: theme.palette.primary.main },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: drawerCollapsed ? 0 : 2, justifyContent: "center" }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{ opacity: drawerCollapsed ? 0 : 1, transition: "opacity .2s", whiteSpace: "nowrap" }}
              />
            </ListItemButton>
          );
        })}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      {/* FIXED: Show station name from user.station */}
      <Box sx={{ px: 2, py: 2, display: drawerCollapsed ? "none" : "block" }}>
        <Typography variant="body2" color="textSecondary">Station</Typography>
        <Typography variant="body2" fontWeight="bold" noWrap>
          {user?.station?.name || "No Station"}
        </Typography>
        <Typography variant="caption" color="textSecondary" display="block" noWrap>
          {user?.email}
        </Typography>
      </Box>
    </Box>
  );

  if (isLoading) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: "none" } }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap>GasMobil Agent</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="body2" sx={{ display: { xs: "none", sm: "block" } }}>
              {user?.station?.name ? `${user.station.name} | ${user.email}` : user?.email}
            </Typography>
            <Button color="inherit" onClick={() => { logout(); navigate("/login"); }}>Logout</Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", sm: "none" }, "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent"
          sx={{ display: { xs: "none", sm: "block" }, "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth } }}
          open>
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Container sx={{ py: 4, px: 0 }}>
          <Outlet />
        </Container>
      </Box>
      <Box sx={{ position: "fixed", bottom: 16, right: 16, zIndex: theme.zIndex.tooltip, borderRadius: "50%", backgroundColor: theme.palette.background.paper, boxShadow: 3 }}>
        <IconButton onClick={colorMode.toggleColorMode} color="primary">
          {theme.palette.mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Box>
    </Box>
  );
}
