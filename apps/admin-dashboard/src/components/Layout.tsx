import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Button, Container, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, isLoading, logout, error } = useAuth();
  const navigate = useNavigate();

  // FIX: Auto-logout on token error and redirect to login
  useEffect(() => {
    if (error && error.includes('Session expired')) {
      logout();
      navigate('/login');
    }
  }, [error, logout, navigate]);

  if (isLoading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            GasMobil Admin
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.email}
          </Typography>
          <Button color="inherit" onClick={() => { logout(); navigate('/login'); }}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      )}
      <Container sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
