import React, { useState, useEffect } from 'react';
import api from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || '/api';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, TextField, InputAdornment, CircularProgress,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  address?: string | null;
  city?: string | null;
  createdAt: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(customers.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    ));
  }, [search, customers]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${API_URL}/agent/customers`);
      const data = response.data;
      setCustomers(data.data || []);
      setFiltered(data.data || []);
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
        Customers
      </Typography>

      <TextField
        placeholder="Search customers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        sx={{ mb: 3, '& .MuiOutlinedInput-root': { bgcolor: '#1E293B', borderRadius: 2, color: '#fff' } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'text.secondary' }} />
            </InputAdornment>
          ),
        }}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: 'warning.main' }} />
        </Box>
      ) : error ? (
        <Typography color="error" sx={{ textAlign: 'center', py: 4 }}>{error}</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ bgcolor: 'background.paper', color: 'text.primary', border: '1px solid', borderColor: 'divider', overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 1100 }}>
            <TableHead>
              <TableRow sx={{ '& th': { color: 'text.primary', bgcolor: 'action.hover', fontWeight: 800, borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' } }}>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>City</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Joined</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', color: '#94A3B8', py: 4 }}>
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow key={c.id} sx={{ '& td': { color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider', verticalAlign: 'top' } }}>
                    <TableCell sx={{ fontWeight: 500 }}>{c.name}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>{c.phone || '-'}</TableCell>
                    <TableCell>{c.address || 'Not provided'}</TableCell>
                    <TableCell>{c.city || 'Not provided'}</TableCell>
                    <TableCell>
                      <Chip label={c.role} size="small" sx={{ bgcolor: 'rgba(245,158,11,0.15)', color: '#F59E0B', fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
