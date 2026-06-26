import { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Switch, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Grid, Box, Alert, Snackbar, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, IconButton
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Product {
  id: string; name: string; description: string; price: number;
  stock: number; type: string; isAvailable: boolean; stationId?: string;
  weight?: string; brand?: string;
  station?: { name: string };
}

interface Station { id: string; name: string; address: string; }

export default function Products() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', type: 'cylinder', stationId: '', weight: '', brand: '' });

  useEffect(() => { fetchProducts(); fetchStations(); }, []);

  const fetchProducts = async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.get(`${API_URL}/products`, { headers: { Authorization: `Bearer ${token}` } });
      setProducts(res.data.data || []);
    } catch (err: any) { setError(err.response?.data?.error || 'Failed to fetch products'); }
    finally { setLoading(false); }
  };

  const fetchStations = async () => {
    try {
      const res = await axios.get(`${API_URL}/stations`, { headers: { Authorization: `Bearer ${token}` } });
      setStations(res.data.data || []);
    } catch (err) { console.error('Failed to fetch stations:', err); }
  };

  const toggleAvailability = async (id: string, current: boolean) => {
    try {
      await axios.patch(`${API_URL}/products/${id}/availability`, { isAvailable: !current },
        { headers: { Authorization: `Bearer ${token}` } });
      setSnackbar({ open: true, message: 'Availability updated', severity: 'success' });
      fetchProducts();
    } catch (err: any) { setSnackbar({ open: true, message: err.response?.data?.error || 'Update failed', severity: 'error' }); }
  };

  const saveProduct = async () => {
    if (!form.name || !form.price || !form.stock || !form.stationId) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' }); return;
    }
    try {
      const data = { ...form, price: Number(form.price), stock: Number(form.stock) };
      if (editing) {
        await axios.put(`${API_URL}/products/${editing.id}`, data, { headers: { Authorization: `Bearer ${token}` } });
        setSnackbar({ open: true, message: 'Product updated', severity: 'success' });
      } else {
        await axios.post(`${API_URL}/products`, data, { headers: { Authorization: `Bearer ${token}` } });
        setSnackbar({ open: true, message: 'Product created', severity: 'success' });
      }
      setOpen(false); setEditing(null); setForm({ name: '', description: '', price: '', stock: '', type: 'cylinder', stationId: '', weight: '', brand: '' });
      fetchProducts();
    } catch (err: any) { setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to save', severity: 'error' }); }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await axios.delete(`${API_URL}/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setSnackbar({ open: true, message: 'Product deleted', severity: 'success' });
      fetchProducts();
    } catch (err: any) { setSnackbar({ open: true, message: err.response?.data?.error || 'Delete failed', severity: 'error' }); }
  };

  const startEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name, description: product.description || '', price: String(product.price),
      stock: String(product.stock), type: product.type, stationId: product.stationId || '',
      weight: product.weight || '', brand: product.brand || ''
    });
    setOpen(true);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">Products</Typography>
          <Typography variant="body2" color="textSecondary">Manage products across all stations</Typography>
        </Box>
        <Button variant="contained" onClick={() => { setEditing(null); setForm({ name: '', description: '', price: '', stock: '', type: 'cylinder', stationId: '', weight: '', brand: '' }); setOpen(true); }}>
          Add Product
        </Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell><TableCell>Price</TableCell><TableCell>Stock</TableCell>
                <TableCell>Type</TableCell><TableCell>Station</TableCell><TableCell>Available</TableCell><TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">{product.name}</Typography>
                      <Typography variant="caption" color="textSecondary">{product.description}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>UGX {Number(product.price).toLocaleString()}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{product.type}</TableCell>
                  <TableCell>{product.station?.name || product.stationId || 'N/A'}</TableCell>
                  <TableCell><Switch checked={product.isAvailable} onChange={() => toggleAvailability(product.id, product.isAvailable)} /></TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => startEdit(product)}><Edit /></IconButton>
                    <IconButton size="small" color="error" onClick={() => deleteProduct(product.id)}><Delete /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">No products found</Typography>
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}><TextField fullWidth label="Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Description" multiline rows={2} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Price" type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Stock" type="number" value={form.stock} onChange={(e) => setForm({...form, stock: e.target.value})} required /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>Type</InputLabel>
                <Select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} label="Type">
                  <MenuItem value="cylinder">Cylinder</MenuItem><MenuItem value="accessory">Accessory</MenuItem><MenuItem value="refill">Refill</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}><TextField fullWidth label="Weight (e.g. 6kg)" value={form.weight} onChange={(e) => setForm({...form, weight: e.target.value})} /></Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required><InputLabel>Station</InputLabel>
                <Select value={form.stationId} onChange={(e) => setForm({...form, stationId: e.target.value})} label="Station">
                  {stations.map((s) => (<MenuItem key={s.id} value={s.id}>{s.name} - {s.address}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={saveProduct} variant="contained">{editing ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
