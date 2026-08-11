import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Alert,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  deliveryAddress: string;
  paymentMethod: string;
  user?: { name: string; phone: string };
  station?: { name: string };
  deliveries?: Array<{
    driverName?: string;
    driverPhone?: string;
    status?: string;
  }>;
  createdAt: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  status: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Orders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchDrivers();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const ordersData = data.data || data.orders || [];
      if (res.ok) setOrders(ordersData);
      else setError(data.error || "Failed to fetch orders");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/drivers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const driversData = data.data || data.drivers || [];
      if (res.ok) setDrivers(driversData);
    } catch {
      console.error("Failed to fetch drivers");
    }
  };

  const handleAssign = async () => {
    if (!selectedOrder || !selectedDriver) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders/${selectedOrder.id}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ driverId: selectedDriver }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        setDialogOpen(false);
        fetchOrders();
      } else {
        setError(data.error || "Failed to assign driver");
      }
    } catch {
      setError("Network error");
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success || res.ok) fetchOrders();
      else setError(data.error || "Failed to cancel order");
    } catch {
      setError("Network error");
    }
  };

  const getDriverInfo = (order: Order) => {
    const delivery = order.deliveries?.[0];
    if (delivery?.driverName) {
      return `${delivery.driverName} (${delivery.driverPhone || "No phone"})`;
    }
    return "Not assigned";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "warning";
      case "confirmed": return "info";
      case "driver_assigned": return "primary";
      case "picked_up": return "secondary";
      case "in_transit": return "info";
      case "delivered": return "success";
      case "cancelled": return "error";
      default: return "default";
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>Orders</Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Station</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary" sx={{ py: 4 }}>
                      No orders found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>#{order.id.slice(0, 8)}</TableCell>
                    <TableCell>
                      {order.user?.name || "Unknown"}
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        {order.user?.phone || "No phone"}
                      </Typography>
                    </TableCell>
                    <TableCell>{order.station?.name || "-"}</TableCell>
                    <TableCell>UGX {order.totalAmount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip label={order.status} color={getStatusColor(order.status) as any} size="small" />
                    </TableCell>
                    <TableCell>{getDriverInfo(order)}</TableCell>
                    <TableCell>
                      {order.status === "pending" && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => { setSelectedOrder(order); setSelectedDriver(""); setDialogOpen(true); }}
                        >
                          Assign
                        </Button>
                      )}
                      {order.status !== "cancelled" && order.status !== "delivered" && (
                        <Button size="small" color="error" onClick={() => handleCancel(order.id)} sx={{ ml: 1 }}>
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} PaperProps={{ sx: { bgcolor: "#1E293B", color: "#fff" } }}>
        <DialogTitle>Assign Driver</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, minWidth: 300 }}>
            <InputLabel sx={{ color: "#94A3B8" }}>Select Driver</InputLabel>
            <Select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              label="Select Driver"
              sx={{ color: "#fff", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#475569" } }}
            >
              {drivers.map((driver) => (
                <MenuItem key={driver.id} value={driver.id}>
                  {driver.name} ({driver.phone}) — {driver.status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAssign} disabled={!selectedDriver}>
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}