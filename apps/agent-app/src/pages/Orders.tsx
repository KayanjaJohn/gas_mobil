import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Box, Alert, CircularProgress, Snackbar } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Order { id: string; status: string; totalAmount: number; deliveryAddress: string; user?: { name: string }; driver?: { name: string }; driverId?: string; stationId: string; }
interface Driver { id: string; name: string; driverStatus: string; stationId: string; }

export default function Orders() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => { fetchOrders(); fetchDrivers(); }, []);

  const fetchOrders = async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.get(`${API_URL}/agent/orders`, { headers: { Authorization: `Bearer ${token}` } });
      setOrders(res.data.data || []);
    } catch (err: any) { setError(err.response?.data?.error || 'Failed to fetch orders'); }
    finally { setLoading(false); }
  };

  const fetchDrivers = async () => {
    try {
      const res = await axios.get(`${API_URL}/agent/drivers`, { headers: { Authorization: `Bearer ${token}` } });
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

  const getStatusColor = (status: string): any => {
    const colors: Record<string, any> = { pending: 'warning', confirmed: 'info', driver_assigned: 'primary', picked_up: 'secondary', in_transit: 'info', delivered: 'success', completed: 'success', cancelled: 'error' };
    return colors[status] || 'default';
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Station Orders</Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom>Orders for {user?.station?.name}</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow><TableCell>Order ID</TableCell><TableCell>Customer</TableCell><TableCell>Amount</TableCell><TableCell>Status</TableCell><TableCell>Driver</TableCell><TableCell>Actions</TableCell></TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>#{order.id.slice(0, 8)}</TableCell>
                  <TableCell>{order.user?.name || 'N/A'}</TableCell>
                  <TableCell>UGX {Number(order.totalAmount).toLocaleString()}</TableCell>
                  <TableCell><Chip label={order.status.replace('_', ' ')} color={getStatusColor(order.status)} size="small"/></TableCell>
                  <TableCell>{order.driver?.name || 'Not assigned'}</TableCell>
                  <TableCell>
                    {!order.driverId && order.status === 'pending' && (
                      <Button variant="contained" size="small" onClick={() => setSelectedOrder(order)}>Assign</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><Typography color="textSecondary">No orders for this station</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={!!selectedOrder} onClose={() => setSelectedOrder(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Driver</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Driver</InputLabel>
            <Select value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)} label="Select Driver">
              {drivers.filter(d => d.driverStatus === 'online').map((driver) => (
                <MenuItem key={driver.id} value={driver.id}>{driver.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedOrder(null)}>Cancel</Button>
          <Button onClick={assignDriver} variant="contained" disabled={!selectedDriver}>Assign</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}