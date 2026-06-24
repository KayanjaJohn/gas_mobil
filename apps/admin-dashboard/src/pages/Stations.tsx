import { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Box, Alert, CircularProgress, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Switch, Snackbar
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Station {
  id: string;
  name: string;
  address: string;
  latitude: number | string;
  longitude: number | string;
  phone?: string;
  email?: string;
  isActive: boolean;
}

export default function Stations() {
  const { token } = useAuth();
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  const [newStation, setNewStation] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    phone: '',
    email: ''
  });

  useEffect(() => { fetchStations(); }, []);

  const fetchStations = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/stations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStations(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch stations');
    } finally {
      setLoading(false);
    }
  };

  const createStation = async () => {
    if (!newStation.name || !newStation.address || !newStation.latitude || !newStation.longitude) {
      setSnackbar({ open: true, message: 'Please fill all fields', severity: 'error' });
      return;
    }
    try {
      await axios.post(`${API_URL}/admin/stations`, {
        ...newStation,
        latitude: Number(newStation.latitude),
        longitude: Number(newStation.longitude)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOpen(false);
      setNewStation({ name: '', address: '', latitude: '', longitude: '', phone: '', email: '' });
      setSnackbar({ open: true, message: 'Station created', severity: 'success' });
      fetchStations();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to create',
        severity: 'error'
      });
    }
  };

  const toggleActive = async (station: Station) => {
    try {
      await axios.put(`${API_URL}/admin/stations/${station.id}`, {
        isActive: !station.isActive
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchStations();
    } catch (err: any) {
      setSnackbar({ open: true, message: 'Update failed', severity: 'error' });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">Stations</Typography>
          <Typography variant="body2" color="textSecondary">
            Manage gas stations/depots
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Add Station
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
                <TableCell>Address</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Coordinates</TableCell>
                <TableCell>Active</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stations.map((station) => (
                <TableRow key={station.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {station.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{station.address}</TableCell>
                  <TableCell>{station.phone || '-'}</TableCell>
                  <TableCell>{station.email || '-'}</TableCell>
                  <TableCell>
                    {Number(station.latitude).toFixed(4)}, {Number(station.longitude).toFixed(4)}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={station.isActive}
                      onChange={() => toggleActive(station)}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {stations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">No stations found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Station</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Name"
              value={newStation.name}
              onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Address"
              value={newStation.address}
              onChange={(e) => setNewStation({ ...newStation, address: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Phone"
              value={newStation.phone}
              onChange={(e) => setNewStation({ ...newStation, phone: e.target.value })}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={newStation.email}
              onChange={(e) => setNewStation({ ...newStation, email: e.target.value })}
            />
            <TextField
              fullWidth
              label="Latitude"
              type="number"
              value={newStation.latitude}
              onChange={(e) => setNewStation({ ...newStation, latitude: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Longitude"
              type="number"
              value={newStation.longitude}
              onChange={(e) => setNewStation({ ...newStation, longitude: e.target.value })}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={createStation} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={handleCloseSnackbar}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}