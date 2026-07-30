import React, { useState, useEffect } from 'react';
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
  createdAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const token = localStorage.getItem('agent_token');

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
      const res = await fetch(`${API_BASE_URL}/agent/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data || []);
        setFiltered(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch customers');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: '#fff' }}>
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
              <SearchIcon sx={{ color: '#94A3B8' }} />
            </InputAdornment>
          ),
        }}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#F59E0B' }} />
        </Box>
      ) : error ? (
        <Typography color="error" sx={{ textAlign: 'center', py: 4 }}>{error}</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ bgcolor: '#1E293B', border: '1px solid #334155' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { color: '#94A3B8', fontWeight: 600, borderBottom: '1px solid #334155' } }}>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Joined</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', color: '#94A3B8', py: 4 }}>
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow key={c.id} sx={{ '& td': { color: '#E2E8F0', borderBottom: '1px solid #334155' } }}>
                    <TableCell sx={{ fontWeight: 500 }}>{c.name}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>{c.phone || '-'}</TableCell>
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
