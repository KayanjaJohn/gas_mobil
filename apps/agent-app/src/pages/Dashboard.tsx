import { useEffect, useState } from "react";
import { Grid, Paper, Typography, Box, Alert, CircularProgress, Chip, Button } from "@mui/material";
import { TrendingUp, ShoppingCart, LocalShipping, Inventory, Assessment } from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

export default function Dashboard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalOrders: 0, todayOrders: 0, pendingOrders: 0, totalDrivers: 0, totalProducts: 0, totalOrderValue: 0, outstandingCash: 0, todayRevenue: 0, recentOrders: [] as any[] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true); setError("");
    try {
      const res = await axios.get(`${API_URL}/agent/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { title: "Station Orders", value: stats.totalOrders, icon: <ShoppingCart />, color: "#0B3D2E" },
    { title: "Pending", value: stats.pendingOrders, icon: <TrendingUp />, color: "#D97706" },
    { title: "Drivers", value: stats.totalDrivers, icon: <LocalShipping />, color: "#21865D" },
    { title: "Products", value: stats.totalProducts, icon: <Inventory />, color: "#F36A21" },
    { title: "Today’s Orders", value: stats.todayOrders, icon: <TrendingUp />, color: "#F36A21" },
    { title: "Station Order Value", value: "UGX " + Number(stats.totalOrderValue || 0).toLocaleString(), icon: <Assessment />, color: "#21865D" },
    { title: "COD Outstanding", value: "UGX " + Number(stats.outstandingCash || 0).toLocaleString(), icon: <Assessment />, color: "#D97706" },
    { title: "Collected Today", value: "UGX " + Number(stats.todayRevenue || 0).toLocaleString(), icon: <Assessment />, color: "#21865D" },
  ];

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Dashboard</Typography>
        {user?.station?.name && (
          <Chip label={user.station.name} color="primary" variant="outlined" />
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {cards.map((card) => (
            <Grid item xs={12} sm={6} md={3} key={card.title}>
              <Paper sx={{ p: 3, display: "flex", alignItems: "center", gap: 2, borderLeft: `4px solid ${card.color}` }}>
                <Box sx={{ color: card.color }}>{card.icon}</Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">{card.title}</Typography>
                  <Typography variant="h5" fontWeight={700}>{card.value}</Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
        <Paper sx={{ mt: 4, p: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Recent Station Orders</Typography>
          {stats.recentOrders.map((order: any) => (
            <Box key={order.id} sx={{ p: 2, mb: 1, bgcolor: "background.default", borderRadius: 1, display: "flex", justifyContent: "space-between", gap: 2 }}>
              <Box>
                <Typography fontWeight={600}>Order #{order.id?.slice(0, 8)}</Typography>
                <Typography variant="body2" color="text.secondary">{order.user?.name || "Customer"} • {order.status}</Typography>
              </Box>
              <Typography fontWeight={700}>UGX {Number(order.totalAmount || 0).toLocaleString()}</Typography>
            </Box>
          ))}
          {stats.recentOrders.length === 0 && <Typography color="text.secondary" align="center" sx={{ py: 3 }}>No station orders yet</Typography>}
        </Paper>
      )}
    </Box>
  );
}