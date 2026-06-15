import { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Typography, Chip
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Drivers() {
  const { token } = useAuth();
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    const res = await axios.get(`${API_URL}/admin/drivers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setDrivers(res.data.data);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      online: 'success',
      offline: 'default',
      busy: 'warning',
      on_break: 'info',
    };
    return colors[status] || 'default';
  };

  return (
    <>
      <Typography variant="h4" gutterBottom>Drivers</Typography>
      <TableContainer component={Paper}>
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
            {drivers.map((driver: any) => (
              <TableRow key={driver.id}>
                <TableCell>{driver.name}</TableCell>
                <TableCell>{driver.phone}</TableCell>
                <TableCell>{driver.vehicleNumber || 'N/A'}</TableCell>
                <TableCell>
                  <Chip label={driver.driverStatus} color={getStatusColor(driver.driverStatus) as any} size="small" />
                </TableCell>
                <TableCell>
                  {driver.currentLatitude
                    ? `${driver.currentLatitude.toFixed(4)}, ${driver.currentLongitude.toFixed(4)}`
                    : 'Unknown'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}