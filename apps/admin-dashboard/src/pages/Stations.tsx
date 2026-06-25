import { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Box, Alert, CircularProgress, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Switch, Snackbar, IconButton, Chip, Grid, Divider
} from '@mui/material';
import { Edit, Delete, ContentCopy, PersonAdd } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

interface Station {
  id: string;
  name: string;
  address: string;
  latitude: number | string;
  longitude: number | string;
  phone?: string;
  email?: string;
  isActive: boolean;
  agents: Agent[];
}

export default function Stations() {
  const { token } = useAuth();
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [addAgentDialogOpen, setAddAgentDialogOpen] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
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
    agentPassword: ''
  });

  const [agentForm, setAgentForm] = useState({
    name: '',
    password: '',
    isActive: true
  });

  const [newAgentForm, setNewAgentForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
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
      agentPassword: ''
    });
    setOpen(true);
  };

  const openEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setAgentForm({
      name: agent.name,
      password: '',
      isActive: agent.isActive
    });
    setAgentDialogOpen(true);
  };

  const openAddAgent = (stationId: string) => {
    setSelectedStationId(stationId);
    setNewAgentForm({ name: '', email: '', phone: '', password: '' });
    setAddAgentDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.address || !form.latitude || !form.longitude || !form.email) {
      setSnackbar({ open: true, message: 'Name, address, coordinates, and station email are required', severity: 'error' });
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

  const handleAgentUpdate = async () => {
    if (!editingAgent) return;
    
    try {
      const payload: any = {
        name: agentForm.name,
        isActive: agentForm.isActive
      };
      
      if (agentForm.password) {
        payload.password = agentForm.password;
      }

      await axios.put(`${API_URL}/admin/agents/${editingAgent.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAgentDialogOpen(false);
      setEditingAgent(null);
      setAgentForm({ name: '', password: '', isActive: true });
      setSnackbar({ open: true, message: 'Agent updated successfully', severity: 'success' });
      fetchStations();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to update agent',
        severity: 'error'
      });
    }
  };

  const handleAddAgent = async () => {
    if (!selectedStationId || !newAgentForm.email) {
      setSnackbar({ open: true, message: 'Email is required', severity: 'error' });
      return;
    }

    try {
      await axios.post(`${API_URL}/admin/stations/${selectedStationId}/agents`, {
        name: newAgentForm.name,
        email: newAgentForm.email,
        phone: newAgentForm.phone,
        password: newAgentForm.password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAddAgentDialogOpen(false);
      setSelectedStationId(null);
      setNewAgentForm({ name: '', email: '', phone: '', password: '' });
      setSnackbar({ open: true, message: 'New agent added to station', severity: 'success' });
      fetchStations();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to add agent',
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSnackbar({ open: true, message: 'Copied to clipboard', severity: 'success' });
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
                <TableCell>Station Agents</TableCell>
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
                    {station.phone && <Typography variant="body2">{station.phone}</Typography>}
                    {station.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="caption" color="textSecondary">{station.email}</Typography>
                        <IconButton size="small" onClick={() => copyToClipboard(station.email!)}>
                          <ContentCopy sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    {Number(station.latitude).toFixed(4)},{' '}
                    {Number(station.longitude).toFixed(4)}
                  </TableCell>
                  <TableCell>
                    {station.agents && station.agents.length > 0 ? (
                      <Box>
                        {station.agents.map((agent) => (
                          <Box key={agent.id} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" fontWeight="medium">
                                {agent.name}
                              </Typography>
                              <Button 
                                size="small" 
                                startIcon={<Edit />}
                                onClick={() => openEditAgent(agent)}
                                sx={{ minWidth: 0, p: 0.5 }}
                              >
                                Edit
                              </Button>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="caption" color="textSecondary">
                                {agent.email}
                              </Typography>
                              <IconButton size="small" onClick={() => copyToClipboard(agent.email)}>
                                <ContentCopy sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Box>
                            <Typography variant="caption" color="textSecondary" display="block">
                              Phone: {agent.phone || 'N/A'}
                            </Typography>
                            <Chip
                              label={agent.isActive ? 'Active' : 'Inactive'}
                              size="small"
                              color={agent.isActive ? 'success' : 'default'}
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        ))}
                        <Button
                          size="small"
                          startIcon={<PersonAdd />}
                          onClick={() => openAddAgent(station.id)}
                          sx={{ mt: 1 }}
                        >
                          Add Another Agent
                        </Button>
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="caption" color="error" display="block">
                          No agent assigned
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<PersonAdd />}
                          onClick={() => openAddAgent(station.id)}
                          sx={{ mt: 0.5 }}
                        >
                          Add Agent
                        </Button>
                      </Box>
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

      {/* Station Dialog */}
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
                label="Station Email *"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                helperText="This email is used for the first agent login"
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
                    First Agent Details
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    This agent will login using the station email above
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

      {/* Edit Agent Dialog */}
      <Dialog open={agentDialogOpen} onClose={() => setAgentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Agent</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Agent Name"
                value={agentForm.name}
                onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={agentForm.password}
                onChange={(e) => setAgentForm({ ...agentForm, password: e.target.value })}
                helperText="Leave blank to keep current password"
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Switch
                  checked={agentForm.isActive}
                  onChange={(e) => setAgentForm({ ...agentForm, isActive: e.target.checked })}
                />
                <Typography>Agent Active</Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAgentDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAgentUpdate} variant="contained">
            Update Agent
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add New Agent Dialog */}
      <Dialog open={addAgentDialogOpen} onClose={() => setAddAgentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Agent to Station</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Agent Name"
                value={newAgentForm.name}
                onChange={(e) => setNewAgentForm({ ...newAgentForm, name: e.target.value })}
                placeholder="Auto-generated if empty"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email *"
                type="email"
                value={newAgentForm.email}
                onChange={(e) => setNewAgentForm({ ...newAgentForm, email: e.target.value })}
                required
                helperText="This email will be used for login"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                value={newAgentForm.phone}
                onChange={(e) => setNewAgentForm({ ...newAgentForm, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={newAgentForm.password}
                onChange={(e) => setNewAgentForm({ ...newAgentForm, password: e.target.value })}
                helperText="Default: Agent@123"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddAgentDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddAgent} variant="contained">
            Add Agent
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