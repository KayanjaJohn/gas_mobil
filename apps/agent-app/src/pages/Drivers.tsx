import { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Typography, Chip, Box
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
  lastLocationUpdate?: string;
  vehicleNumber?: string;
  vehicleType?: string;
}

export default function Drivers() {
  const { token } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/drivers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDrivers(res.data.data || []);
    } catch (error) {
      console.error('Fetch drivers error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      online: 'success',
      offline: 'default',
      busy: 'warning',
      on_break: 'info',
    };
    return colors[status] || 'default';
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Drivers</Typography>

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
                    <Typography variant="body2" fontWeight="medium">{driver.name}</Typography>
                    <Typography variant="caption" color="textSecondary">{driver.email}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{driver.phone}</TableCell>
                <TableCell>
                  {driver.vehicleNumber ? (
                    <Box>
                      <Typography variant="body2">{driver.vehicleNumber}</Typography>
                      <Typography variant="caption" color="textSecondary">{driver.vehicleType}</Typography>
                    </Box>
                  ) : (
                    'N/A'
                  )}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={driver.driverStatus} 
                    color={getStatusColor(driver.driverStatus)} 
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {driver.currentLatitude ? (
                    <Box>
                      <Typography variant="body2">
                        {driver.currentLatitude.toFixed(4)}, {driver.currentLongitude?.toFixed(4)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {driver.lastLocationUpdate ? new Date(driver.lastLocationUpdate).toLocaleTimeString() : 'Unknown'}
                      </Typography>
                    </Box>
                  ) : (
                    'Unknown'
                  )}
                </TableCell>
              </TableRow>
            ))}
            {drivers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">No drivers found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
