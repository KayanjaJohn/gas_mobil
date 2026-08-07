import { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Switch, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Grid, Box, Alert, Snackbar, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, IconButton, Tabs, Tab,
  Chip, Card as MuiCard, CardContent,
} from '@mui/material';
import { Delete, Edit, Add, Inventory } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ImageUpload from '../components/ImageUpload';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Product {
  id: string; name: string; description: string; price: number;
  stock: number; type: string; isAvailable: boolean; stationId?: string;
  weight?: string; size?: string; imageUrl?: string;
  station?: { name: string };
}

interface CatalogItem {
  id: string; name: string; description: string | null;
  defaultPrice: number; defaultWeight: number | null;
  defaultSize: string | null; category: 'cylinder' | 'accessory';
  imageUrl: string | null; isActive: boolean;
}

interface Station { id: string; name: string; address: string; }

export default function Products() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', type: 'cylinder', stationId: '', weight: '', size: '', imageUrl: '' });
  const [catalogForm, setCatalogForm] = useState({ name: '', description: '', defaultPrice: '', defaultWeight: '', defaultSize: '', category: 'cylinder', imageUrl: '' });
  const [addToStationOpen, setAddToStationOpen] = useState(false);
  const [selectedCatalog, setSelectedCatalog] = useState<CatalogItem | null>(null);
  const [stationForm, setStationForm] = useState({ stationId: '', price: '', stock: '', imageUrl: '' });

  useEffect(() => { fetchProducts(); fetchCatalog(); fetchStations(); }, []);

  const fetchProducts = async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.get(`${API_URL}/products`, { headers: { Authorization: `Bearer ${token}` } });
      setProducts(res.data.data || []);
    } catch (err: any) { setError(err.response?.data?.error || 'Failed to fetch products'); }
    finally { setLoading(false); }
  };

  const fetchCatalog = async () => {
    setCatalogLoading(true);
    try {
      const res = await axios.get(`${API_URL}/catalog`, { headers: { Authorization: `Bearer ${token}` } });
      setCatalog(res.data.data || []);
    } catch (err: any) { console.error('Catalog fetch error:', err); }
    finally { setCatalogLoading(false); }
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
      const data = { ...form, price: Number(form.price), stock: Number(form.stock), weight: form.weight || undefined, size: form.size || undefined };
      if (editing) {
        await axios.put(`${API_URL}/products/${editing.id}`, data, { headers: { Authorization: `Bearer ${token}` } });
        setSnackbar({ open: true, message: 'Product updated', severity: 'success' });
      } else {
        await axios.post(`${API_URL}/products`, data, { headers: { Authorization: `Bearer ${token}` } });
        setSnackbar({ open: true, message: 'Product created', severity: 'success' });
      }
      setOpen(false); setEditing(null); setForm({ name: '', description: '', price: '', stock: '', type: 'cylinder', stationId: '', weight: '', size: '', imageUrl: '' });
      fetchProducts();
    } catch (err: any) { setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to save', severity: 'error' }); }
  };

  const saveCatalogItem = async () => {
    if (!catalogForm.name || !catalogForm.defaultPrice) {
      setSnackbar({ open: true, message: 'Name and price are required', severity: 'error' }); return;
    }
    try {
      await axios.post(`${API_URL}/catalog`, {
        ...catalogForm,
        defaultPrice: Number(catalogForm.defaultPrice),
        defaultWeight: catalogForm.defaultWeight ? Number(catalogForm.defaultWeight) : undefined,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSnackbar({ open: true, message: 'Catalog item created', severity: 'success' });
      setCatalogOpen(false);
      setCatalogForm({ name: '', description: '', defaultPrice: '', defaultWeight: '', defaultSize: '', category: 'cylinder', imageUrl: '' });
      fetchCatalog();
    } catch (err: any) { setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to save', severity: 'error' }); }
  };

  const addCatalogToStation = async () => {
    if (!stationForm.stationId || !stationForm.stock) {
      setSnackbar({ open: true, message: 'Station and stock are required', severity: 'error' }); return;
    }
    try {
      await axios.post(`${API_URL}/catalog/${selectedCatalog?.id}/add-to-station`, {
        stationId: stationForm.stationId,
        price: stationForm.price ? Number(stationForm.price) : undefined,
        stock: Number(stationForm.stock),
        imageUrl: stationForm.imageUrl || undefined,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSnackbar({ open: true, message: 'Added to station stock!', severity: 'success' });
      setAddToStationOpen(false);
      setStationForm({ stationId: '', price: '', stock: '', imageUrl: '' });
      fetchProducts();
    } catch (err: any) { setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to add', severity: 'error' }); }
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
      weight: product.weight || '', size: product.size || '', imageUrl: product.imageUrl || ''
    });
    setOpen(true);
  };

  const cylinders = catalog.filter((c) => c.category === 'cylinder');
  const accessories = catalog.filter((c) => c.category === 'accessory');

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Products & Catalog</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
        <Tab label="All Station Products" />
        <Tab label="Global Catalog" />
      </Tabs>

      {activeTab === 0 && (
        <>
          <Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setForm({ name: '', description: '', price: '', stock: '', type: 'cylinder', stationId: '', weight: '', size: '', imageUrl: '' }); setOpen(true); }} sx={{ mb: 2 }}>
            Add Product
          </Button>
          {loading ? <CircularProgress /> : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead><TableRow>
                  <TableCell>Image</TableCell><TableCell>Name</TableCell><TableCell>Price</TableCell>
                  <TableCell>Stock</TableCell><TableCell>Type</TableCell><TableCell>Station</TableCell>
                  <TableCell>Available</TableCell><TableCell>Actions</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.imageUrl ? <img src={product.imageUrl} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} /> : '—'}</TableCell>
                      <TableCell>{product.name}{product.size ? <Chip size="small" label={product.size} sx={{ ml: 1 }} /> : null}</TableCell>
                      <TableCell>UGX {Number(product.price).toLocaleString()}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>{product.type}</TableCell>
                      <TableCell>{product.station?.name || product.stationId || 'N/A'}</TableCell>
                      <TableCell><Switch checked={product.isAvailable} onChange={() => toggleAvailability(product.id, product.isAvailable)} /></TableCell>
                      <TableCell>
                        <IconButton onClick={() => startEdit(product)}><Edit /></IconButton>
                        <IconButton onClick={() => deleteProduct(product.id)} color="error"><Delete /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {products.length === 0 && <TableRow><TableCell colSpan={8} align="center">No products found</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {activeTab === 1 && (
        <>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCatalogOpen(true)} sx={{ mb: 2 }}>
            Add Catalog Template
          </Button>
          {catalogLoading ? <CircularProgress /> : (
            <Grid container spacing={2}>
              {cylinders.length > 0 && <Grid item xs={12}><Typography variant="h6">🔥 Gas Cylinders</Typography></Grid>}
              {cylinders.map((item) => (
                <Grid item xs={12} md={6} lg={4} key={item.id}>
                  <MuiCard>
                    <CardContent>
                      <Typography variant="h6">{item.name}</Typography>
                      <Typography color="text.secondary" sx={{ mb: 1 }}>{item.description || 'No description'}</Typography>
                      <Chip label={`UGX ${Number(item.defaultPrice).toLocaleString()}`} color="primary" size="small" sx={{ mr: 1 }} />
                      {item.defaultSize && <Chip label={item.defaultSize} size="small" sx={{ mr: 1 }} />}
                      {item.defaultWeight && <Chip label={`${item.defaultWeight}kg`} size="small" />}
                      <Box sx={{ mt: 2 }}>
                        <Button size="small" variant="outlined" startIcon={<Inventory />} onClick={() => { setSelectedCatalog(item); setStationForm({ stationId: '', price: String(item.defaultPrice), stock: '', imageUrl: item.imageUrl || '' }); setAddToStationOpen(true); }}>
                          Add to Station
                        </Button>
                      </Box>
                    </CardContent>
                  </MuiCard>
                </Grid>
              ))}
              {accessories.length > 0 && <Grid item xs={12}><Typography variant="h6">🔧 Accessories</Typography></Grid>}
              {accessories.map((item) => (
                <Grid item xs={12} md={6} lg={4} key={item.id}>
                  <MuiCard>
                    <CardContent>
                      <Typography variant="h6">{item.name}</Typography>
                      <Typography color="text.secondary" sx={{ mb: 1 }}>{item.description || 'No description'}</Typography>
                      <Chip label={`UGX ${Number(item.defaultPrice).toLocaleString()}`} color="primary" size="small" />
                      <Box sx={{ mt: 2 }}>
                        <Button size="small" variant="outlined" startIcon={<Inventory />} onClick={() => { setSelectedCatalog(item); setStationForm({ stationId: '', price: String(item.defaultPrice), stock: '', imageUrl: item.imageUrl || '' }); setAddToStationOpen(true); }}>
                          Add to Station
                        </Button>
                      </Box>
                    </CardContent>
                  </MuiCard>
                </Grid>
              ))}
              {catalog.length === 0 && <Grid item xs={12}><Alert severity="info">No catalog items yet. Run the seed script to populate templates.</Alert></Grid>}
            </Grid>
          )}
        </>
      )}

      {/* Product Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
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
            <Grid item xs={6}><TextField label="Size" fullWidth value={form.size} onChange={(e) => setForm({...form, size: e.target.value})} /></Grid>
            <Grid item xs={6}><TextField label="Weight (kg)" fullWidth type="number" value={form.weight} onChange={(e) => setForm({...form, weight: e.target.value})} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>Station</InputLabel><Select value={form.stationId} label="Station" onChange={(e) => setForm({...form, stationId: e.target.value})} required>{stations.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}</Select></FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={saveProduct}>{editing ? 'Update' : 'Create'}</Button></DialogActions>
      </Dialog>

      {/* Catalog Dialog */}
      <Dialog open={catalogOpen} onClose={() => setCatalogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Catalog Template</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <ImageUpload
                value={catalogForm.imageUrl}
                onChange={(url) => setCatalogForm({ ...catalogForm, imageUrl: url })}
                token={token}
              />
            </Grid>
            <Grid item xs={12}><TextField label="Name" fullWidth value={catalogForm.name} onChange={(e) => setCatalogForm({...catalogForm, name: e.target.value})} required /></Grid>
            <Grid item xs={12}><TextField label="Description" fullWidth value={catalogForm.description} onChange={(e) => setCatalogForm({...catalogForm, description: e.target.value})} /></Grid>
            <Grid item xs={6}><TextField label="Default Price (UGX)" fullWidth type="number" value={catalogForm.defaultPrice} onChange={(e) => setCatalogForm({...catalogForm, defaultPrice: e.target.value})} required /></Grid>
            <Grid item xs={6}><TextField label="Default Weight (kg)" fullWidth type="number" value={catalogForm.defaultWeight} onChange={(e) => setCatalogForm({...catalogForm, defaultWeight: e.target.value})} /></Grid>
            <Grid item xs={6}><TextField label="Default Size" fullWidth value={catalogForm.defaultSize} onChange={(e) => setCatalogForm({...catalogForm, defaultSize: e.target.value})} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>Category</InputLabel><Select value={catalogForm.category} label="Category" onChange={(e) => setCatalogForm({...catalogForm, category: e.target.value as any})}><MenuItem value="cylinder">Cylinder</MenuItem><MenuItem value="accessory">Accessory</MenuItem></Select></FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setCatalogOpen(false)}>Cancel</Button><Button variant="contained" onClick={saveCatalogItem}>Create</Button></DialogActions>
      </Dialog>

      {/* Add to Station Dialog */}
      <Dialog open={addToStationOpen} onClose={() => setAddToStationOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add "{selectedCatalog?.name}" to Station</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <ImageUpload
                value={stationForm.imageUrl}
                onChange={(url) => setStationForm({ ...stationForm, imageUrl: url })}
                label="Override Image (optional)"
                token={token}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth><InputLabel>Station</InputLabel><Select value={stationForm.stationId} label="Station" onChange={(e) => setStationForm({...stationForm, stationId: e.target.value})} required>{stations.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}</Select></FormControl>
            </Grid>
            <Grid item xs={12}><TextField label="Price Override (UGX)" fullWidth type="number" value={stationForm.price} onChange={(e) => setStationForm({...stationForm, price: e.target.value})} helperText={`Default: UGX ${Number(selectedCatalog?.defaultPrice || 0).toLocaleString()}`} /></Grid>
            <Grid item xs={12}><TextField label="Stock Quantity" fullWidth type="number" value={stationForm.stock} onChange={(e) => setStationForm({...stationForm, stock: e.target.value})} required /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setAddToStationOpen(false)}>Cancel</Button><Button variant="contained" onClick={addCatalogToStation}>Add to Stock</Button></DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
