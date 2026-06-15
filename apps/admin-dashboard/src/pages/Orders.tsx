import { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Typography, Chip, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControl,
  InputLabel, Select, MenuItem
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Orders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedDriver, setSelectedDriver] = useState('');

  useEffect(() => {
    fetchOrders();
    fetchDrivers();
  }, []);

  const fetchOrders = async () => {
    const res = await axios.get(`${API_URL}/admin/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setOrders(res.data.data);
  };

  const fetchDrivers = async () => {
    const res = await axios.get(`${API_URL}/admin/drivers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setDrivers(res.data.data);
  };

  const assignDriver = async () => {
    await axios.post(`${API_URL}/admin/orders/${selectedOrder.id}/assign`, {
      driverId: selectedDriver
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setSelectedOrder(null);
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'warning',
      confirmed: 'info',
      driver_assigned: 'primary',
      picked_up: 'secondary',
      in_transit: 'info',
      delivered: 'success',
      completed: 'success',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  return (
    <>
      <Typography variant="h4" gutterBottom>Orders</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Driver</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order: any) => (
              <TableRow key={order.id}>
                <TableCell>{order.id.slice(0, 8)}...</TableCell>
                <TableCell>{order.user?.name || 'N/A'}</TableCell>
                <TableCell>UGX {Number(order.totalAmount).toLocaleString()}</TableCell>
                <TableCell>
                  <Chip label={order.status.replace('_', ' ')} color={getStatusColor(order.status) as any} size="small" />
                </TableCell>
                <TableCell>{order.driver?.name || 'Not assigned'}</TableCell>
                <TableCell>
                  {!order.driverId && (
                    <Button size="small" variant="outlined" onClick={() => setSelectedOrder(order)}>
                      Assign Driver
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!selectedOrder} onClose={() => setSelectedOrder(null)}>
        <DialogTitle>Assign Driver</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Driver</InputLabel>
            <Select value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)}>
              {drivers.map((driver: any) => (
                <MenuItem key={driver.id} value={driver.id}>
                  {driver.name} - {driver.vehicleNumber}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedOrder(null)}>Cancel</Button>
          <Button onClick={assignDriver} variant="contained" disabled={!selectedDriver}>
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}