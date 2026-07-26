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
      const res = await fetch(`${API_BASE_URL}/agent/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      // Handle both response shapes: { data: [] } and { orders: [] }
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
      const res = await fetch(`${API_BASE_URL}/agent/drivers`, {
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
      const res = await fetch(`${API_BASE_URL}/agent/orders/${selectedOrder.id}/assign`, {
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
      const res = await fetch(`${API_BASE_URL}/agent/orders/${orderId}/cancel`, {
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
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: "#fff" }}>
        Orders
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2, bgcolor: "rgba(239,68,68,0.1)", color: "#EF4444" }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "#F59E0B" }} />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ bgcolor: "#1E293B", border: "1px solid #334155" }}>
          <Table>
            <TableHead>
              <TableRow sx={{ "& th": { color: "#94A3B8", fontWeight: 600, borderBottom: "1px solid #334155" } }}>
                <TableCell>Order ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: "center", color: "#94A3B8", py: 4 }}>
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} sx={{ "& td": { color: "#E2E8F0", borderBottom: "1px solid #334155" } }}>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>
                      #{order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {order.user?.name || "Unknown"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#94A3B8" }}>
                        {order.user?.phone || "No phone"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#F59E0B" }}>
                      UGX {order.totalAmount?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.status.replace("_", " ")}
                        color={getStatusColor(order.status) as any}
                        size="small"
                        sx={{ textTransform: "capitalize", fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: order.deliveries?.[0]?.driverName ? "#22C55E" : "#94A3B8" }}>
                        {getDriverInfo(order)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        {order.status === "pending" && (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => { setSelectedOrder(order); setDialogOpen(true); }}
                            sx={{ bgcolor: "#F59E0B", color: "#fff", fontSize: 12 }}
                          >
                            Assign Driver
                          </Button>
                        )}
                        {order.status !== "cancelled" && order.status !== "delivered" && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleCancel(order.id)}
                            sx={{ fontSize: 12 }}
                          >
                            Cancel
                          </Button>
                        )}
                      </Box>
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
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel sx={{ color: "#94A3B8" }}>Select Driver</InputLabel>
            <Select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              sx={{ color: "#fff", ".MuiOutlinedInput-notchedOutline": { borderColor: "#334155" } }}
            >
              {drivers.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name} ({d.phone})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: "#94A3B8" }}>
            Cancel
          </Button>
          <Button onClick={handleAssign} variant="contained" sx={{ bgcolor: "#F59E0B", color: "#fff" }}>
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}