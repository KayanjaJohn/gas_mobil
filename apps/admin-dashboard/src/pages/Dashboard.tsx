import { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box, Alert, CircularProgress } from '@mui/material';
import { TrendingUp, ShoppingCart, LocalShipping, Store, Assessment } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  totalDrivers: number;
  totalProducts: number;
  totalStations: number;
  todayRevenue: number;
  recentOrders: any[];
}

export default function Dashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0, pendingOrders: 0, totalDrivers: 0,
    totalProducts: 0, totalStations: 0, todayRevenue: 0, recentOrders: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data.data || res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { title: 'Total Orders', value: stats.totalOrders, icon: <ShoppingCart />, color: '#7380ec' },
    { title: 'Pending Orders', value: stats.pendingOrders, icon: <TrendingUp />, color: '#ffbb55' },
    { title: 'Active Drivers', value: stats.totalDrivers, icon: <LocalShipping />, color: '#41f1b6' },
    { title: 'Products', value: stats.totalProducts, icon: <Store />, color: '#ff7782' },
    { title: 'Stations', value: stats.totalStations, icon: <Store />, color: '#7380ec' },
    { title: "Today's Revenue", value: `UGX ${stats.todayRevenue.toLocaleString()}`, icon: <TrendingUp />, color: '#41f1b6' },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        System-wide overview
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Paper
          component="button"
          onClick={() => navigate('/reports')}
          sx={{
            border: 0,
            px: 2,
            py: 1.25,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: 'primary.contrastText',
            bgcolor: 'primary.main',
            cursor: 'pointer',
            font: 'inherit',
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          <Assessment fontSize="small" />
          <Typography variant="button">Reports</Typography>
        </Paper>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {cards.map((card) => (
              <Grid item xs={12} sm={6} md={4} key={card.title}>
                <Paper sx={{ p: 3, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ bgcolor: card.color, color: '#fff', p: 1.5, borderRadius: 2, display: 'flex' }}>
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

          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Recent Orders</Typography>
          <Paper sx={{ borderRadius: 2 }}>
            {stats.recentOrders?.map((order: any) => (
              <Box key={order.id} sx={{ p: 2, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" fontWeight="medium">Order #{order.id?.slice(0, 8)}</Typography>
                  <Typography variant="caption" color="textSecondary">{order.user?.name} • {order.station?.name}</Typography>
                </Box>
                <Typography variant="body2" fontWeight="bold" color="primary">
                  UGX {Number(order.totalAmount).toLocaleString()}
                </Typography>
              </Box>
            ))}
            {(!stats.recentOrders || stats.recentOrders.length === 0) && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="textSecondary">No recent orders</Typography>
              </Box>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
}
