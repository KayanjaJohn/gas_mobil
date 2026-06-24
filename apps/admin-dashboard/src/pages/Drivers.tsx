import { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Chip, Box, Alert, CircularProgress, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Grid
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Driver {
  id: string; name: string; email: string; phone: string;
  driverStatus: 'online' | 'offline' | 'busy' | 'on_break';
  currentLatitude?: number; currentLongitude?: number;
  lastLocationUpdate?: string; vehicleNumber?: string; vehicleType?: string;
  station?: { name: string };
}

interface Station { id: string; name: string; }

export default function Drivers() {
  const { token } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [newDriver, setNewDriver] = useState({ name: '', email: '', phone: '', password: '', stationId: '', vehicleNumber: '', vehicleType: '' });

  useEffect(() => { fetchDrivers(); fetchStations(); }, []);

  const fetchDrivers = async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.get(`${API_URL}/admin/drivers`, { headers: { Authorization: `Bearer ${token}` } });
      setDrivers(res.data.data || []);
    } catch (err: any) { setError(err.response?.data?.error || 'Failed to fetch drivers'); }
    finally { setLoading(false); }
  };

  const fetchStations = async () => {
    try {
      const res = await axios.get(`${API_URL}/stations`, { headers: { Authorization: `Bearer ${token}` } });
      setStations(res.data.data || []);
    } catch (err) { console.error('Failed to fetch stations:', err); }
  };

  const createDriver = async () => {
    if (!newDriver.name || !newDriver.email || !newDriver.phone || !newDriver.password || !newDriver.stationId) {
      alert('Please fill all required fields'); return;
    }
    try {
      await axios.post(`${API_URL}/admin/drivers`, newDriver, { headers: { Authorization: `Bearer ${token}` } });
      setOpen(false); setNewDriver({ name: '', email: '', phone: '', password: '', stationId: '', vehicleNumber: '', vehicleType: '' });
      fetchDrivers();
    } catch (err: any) { alert(err.response?.data?.error || 'Failed to create driver'); }
  };

  const getStatusColor = (status: string): any => {
    const colors: Record<string, any> = { online: 'success', offline: 'default', busy: 'warning', on_break: 'info' };
    return colors[status] || 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">Drivers</Typography>
          <Typography variant="body2" color="textSecondary">Manage all delivery drivers</Typography>
        </Box>
        <Button variant="contained" onClick={() => setOpen(true)}>Add Driver</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell><TableCell>Phone</TableCell><TableCell>Vehicle</TableCell>
                <TableCell>Station</TableCell><TableCell>Status</TableCell><TableCell>Location</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {drivers.map((driver) => (
                <TableRow key={driver.id} hover>
                  <TableCell>
                    <Box><Typography variant="body2" fontWeight="medium">{driver.name}</Typography>
                    <Typography variant="caption" color="textSecondary">{driver.email}</Typography></Box>
                  </TableCell>
                  <TableCell>{driver.phone}</TableCell>
                  <TableCell>{driver.vehicleNumber || 'N/A'}<br/><Typography variant="caption" color="textSecondary">{driver.vehicleType}</Typography></TableCell>
                  <TableCell>{driver.station?.name || 'N/A'}</TableCell>
                  <TableCell><Chip label={driver.driverStatus} color={getStatusColor(driver.driverStatus)} size="small"/></TableCell>
                  <TableCell>{driver.currentLatitude ? `${driver.currentLatitude.toFixed(4)}, ${driver.currentLongitude?.toFixed(4)}` : 'Unknown'}</TableCell>
                </TableRow>
              ))}
              {drivers.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">No drivers found</Typography>
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Driver</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}><TextField fullWidth label="Name" value={newDriver.name} onChange={(e) => setNewDriver({...newDriver, name: e.target.value})} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Email" type="email" value={newDriver.email} onChange={(e) => setNewDriver({...newDriver, email: e.target.value})} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Phone" value={newDriver.phone} onChange={(e) => setNewDriver({...newDriver, phone: e.target.value})} required /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Password" type="password" value={newDriver.password} onChange={(e) => setNewDriver({...newDriver, password: e.target.value})} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Vehicle Number" value={newDriver.vehicleNumber} onChange={(e) => setNewDriver({...newDriver, vehicleNumber: e.target.value})} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Vehicle Type" value={newDriver.vehicleType} onChange={(e) => setNewDriver({...newDriver, vehicleType: e.target.value})} /></Grid>
            <Grid item xs={12}>
              <TextField fullWidth select label="Station" value={newDriver.stationId} onChange={(e) => setNewDriver({...newDriver, stationId: e.target.value})} required
                SelectProps={{ native: true }}>
                <option value="">Select Station</option>
                {stations.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={createDriver} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
