import { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Chip, Box, Alert, CircularProgress, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Snackbar
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  driverStatus: string;
  currentLatitude?: number;
  currentLongitude?: number;
  vehicleNumber?: string;
  vehicleType?: string;
  stationId: string;
}

export default function Drivers() {
  const { token, user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    vehicleNumber: '',
    vehicleType: ''
  });

  useEffect(() => { fetchDrivers(); }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/agent/drivers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDrivers(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch drivers');
    } finally {
      setLoading(false);
    }
  };

  const createDriver = async () => {
    if (!form.name || !form.email || !form.phone) {
      setSnackbar({
        open: true,
        message: 'Please fill name, email and phone',
        severity: 'error'
      });
      return;
    }
    try {
      await axios.post(`${API_URL}/agent/drivers`, {
        ...form,
        password: form.password || 'Driver@123'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOpen(false);
      setForm({ name: '', email: '', phone: '', password: '', vehicleNumber: '', vehicleType: '' });
      setSnackbar({
        open: true,
        message: 'Driver created successfully',
        severity: 'success'
      });
      fetchDrivers();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to create driver',
        severity: 'error'
      });
    }
  };

  const getStatusColor = (status: string): any => {
    const colors: Record<string, any> = {
      online: 'success',
      offline: 'default',
      busy: 'warning',
      on_break: 'info'
    };
    return colors[status] || 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>Station Drivers</Typography>
          <Typography variant="body2" color="textSecondary">
            Drivers at {user?.station?.name}
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Add Driver
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Vehicle</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Location</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {drivers.map((driver) => (
                <TableRow key={driver.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {driver.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {driver.email}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{driver.phone}</TableCell>
                  <TableCell>
                    {driver.vehicleNumber || 'N/A'}
                    <br />
                    <Typography variant="caption" color="textSecondary">
                      {driver.vehicleType}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={driver.driverStatus}
                      color={getStatusColor(driver.driverStatus)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {driver.currentLatitude
                      ? `${driver.currentLatitude.toFixed(4)}, ${driver.currentLongitude?.toFixed(4)}`
                      : 'Unknown'}
                  </TableCell>
                </TableRow>
              ))}
              {drivers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      No drivers at this station
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Driver</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              helperText="Default: Driver@123"
            />
            <TextField
              fullWidth
              label="Vehicle Number"
              value={form.vehicleNumber}
              onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
            />
            <TextField
              fullWidth
              label="Vehicle Type"
              value={form.vehicleType}
              onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
              helperText="e.g. Motorcycle, Truck"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={createDriver} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}