import { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import { TrendingUp, ShoppingCart, People, LocalShipping } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Dashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalDrivers: 0,
    totalProducts: 0,
  });

  useEffect(() => {
    axios.get(`${API_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setStats(res.data.data))
    .catch(console.error);
  }, [token]);

  const cards = [
    { title: 'Total Orders', value: stats.totalOrders, icon: <ShoppingCart />, color: '#7380ec' },
    { title: 'Pending Orders', value: stats.pendingOrders, icon: <TrendingUp />, color: '#ffbb55' },
    { title: 'Active Drivers', value: stats.totalDrivers, icon: <LocalShipping />, color: '#41f1b6' },
    { title: 'Products', value: stats.totalProducts, icon: <People />, color: '#ff7782' },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Paper sx={{ p: 3, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                bgcolor: card.color, 
                color: '#fff', 
                p: 1.5, 
                borderRadius: 2,
                display: 'flex'
              }}>
                {card.icon}
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">{card.title}</Typography>
                <Typography variant="h5" fontWeight="bold">{card.value}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
