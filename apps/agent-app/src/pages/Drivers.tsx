import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Chip, Box, Alert, CircularProgress } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Driver { id: string; name: string; email: string; phone: string; driverStatus: string; currentLatitude?: number; currentLongitude?: number; vehicleNumber?: string; vehicleType?: string; stationId: string; }

export default function Drivers() {
  const { token, user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchDrivers(); }, []);

  const fetchDrivers = async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.get(`${API_URL}/admin/drivers`, { headers: { Authorization: `Bearer ${token}` } });
      const stationDrivers = (res.data.data || []).filter((d: Driver) => d.stationId === user?.stationId);
      setDrivers(stationDrivers);
    } catch (err: any) { setError(err.response?.data?.error || 'Failed to fetch drivers'); }
    finally { setLoading(false); }
  };

  const getStatusColor = (status: string): any => {
    const colors: Record<string, any> = { online: 'success', offline: 'default', busy: 'warning', on_break: 'info' };
    return colors[status] || 'default';
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Station Drivers</Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom>Drivers at {user?.station?.name}</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow><TableCell>Name</TableCell><TableCell>Phone</TableCell><TableCell>Vehicle</TableCell><TableCell>Status</TableCell><TableCell>Location</TableCell></TableRow>
            </TableHead>
            <TableBody>
              {drivers.map((driver) => (
                <TableRow key={driver.id} hover>
                  <TableCell><Box><Typography variant="body2" fontWeight="medium">{driver.name}</Typography><Typography variant="caption" color="textSecondary">{driver.email}</Typography></Box></TableCell>
                  <TableCell>{driver.phone}</TableCell>
                  <TableCell>{driver.vehicleNumber || 'N/A'}<br/><Typography variant="caption" color="textSecondary">{driver.vehicleType}</Typography></TableCell>
                  <TableCell><Chip label={driver.driverStatus} color={getStatusColor(driver.driverStatus)} size="small"/></TableCell>
                  <TableCell>{driver.currentLatitude ? `${driver.currentLatitude.toFixed(4)}, ${driver.currentLongitude?.toFixed(4)}` : 'Unknown'}</TableCell>
                </TableRow>
              ))}
              {drivers.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><Typography color="textSecondary">No drivers at this station</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
