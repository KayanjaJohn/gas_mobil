import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem,
  ListItemIcon, ListItemText, IconButton, Avatar, Badge
} from '@mui/material';
import {
  Dashboard, People, ShoppingCart, LocalShipping,
  Inventory, Settings, Logout, Menu as MenuIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;

const menuItems = [
  { path: '/', label: 'Dashboard', icon: <Dashboard /> },
  { path: '/orders', label: 'Orders', icon: <ShoppingCart /> },
  { path: '/products', label: 'Products', icon: <Inventory /> },
  { path: '/drivers', label: 'Drivers', icon: <LocalShipping /> },
  { path: '/customers', label: 'Customers', icon: <People /> },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            GasMobil Admin
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">{user.name}</Typography>
            <Typography variant="caption" sx={{ bgcolor: 'primary.main', color: 'white', px: 1, py: 0.5, borderRadius: 1 }}>
              {user.role}
            </Typography>
            <IconButton color="inherit" onClick={logout}>
              <Logout />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Gas<span style={{ color: '#ff7782' }}>Mobil</span>
          </Typography>
        </Toolbar>
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.path}
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                '&.Mui-selected': { bgcolor: 'primary.light', color: 'primary.contrastText' },
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? 'inherit' : 'primary.main' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, ml: `${drawerWidth}px` }}>
        <Outlet />
      </Box>
    </Box>
  );
}