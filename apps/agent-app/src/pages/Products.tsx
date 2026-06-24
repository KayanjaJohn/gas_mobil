import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Switch, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Box, Alert, Snackbar, CircularProgress } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Product { id: string; name: string; description: string; price: number; stock: number; type: string; isAvailable: boolean; stationId?: string; }

export default function Products() {
  const { token, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', type: 'cylinder', weight: '', brand: '' });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.get(`${API_URL}/products?stationId=${user?.stationId}`, { headers: { Authorization: `Bearer ${token}` } });
      setProducts(res.data.data || []);
    } catch (err: any) { setError(err.response?.data?.error || 'Failed to fetch products'); }
    finally { setLoading(false); }
  };

  const toggleAvailability = async (id: string, current: boolean) => {
    try {
      await axios.patch(`${API_URL}/products/${id}/availability`, { isAvailable: !current }, { headers: { Authorization: `Bearer ${token}` } });
      setSnackbar({ open: true, message: 'Availability updated', severity: 'success' }); fetchProducts();
    } catch (err: any) { setSnackbar({ open: true, message: err.response?.data?.error || 'Update failed', severity: 'error' }); }
  };

  const createProduct = async () => {
    if (!form.name || !form.price || !form.stock) { setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' }); return; }
    try {
      await axios.post(`${API_URL}/products`, {
        ...form, price: Number(form.price), stock: Number(form.stock), stationId: user?.stationId
      }, { headers: { Authorization: `Bearer ${token}` } });
      setOpen(false); setForm({ name: '', description: '', price: '', stock: '', type: 'cylinder', weight: '', brand: '' });
      setSnackbar({ open: true, message: 'Product created', severity: 'success' }); fetchProducts();
    } catch (err: any) { setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to create', severity: 'error' }); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">Station Products</Typography>
          <Typography variant="body2" color="textSecondary">Products for {user?.station?.name}</Typography>
        </Box>
        <Button variant="contained" onClick={() => setOpen(true)}>Add Product</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow><TableCell>Name</TableCell><TableCell>Price</TableCell><TableCell>Stock</TableCell><TableCell>Type</TableCell><TableCell>Available</TableCell></TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} hover>
                  <TableCell><Box><Typography variant="body2" fontWeight="medium">{product.name}</Typography><Typography variant="caption" color="textSecondary">{product.description}</Typography></Box></TableCell>
                  <TableCell>UGX {Number(product.price).toLocaleString()}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{product.type}</TableCell>
                  <TableCell><Switch checked={product.isAvailable} onChange={() => toggleAvailability(product.id, product.isAvailable)} /></TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><Typography color="textSecondary">No products at this station</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Product</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}><TextField fullWidth label="Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Description" multiline rows={2} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Price" type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Stock" type="number" value={form.stock} onChange={(e) => setForm({...form, stock: e.target.value})} required /></Grid>
            <Grid item xs={6}><TextField fullWidth select label="Type" value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} SelectProps={{ native: true }}><option value="cylinder">Cylinder</option><option value="accessory">Accessory</option><option value="refill">Refill</option></TextField></Grid>
            <Grid item xs={6}><TextField fullWidth label="Weight (e.g. 6kg)" value={form.weight} onChange={(e) => setForm({...form, weight: e.target.value})} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button onClick={createProduct} variant="contained">Create</Button></DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
