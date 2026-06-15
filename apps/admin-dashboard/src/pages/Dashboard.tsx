import { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import { TrendingUp, TrendingDown, People, ShoppingCart } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Dashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSales: 0,
    totalCustomers: 0,
    pendingOrders: 0,
  });

  useEffect(() => {
    axios.get(`${API_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setStats(res.data.data))
    .catch(console.error);
  }, [token]);

  const cards = [
    { title: 'Total Sales', value: `UGX ${stats.totalSales?.toLocaleString() || 0}`, icon: <TrendingUp color="success" />, color: '#41f1b6' },
    { title: 'Total Orders', value: stats.totalOrders || 0, icon: <ShoppingCart color="primary" />, color: '#7380ec' },
    { title: 'Total Customers', value: stats.totalCustomers || 0, icon: <People color="warning" />, color: '#ffbb55' },
    { title: 'Pending Orders', value: stats.pendingOrders || 0, icon: <TrendingDown color="error" />, color: '#ff7782' },
  ];

  return (
    <Grid container spacing={3}>
      {cards.map((card) => (
        <Grid item xs={12} sm={6} md={3} key={card.title}>
          <Paper sx={{ p: 3, borderLeft: `4px solid ${card.color}` }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography color="textSecondary" variant="body2">{card.title}</Typography>
                <Typography variant="h4" sx={{ mt: 1, fontWeight: 'bold' }}>{card.value}</Typography>
              </Box>
              {card.icon}
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}