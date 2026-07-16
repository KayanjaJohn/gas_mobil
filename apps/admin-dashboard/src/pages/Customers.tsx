import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box, Alert, CircularProgress } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Customer {
  id: string; name: string; email: string; phone: string;
  address?: string; city?: string; createdAt: string;
}

export default function Customers() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.get(`${API_URL}/admin/customers`, { headers: { Authorization: `Bearer ${token}` } });
      setCustomers(res.data.data || []);
    } catch (err: any) { setError(err.response?.data?.error || 'Failed to fetch customers'); }
    finally { setLoading(false); }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Customers</Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom>All registered customers</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell><TableCell>Email</TableCell><TableCell>Phone</TableCell>
                <TableCell>Address</TableCell><TableCell>City</TableCell><TableCell>Joined</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id} hover>
                  <TableCell><Typography variant="body2" fontWeight="medium">{customer.name}</Typography></TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.address || 'N/A'}</TableCell>
                  <TableCell>{customer.city || 'N/A'}</TableCell>
                  <TableCell>{new Date(customer.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {customers.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">No customers found</Typography>
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
