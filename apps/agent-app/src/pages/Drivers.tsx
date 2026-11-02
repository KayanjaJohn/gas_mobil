import { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Chip, Box, Alert, CircularProgress, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Snackbar, FormControl, MenuItem, Select
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '/api';

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

function formatCoordinates(
  latitude: unknown,
  longitude: unknown
): string {
  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined ||
    latitude === "" ||
    longitude === ""
  ) {
    return "Unknown";
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 || lat > 90 ||
    lng < -180 || lng > 180
  ) {
    return "Unknown";
  }

  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export default function Drivers() {
  const { token, user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [updatingDriverId, setUpdatingDriverId] = useState<string | null>(null);
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

  const updateDriverStatus = async (driver: Driver, status: "online" | "offline") => {
    if (driver.driverStatus === "busy" || driver.driverStatus === "on_break") {
      setSnackbar({
        open: true,
        message: `${driver.name} is currently ${driver.driverStatus.replace("_", " ")}. Their status cannot be overridden.`,
        severity: "error"
      });
      return;
    }

    setUpdatingDriverId(driver.id);
    try {
      const response = await axios.put(`${API_URL}/agent/drivers/${driver.id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDrivers((current) => current.map((item) =>
        item.id === driver.id ? { ...item, driverStatus: response.data?.data?.driverStatus || status } : item
      ));
      setSnackbar({
        open: true,
        message: response.data?.message || `${driver.name} is now ${status}.`,
        severity: "success"
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || "Could not update driver availability.",
        severity: "error"
      });
    } finally {
      setUpdatingDriverId(null);
    }
  };

  const createDriver = async () => {
    if (!form.name || !form.email || !form.phone || !form.password) {
      setSnackbar({
        open: true,
        message: 'Please fill name, email, phone and a unique driver password',
        severity: 'error'
      });
      return;
    }
    try {
      await axios.post(`${API_URL}/agent/drivers`, {
        ...form
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
                    {driver.driverStatus === "busy" || driver.driverStatus === "on_break" ? (
                      <Chip
                        label={driver.driverStatus.replace("_", " ")}
                        color={getStatusColor(driver.driverStatus)}
                        size="small"
                      />
                    ) : (
                      <FormControl size="small" sx={{ minWidth: 128 }}>
                        <Select
                          value={driver.driverStatus === "online" ? "online" : "offline"}
                          disabled={updatingDriverId === driver.id}
                          onChange={(event) => void updateDriverStatus(driver, event.target.value as "online" | "offline")}
                          sx={{ borderRadius: 2, fontSize: 13 }}
                          inputProps={{ "aria-label": `Availability for ${driver.name}` }}
                        >
                          <MenuItem value="online">Online · Available</MenuItem>
                          <MenuItem value="offline">Offline</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                    {updatingDriverId === driver.id && <CircularProgress size={14} sx={{ ml: 1 }} />}
                  </TableCell>
                  <TableCell>
                    {formatCoordinates(
                      driver.currentLatitude,
                      driver.currentLongitude
                    )}
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
              label="Driver password"
              type="password"
              value={form.password}
              required
              inputProps={{ minLength: 8 }}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              helperText="Set a unique password (at least 8 characters). Share it securely with the driver."
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