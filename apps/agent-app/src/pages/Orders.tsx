import React, { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip,
  CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, FormControl, Grid, InputLabel, MenuItem, Paper, Select,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography,
} from "@mui/material";
import ExpandMore from "@mui/icons-material/ExpandMore";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import Refresh from "@mui/icons-material/Refresh";

const API_URL = import.meta.env.VITE_API_URL || "/api";

interface OrderItem {
  id?: string;
  productId?: string;
  quantity: number;
  price?: number | string;
  subtotal?: number | string;
  product?: {
    name?: string;
    description?: string | null;
    type?: string;
    size?: string | null;
    weight?: number | string | null;
    imageUrl?: string | null;
  };
}
interface Order {
  id: string;
  status: string;
  totalAmount: number | string;
  deliveryAddress?: string | null;
  deliveryCity?: string | null;
  deliveryLatitude?: number | string | null;
  deliveryLongitude?: number | string | null;
  locationAccuracy?: number | string | null;
  paymentMethod?: string;
  paymentStatus?: string;
  notes?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt?: string;
  user?: { id?: string; name?: string; phone?: string; email?: string; address?: string; city?: string };
  station?: { id?: string; name?: string; phone?: string; address?: string };
  items?: OrderItem[];
  deliveries?: Array<{
    driverName?: string;
    driverPhone?: string;
    vehicleNumber?: string | null;
    status?: string;
    pickedUpAt?: string | null;
    startedAt?: string | null;
    deliveredAt?: string | null;
    notes?: string | null;
  }>;
}
interface Driver {
  id: string;
  name: string;
  phone: string;
  driverStatus: string;
}

const money = (value: number | string | null | undefined) =>
  "UGX " + Number(value || 0).toLocaleString("en-UG");
const dateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString("en-UG") : "—";
const statusColor = (status: string): any => ({
  pending: "warning", confirmed: "info", driver_assigned: "primary",
  picked_up: "secondary", in_transit: "info", nearby: "info",
  delivered: "success", completed: "success", cancelled: "error",
  failed: "error", refunded: "default",
}[status] || "default");

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(API_URL + "/agent/orders");
      const body = response.data;
      const rows = body?.data ?? body?.orders ?? [];
      setOrders(Array.isArray(rows) ? rows : []);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Unable to load station orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDrivers = useCallback(async () => {
    try {
      const response = await api.get(API_URL + "/agent/drivers");
      const rows = response.data?.data ?? response.data?.drivers ?? [];
      setDrivers(Array.isArray(rows) ? rows.filter((d: Driver) => d.driverStatus === "online") : []);
    } catch {
      setDrivers([]);
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
    void fetchDrivers();
  }, [fetchOrders, fetchDrivers]);

  const handleAssign = async () => {
    if (!selectedOrder || !selectedDriver) return;
    setSaving(true);
    setError("");
    try {
      await api.post(API_URL + "/agent/orders/" + selectedOrder.id + "/assign", { driverId: selectedDriver });
      setAssignOpen(false);
      setSelectedDriver("");
      await fetchOrders();
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not assign the driver.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!window.confirm("Cancel this order? Cancellation is only allowed before driver assignment.")) return;
    setSaving(true);
    try {
      await api.post(API_URL + "/agent/orders/" + orderId + "/cancel", {});
      await fetchOrders();
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not cancel this order.");
    } finally {
      setSaving(false);
    }
  };

  const driverFor = (order: Order) => order.deliveries?.[0];
  const orderTotalQty = (order: Order) => (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const openDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  return (
    <Box sx={{ p: { xs: 1, md: 0 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "text.primary" }}>Orders</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>Review customer orders, products, payments and delivery details.</Typography>
        </Box>
        <Button variant="outlined" startIcon={<Refresh />} onClick={() => { void fetchOrders(); void fetchDrivers(); }} disabled={loading}>
          Refresh
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

      <TableContainer component={Paper} sx={{ bgcolor: "background.paper", color: "text.primary", border: "1px solid", borderColor: "divider", overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 1100 }}>
          <TableHead>
            <TableRow sx={{ "& th": { color: "text.primary", bgcolor: "action.hover", fontWeight: 800, borderBottom: "1px solid", borderColor: "divider", whiteSpace: "nowrap" } }}>
              <TableCell>Order ID / Date</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Products (Qty)</TableCell>
              <TableCell>Delivery address & city</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Driver</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} sx={{ py: 6, textAlign: "center", color: "#CBD5E1" }}><CircularProgress size={28} /></TableCell></TableRow>
            ) : orders.length === 0 ? (
              <TableRow><TableCell colSpan={9} sx={{ py: 5, textAlign: "center", color: "#94A3B8" }}>No orders found for this station.</TableCell></TableRow>
            ) : orders.map((order) => {
              const delivery = driverFor(order);
              const itemText = (order.items || []).map((item) =>
                (item.product?.name || "Product") + " × " + Number(item.quantity || 0)
              ).join(", ");
              return (
                <TableRow key={order.id} hover sx={{ "& td": { color: "text.primary", borderBottom: "1px solid", borderColor: "divider", verticalAlign: "top" } }}>
                  <TableCell>
                    <Typography sx={{ fontFamily: "monospace", fontWeight: 700 }}>#{order.id.slice(0, 8).toUpperCase()}</Typography>
                    <Typography variant="caption" sx={{ color: "#94A3B8" }}>{dateTime(order.createdAt)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={600}>{order.user?.name || "Unknown customer"}</Typography>
                    <Typography variant="caption" sx={{ color: "#94A3B8" }}>{order.user?.phone || "No phone"}{order.user?.email ? " · " + order.user.email : ""}</Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 170 }}>
                    {order.items?.length ? (
                      <Stack spacing={0.5}>
                        {order.items.map((item, index) => (
                          <Typography key={item.id || item.productId || index} variant="body2">
                            {item.product?.name || "Product"} × {Number(item.quantity || 0)}
                          </Typography>
                        ))}
                        <Typography variant="caption" sx={{ color: "#94A3B8" }}>Total quantity: {orderTotalQty(order)}</Typography>
                      </Stack>
                    ) : <Typography variant="caption" sx={{ color: "#F59E0B" }}>Item details unavailable</Typography>}
                  </TableCell>
                  <TableCell sx={{ minWidth: 180 }}>
                    <Typography variant="body2">{order.deliveryAddress || "Address not provided"}</Typography>
                    <Typography variant="caption" sx={{ color: "#94A3B8" }}>{order.deliveryCity || "City not provided"}</Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap", fontWeight: 700, color: "warning.main" }}>{money(order.totalAmount)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ textTransform: "capitalize" }}>{order.paymentMethod || "cash"}</Typography>
                    <Chip size="small" label={order.paymentStatus || "pending"} color={order.paymentStatus === "paid" ? "success" : "warning"} />
                  </TableCell>
                  <TableCell><Chip size="small" label={(order.status || "pending").replace(/_/g, " ")} color={statusColor(order.status)} sx={{ textTransform: "capitalize" }} /></TableCell>
                  <TableCell sx={{ minWidth: 150 }}>
                    <Typography variant="body2">{delivery?.driverName || "Not assigned"}</Typography>
                    <Typography variant="caption" sx={{ color: "#94A3B8" }}>{delivery?.driverPhone || "—"}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Button size="small" startIcon={<VisibilityOutlined />} onClick={() => openDetails(order)}>Details</Button>
                      {["pending", "confirmed"].includes(order.status) && (
                        <Button size="small" onClick={() => { setSelectedOrder(order); setAssignOpen(true); }}>Assign</Button>
                      )}
                      {["pending", "confirmed"].includes(order.status) && (
                        <Button size="small" color="error" disabled={saving} onClick={() => void handleCancel(order.id)}>Cancel</Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} fullWidth maxWidth="md" PaperProps={{ sx: { bgcolor: "background.paper", color: "text.primary", "& .MuiTypography-root": { color: "inherit" }, "& .MuiDialogTitle-root": { color: "text.primary", fontWeight: 700 }, "& .MuiButton-root": { color: "primary.main", fontWeight: 700 } } }}>
        <DialogTitle>Order details · #{selectedOrder?.id.slice(0, 8).toUpperCase()}</DialogTitle>
        <DialogContent dividers sx={{ borderColor: "divider" }}>
          {selectedOrder && (
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}><Typography color="text.secondary" variant="caption">Customer</Typography><Typography>{selectedOrder.user?.name || "Unknown"}</Typography><Typography>{selectedOrder.user?.phone || "No phone"}</Typography><Typography>{selectedOrder.user?.email || "No email"}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography color="text.secondary" variant="caption">Order</Typography><Typography>{dateTime(selectedOrder.createdAt)}</Typography><Typography>Status: {selectedOrder.status}</Typography><Typography>Payment: {selectedOrder.paymentMethod || "cash"} / {selectedOrder.paymentStatus || "pending"}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography color="text.secondary" variant="caption">Delivery destination</Typography><Typography>{selectedOrder.deliveryAddress || "—"}</Typography><Typography>{selectedOrder.deliveryCity || "—"}</Typography><Typography>GPS: {selectedOrder.deliveryLatitude ?? "—"}, {selectedOrder.deliveryLongitude ?? "—"}</Typography><Typography>GPS accuracy: {selectedOrder.locationAccuracy ?? "—"} m</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography color="text.secondary" variant="caption">Station & driver</Typography><Typography>{selectedOrder.station?.name || "Current station"}</Typography><Typography>{driverFor(selectedOrder)?.driverName || "Driver not assigned"}</Typography><Typography>{driverFor(selectedOrder)?.driverPhone || "—"}</Typography><Typography>Vehicle: {driverFor(selectedOrder)?.vehicleNumber || "—"}</Typography></Grid>
              </Grid>
              <Divider sx={{ borderColor: "divider" }} />
              <Typography variant="h6">Ordered products</Typography>
              {(selectedOrder.items || []).map((item, index) => (
                <Paper key={item.id || item.productId || index} sx={{ p: 2, bgcolor: "background.default", color: "text.primary" }} variant="outlined">
                  <Stack direction="row" justifyContent="space-between" gap={2}>
                    <Box>
                      <Typography fontWeight={700}>{item.product?.name || "Product"}</Typography>
                      <Typography variant="body2" color="text.secondary">{item.product?.type || "—"} · {item.product?.size || "—"} · {item.product?.weight ? item.product.weight + " kg" : "Weight not specified"}</Typography>
                      {item.product?.description && <Typography variant="body2" color="text.secondary">{item.product.description}</Typography>}
                      <Typography variant="body2">Quantity: {item.quantity}</Typography>
                    </Box>
                    <Box sx={{ textAlign: "right", minWidth: 125 }}>
                      <Typography variant="body2">Unit: {money(item.price)}</Typography>
                      <Typography fontWeight={700}>{money(item.subtotal)}</Typography>
                    </Box>
                  </Stack>
                </Paper>
              ))}
              <Stack direction="row" justifyContent="space-between"><Typography fontWeight={700}>Total payable</Typography><Typography fontWeight={800} color="primary.main">{money(selectedOrder.totalAmount)}</Typography></Stack>
              {selectedOrder.notes && <Alert severity="info">Customer notes: {selectedOrder.notes}</Alert>}
              {selectedOrder.cancellationReason && <Alert severity="warning">Cancellation reason: {selectedOrder.cancellationReason}</Alert>}
              {driverFor(selectedOrder) && <Accordion sx={{ bgcolor: "background.default", color: "text.primary" }}><AccordionSummary expandIcon={<ExpandMore color="action" />}>Delivery timeline</AccordionSummary><AccordionDetails><Typography>Picked up: {dateTime(driverFor(selectedOrder)?.pickedUpAt)}</Typography><Typography>Started: {dateTime(driverFor(selectedOrder)?.startedAt)}</Typography><Typography>Delivered: {dateTime(driverFor(selectedOrder)?.deliveredAt)}</Typography><Typography>Delivery notes: {driverFor(selectedOrder)?.notes || "—"}</Typography></AccordionDetails></Accordion>}
            </Stack>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setDetailsOpen(false)}>Close</Button></DialogActions>
      </Dialog>

      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} PaperProps={{ sx: { bgcolor: "background.paper", color: "text.primary", "& .MuiTypography-root": { color: "inherit" } } }}>
        <DialogTitle>Assign driver</DialogTitle>
        <DialogContent sx={{ minWidth: 320 }}>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel sx={{ color: "#CBD5E1" }}>Available driver</InputLabel>
            <Select value={selectedDriver} label="Available driver" onChange={(e) => setSelectedDriver(e.target.value)} sx={{ color: "#fff" }}>
              {drivers.length === 0 && <MenuItem value="" disabled>No online drivers available</MenuItem>}
              {drivers.map((driver) => <MenuItem key={driver.id} value={driver.id}>{driver.name} · {driver.phone}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignOpen(false)}>Close</Button>
          <Button onClick={() => void handleAssign()} disabled={!selectedDriver || saving} variant="contained">{saving ? "Assigning…" : "Assign driver"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
