import { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Box, Alert, CircularProgress, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Switch, Snackbar, IconButton, Chip, Grid
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
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
  agents?: { id: string; name: string; email: string }[];
}

export default function Stations() {
  const { token } = useAuth();
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  const [form, setForm] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    phone: '',
    email: '',
    agentName: '',
    agentEmail: '',
    agentPhone: '',
    agentPassword: ''
  });

  useEffect(() => { fetchStations(); }, []);

  const fetchStations = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/admin/stations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStations(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch stations');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingStation(null);
    setForm({
      name: '',
      address: '',
      latitude: '',
      longitude: '',
      phone: '',
      email: '',
      agentName: '',
      agentEmail: '',
      agentPhone: '',
      agentPassword: ''
    });
    setOpen(true);
  };

  const openEdit = (station: Station) => {
    setEditingStation(station);
    setForm({
      name: station.name,
      address: station.address,
      latitude: String(station.latitude),
      longitude: String(station.longitude),
      phone: station.phone || '',
      email: station.email || '',
      agentName: '',
      agentEmail: '',
      agentPhone: '',
      agentPassword: ''
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.address || !form.latitude || !form.longitude) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' });
      return;
    }

    const payload = {
      ...form,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude)
    };

    try {
      if (editingStation) {
        await axios.put(`${API_URL}/admin/stations/${editingStation.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSnackbar({ open: true, message: 'Station updated', severity: 'success' });
      } else {
        if (!form.agentEmail) {
          setSnackbar({ open: true, message: 'Agent email is required', severity: 'error' });
          return;
        }
        await axios.post(`${API_URL}/admin/stations`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSnackbar({ open: true, message: 'Station and agent created', severity: 'success' });
      }
      setOpen(false);
      fetchStations();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to save',
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
      setSnackbar({
        open: true,
        message: `Station ${station.isActive ? 'deactivated' : 'activated'}`,
        severity: 'success'
      });
      fetchStations();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Update failed',
        severity: 'error'
      });
    }
  };

  const deleteStation = async (id: string) => {
    if (!confirm('Are you sure? This will deactivate the station and its agents.')) return;
    try {
      await axios.delete(`${API_URL}/admin/stations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSnackbar({ open: true, message: 'Station deactivated', severity: 'success' });
      fetchStations();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Delete failed',
        severity: 'error'
      });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">Stations</Typography>
          <Typography variant="body2" color="textSecondary">
            Manage gas stations and their agents
          </Typography>
        </Box>
        <Button variant="contained" onClick={openCreate}>
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
                <TableCell>Contact</TableCell>
                <TableCell>Coordinates</TableCell>
                <TableCell>Agent</TableCell>
                <TableCell>Active</TableCell>
                <TableCell>Actions</TableCell>
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
                  <TableCell>
                    {station.phone && <div>{station.phone}</div>}
                    {station.email && <div>{station.email}</div>}
                  </TableCell>
                  <TableCell>
                    {Number(station.latitude).toFixed(4)},{' '}
                    {Number(station.longitude).toFixed(4)}
                  </TableCell>
                  <TableCell>
                    {station.agents && station.agents.length > 0 ? (
                      station.agents.map((agent) => (
                        <Chip
                          key={agent.id}
                          label={agent.name}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ mr: 0.5 }}
                        />
                      ))
                    ) : (
                      <Typography variant="caption" color="error">
                        No agent
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={station.isActive}
                      onChange={() => toggleActive(station)}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" color="primary" onClick={() => openEdit(station)}>
                      <Edit />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => deleteStation(station.id)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {stations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">No stations found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingStation ? 'Edit Station' : 'Add New Station'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Station Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Latitude"
                type="number"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Longitude"
                type="number"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                required
              />
            </Grid>

            {!editingStation && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="primary" sx={{ mt: 2 }}>
                    Station Agent Details
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Agent Name"
                    value={form.agentName}
                    onChange={(e) => setForm({ ...form, agentName: e.target.value })}
                    placeholder="Auto-generated if empty"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Agent Email *"
                    type="email"
                    value={form.agentEmail}
                    onChange={(e) => setForm({ ...form, agentEmail: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Agent Phone"
                    value={form.agentPhone}
                    onChange={(e) => setForm({ ...form, agentPhone: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Agent Password"
                    type="password"
                    value={form.agentPassword}
                    onChange={(e) => setForm({ ...form, agentPassword: e.target.value })}
                    helperText="Default: Agent@123"
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingStation ? 'Update' : 'Create'}
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