import { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Chip, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, FormControl, InputLabel, Select, MenuItem, Box,
  Alert, CircularProgress, Snackbar, TextField
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Order {
  id: string; status: string; totalAmount: number;
  deliveryAddress: string; paymentMethod: string; paymentStatus: string;
  createdAt: string; user?: { name: string; phone: string };
  driver?: { name: string }; driverId?: string; station?: { name: string };
}

interface Driver { id: string; name: string; driverStatus: string; }

export default function Orders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelDialog, setCancelDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => { fetchOrders(); fetchDrivers(); }, []);

  const fetchOrders = async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.get(`${API_URL}/admin/orders`, { headers: { Authorization: `Bearer ${token}` } });
      setOrders(res.data.data || []);
    } catch (err: any) { setError(err.response?.data?.error || 'Failed to fetch orders'); }
    finally { setLoading(false); }
  };

  const fetchDrivers = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/drivers`, { headers: { Authorization: `Bearer ${token}` } });
      setDrivers(res.data.data || []);
    } catch (err) { console.error('Failed to fetch drivers:', err); }
  };

  const assignDriver = async () => {
    if (!selectedOrder || !selectedDriver) return;
    try {
      await axios.post(`${API_URL}/admin/orders/${selectedOrder.id}/assign`, { driverId: selectedDriver },
        { headers: { Authorization: `Bearer ${token}` } });
      setSelectedOrder(null); setSelectedDriver('');
      setSnackbar({ open: true, message: 'Driver assigned successfully', severity: 'success' });
      fetchOrders();
    } catch (err: any) { setSnackbar({ open: true, message: err.response?.data?.error || 'Assignment failed', severity: 'error' }); }
  };

  const cancelOrder = async () => {
    if (!selectedOrder || !cancelReason) return;
    try {
      await axios.post(`${API_URL}/admin/orders/${selectedOrder.id}/cancel`, { reason: cancelReason },
        { headers: { Authorization: `Bearer ${token}` } });
      setCancelDialog(false); setSelectedOrder(null); setCancelReason('');
      setSnackbar({ open: true, message: 'Order cancelled', severity: 'success' });
      fetchOrders();
    } catch (err: any) { setSnackbar({ open: true, message: err.response?.data?.error || 'Cancellation failed', severity: 'error' }); }
  };

  const getStatusColor = (status: string): any => {
    const colors: Record<string, any> = {
      pending: 'warning', confirmed: 'info', driver_assigned: 'primary',
      picked_up: 'secondary', in_transit: 'info', delivered: 'success',
      completed: 'success', cancelled: 'error', failed: 'error', refunded: 'default'
    };
    return colors[status] || 'default';
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>All Orders</Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        Manage orders across all stations
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell><TableCell>Customer</TableCell><TableCell>Station</TableCell>
                <TableCell>Amount</TableCell><TableCell>Status</TableCell><TableCell>Driver</TableCell><TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>#{order.id.slice(0, 8)}</TableCell>
                  <TableCell>{order.user?.name || 'N/A'}<br/><Typography variant="caption" color="textSecondary">{order.user?.phone}</Typography></TableCell>
                  <TableCell>{order.station?.name || 'N/A'}</TableCell>
                  <TableCell>UGX {Number(order.totalAmount).toLocaleString()}</TableCell>
                  <TableCell><Chip label={order.status.replace('_', ' ')} color={getStatusColor(order.status)} size="small"/></TableCell>
                  <TableCell>{order.driver?.name || 'Not assigned'}</TableCell>
                  <TableCell>
                    {!order.driverId && order.status === 'pending' && (
                      <Button variant="contained" size="small" onClick={() => setSelectedOrder(order)}>Assign</Button>
                    )}
                    {order.status === 'pending' && (
                      <Button variant="outlined" size="small" color="error" sx={{ ml: 1 }} onClick={() => { setSelectedOrder(order); setCancelDialog(true); }}>Cancel</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">No orders found</Typography>
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Assign Driver Dialog */}
      <Dialog open={!!selectedOrder && !cancelDialog} onClose={() => setSelectedOrder(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Driver</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Driver</InputLabel>
            <Select value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)} label="Select Driver">
              {drivers.filter(d => d.driverStatus === 'online').map((driver) => (
                <MenuItem key={driver.id} value={driver.id}>{driver.name} ({driver.driverStatus})</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedOrder(null)}>Cancel</Button>
          <Button onClick={assignDriver} variant="contained" disabled={!selectedDriver}>Assign</Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Order</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Reason for cancellation" multiline rows={2}
            value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog(false)}>Cancel</Button>
          <Button onClick={cancelOrder} variant="contained" color="error" disabled={!cancelReason}>Confirm Cancel</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
