import { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Switch, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Grid, Box, Alert, Snackbar, CircularProgress,
  IconButton, Tabs, Tab, Card as MuiCard, CardContent, Chip, Divider,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { Edit, Delete, Add, Inventory } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import ImageUpload from '../components/ImageUpload';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  type: string;
  isAvailable: boolean;
  stationId?: string;
  imageUrl?: string;
}

interface CatalogItem {
  id: string;
  name: string;
  description: string | null;
  defaultPrice: number;
  defaultWeight: number | null;
  defaultSize: string | null;
  category: 'cylinder' | 'accessory';
  imageUrl: string | null;
}

export default function Products() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', type: 'cylinder', weight: '', size: '', imageUrl: '' });
  const [catalogForm, setCatalogForm] = useState({ selectedCatalogId: '', price: '', stock: '', imageUrl: '' });
  const [catalogDialogOpen, setCatalogDialogOpen] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCatalog();
    const socket = io(SOCKET_URL, { transports: ['polling', 'websocket'] });
    socket.on('product_created', () => fetchProducts());
    socket.on('product_updated', () => fetchProducts());
    socket.on('product_deleted', () => fetchProducts());
    return () => { socket.disconnect(); };
  }, []);

  const fetchProducts = async () => {
    setProductsLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/agent/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch products');
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchCatalog = async () => {
    setCatalogLoading(true);
    try {
      const res = await axios.get(`${API_URL}/catalog`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCatalog(res.data.data || []);
    } catch (err: any) {
      console.error('Catalog fetch error:', err);
    } finally {
      setCatalogLoading(false);
    }
  };

  const toggleAvailability = async (id: string, current: boolean) => {
    try {
      await axios.patch(`${API_URL}/products/${id}/availability`, { isAvailable: !current }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSnackbar({ open: true, message: 'Availability updated', severity: 'success' });
      fetchProducts();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Update failed', severity: 'error' });
    }
  };

  const openCreate = () => {
    setEditingProduct(null);
    setForm({ name: '', description: '', price: '', stock: '', type: 'cylinder', weight: '', size: '', imageUrl: '' });
    setOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name, description: product.description || '',
      price: String(product.price), stock: String(product.stock),
      type: product.type, weight: '', size: '', imageUrl: product.imageUrl || '',
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.stock) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' });
      return;
    }
    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      weight: form.weight ? Number(form.weight) : undefined,
      size: form.size || undefined,
      stationId: user?.stationId,
    };
    try {
      if (editingProduct) {
        await axios.put(`${API_URL}/products/${editingProduct.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSnackbar({ open: true, message: 'Product updated', severity: 'success' });
      } else {
        await axios.post(`${API_URL}/products`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSnackbar({ open: true, message: 'Product created', severity: 'success' });
      }
      setOpen(false);
      setForm({ name: '', description: '', price: '', stock: '', type: 'cylinder', weight: '', size: '', imageUrl: '' });
      fetchProducts();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to save', severity: 'error' });
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await axios.delete(`${API_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSnackbar({ open: true, message: 'Product deleted', severity: 'success' });
      fetchProducts();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Delete failed', severity: 'error' });
    }
  };

  const openCatalogAdd = (item: CatalogItem) => {
    setSelectedCatalogItem(item);
    setCatalogForm({
      selectedCatalogId: item.id,
      price: String(item.defaultPrice),
      stock: '',
      imageUrl: item.imageUrl || '',
    });
    setCatalogDialogOpen(true);
  };

  const handleCatalogAddToStock = async () => {
    if (!catalogForm.stock || Number(catalogForm.stock) < 0) {
      setSnackbar({ open: true, message: 'Please enter a valid stock quantity', severity: 'error' });
      return;
    }
    try {
      await axios.post(
        `${API_URL}/catalog/${selectedCatalogItem?.id}/add-to-station`,
        {
          stationId: user?.stationId,
          price: catalogForm.price ? Number(catalogForm.price) : undefined,
          stock: Number(catalogForm.stock),
          imageUrl: catalogForm.imageUrl,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbar({ open: true, message: 'Product added to station stock!', severity: 'success' });
      setCatalogDialogOpen(false);
      fetchProducts();
      setActiveTab(0);
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to add product', severity: 'error' });
    }
  };

  const cylinders = catalog.filter((c) => c.category === 'cylinder');
  const accessories = catalog.filter((c) => c.category === 'accessory');

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Station Products</Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Products for {user?.station?.name || 'your station'}
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
        <Tab label="My Products" />
        <Tab label="Product Catalog" />
      </Tabs>

      {activeTab === 0 && (
        <>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ mb: 2 }}>
            Add Product
          </Button>
          {productsLoading ? (
            <CircularProgress />
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Stock</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Available</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        {product.imageUrl && (
                          <img src={product.imageUrl} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', marginRight: 8 }} />
                        )}
                        {product.name}
                      </TableCell>
                      <TableCell>UGX {Number(product.price).toLocaleString()}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>{product.type}</TableCell>
                      <TableCell>
                        <Switch
                          checked={product.isAvailable}
                          onChange={() => toggleAvailability(product.id, product.isAvailable)}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => openEdit(product)}><Edit /></IconButton>
                        <IconButton onClick={() => deleteProduct(product.id)} color="error"><Delete /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {products.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No products found. Add products from the catalog or create custom ones.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {activeTab === 1 && (
        <>
          {catalogLoading ? (
            <CircularProgress />
          ) : (
            <Grid container spacing={2}>
              {cylinders.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>🔥 Gas Cylinders</Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
              )}
              {cylinders.map((item) => (
                <Grid item xs={12} md={6} lg={4} key={item.id}>
                  <MuiCard>
                    <CardContent>
                      <Typography variant="h6">{item.name}</Typography>
                      <Typography color="text.secondary" sx={{ mb: 1 }}>
                        {item.description || 'No description'}
                      </Typography>
                      <Chip label={`UGX ${Number(item.defaultPrice).toLocaleString()}`} color="primary" size="small" sx={{ mr: 1 }} />
                      {item.defaultSize && <Chip label={item.defaultSize} size="small" sx={{ mr: 1 }} />}
                      {item.defaultWeight && <Chip label={`${item.defaultWeight}kg`} size="small" />}
                      <Box sx={{ mt: 2 }}>
                        <Button size="small" variant="outlined" startIcon={<Inventory />} onClick={() => openCatalogAdd(item)}>
                          Add to My Stock
                        </Button>
                      </Box>
                    </CardContent>
                  </MuiCard>
                </Grid>
              ))}
              {accessories.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>🔧 Accessories</Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
              )}
              {accessories.map((item) => (
                <Grid item xs={12} md={6} lg={4} key={item.id}>
                  <MuiCard>
                    <CardContent>
                      <Typography variant="h6">{item.name}</Typography>
                      <Typography color="text.secondary" sx={{ mb: 1 }}>
                        {item.description || 'No description'}
                      </Typography>
                      <Chip label={`UGX ${Number(item.defaultPrice).toLocaleString()}`} color="primary" size="small" />
                      <Box sx={{ mt: 2 }}>
                        <Button size="small" variant="outlined" startIcon={<Inventory />} onClick={() => openCatalogAdd(item)}>
                          Add to My Stock
                        </Button>
                      </Box>
                    </CardContent>
                  </MuiCard>
                </Grid>
              ))}
              {catalog.length === 0 && (
                <Grid item xs={12}>
                  <Alert severity="info">No catalog items available. Contact admin to add products to the catalog.</Alert>
                </Grid>
              )}
            </Grid>
          )}
        </>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <ImageUpload
                value={form.imageUrl}
                onChange={(url) => setForm({ ...form, imageUrl: url })}
                token={token}
              />
            </Grid>
            <Grid item xs={12}><TextField label="Name" fullWidth value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required /></Grid>
            <Grid item xs={12}><TextField label="Description" fullWidth value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} /></Grid>
            <Grid item xs={6}><TextField label="Price (UGX)" fullWidth type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} required /></Grid>
            <Grid item xs={6}><TextField label="Stock" fullWidth type="number" value={form.stock} onChange={(e) => setForm({...form, stock: e.target.value})} required /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>Type</InputLabel><Select value={form.type} label="Type" onChange={(e) => setForm({...form, type: e.target.value})}><MenuItem value="cylinder">Cylinder</MenuItem><MenuItem value="accessory">Accessory</MenuItem></Select></FormControl>
            </Grid>
            <Grid item xs={6}><TextField label="Size (e.g. 6kg, 12kg)" fullWidth value={form.size} onChange={(e) => setForm({...form, size: e.target.value})} /></Grid>
            <Grid item xs={6}><TextField label="Weight (kg)" fullWidth type="number" value={form.weight} onChange={(e) => setForm({...form, weight: e.target.value})} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingProduct ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={catalogDialogOpen} onClose={() => setCatalogDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add "{selectedCatalogItem?.name}" to Stock</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <ImageUpload
                value={catalogForm.imageUrl}
                onChange={(url) => setCatalogForm({ ...catalogForm, imageUrl: url })}
                label="Override Image (optional)"
                token={token}
              />
            </Grid>
            <Grid item xs={12}><TextField label="Price Override (UGX)" fullWidth type="number" value={catalogForm.price} onChange={(e) => setCatalogForm({...catalogForm, price: e.target.value})} helperText={`Default: UGX ${Number(selectedCatalogItem?.defaultPrice || 0).toLocaleString()}`} /></Grid>
            <Grid item xs={12}><TextField label="Stock Quantity" fullWidth type="number" value={catalogForm.stock} onChange={(e) => setCatalogForm({...catalogForm, stock: e.target.value})} required /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCatalogDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCatalogAddToStock}>Add to Stock</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
