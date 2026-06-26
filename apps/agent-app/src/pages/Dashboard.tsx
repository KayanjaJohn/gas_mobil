import { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box, Alert, CircularProgress, Chip, Button } from '@mui/material';
import { TrendingUp, ShoppingCart, LocalShipping, Inventory, Assessment } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Dashboard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalOrders: 0, pendingOrders: 0, totalDrivers: 0, totalProducts: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.get(`${API_URL}/agent/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { title: 'Station Orders', value: stats.totalOrders, icon: <ShoppingCart />, color: '#7380ec' },
    { title: 'Pending', value: stats.pendingOrders, icon: <TrendingUp />, color: '#ffbb55' },
    { title: 'Drivers', value: stats.totalDrivers, icon: <LocalShipping />, color: '#41f1b6' },
    { title: 'Products', value: stats.totalProducts, icon: <Inventory />, color: '#ff7782' },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' } }}>
        <Chip label={`Station: ${user?.station?.name || 'N/A'}`} color="primary" />
        <Button variant="contained" startIcon={<Assessment />} onClick={() => navigate('/reports')}>
          Reports
        </Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={3}>
          {cards.map((card) => (
            <Grid item xs={12} sm={6} md={3} key={card.title}>
              <Paper sx={{ p: 3, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ bgcolor: card.color, color: '#fff', p: 1.5, borderRadius: 2, display: 'flex' }}>{card.icon}</Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">{card.title}</Typography>
                  <Typography variant="h5" fontWeight="bold">{card.value}</Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
