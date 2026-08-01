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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

  // Products tab state
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Catalog tab state
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  // Shared UI state
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false, message: '', severity: 'success' as 'success' | 'error'
  });

  // Form state
  const [form, setForm] = useState({
    name: '', description: '', price: '', stock: '', type: 'cylinder',
    weight: '', size: '', imageUrl: '',
  });

  // Catalog add-to-stock form
  const [catalogForm, setCatalogForm] = useState({
    selectedCatalogId: '', price: '', stock: '', imageUrl: '',
  });
  const [catalogDialogOpen, setCatalogDialogOpen] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null);

  useEffect(() => { fetchProducts(); fetchCatalog(); }, []);

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
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      stock: String(product.stock),
      type: product.type,
      weight: '',
      size: '',
      imageUrl: product.imageUrl || '',
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

  // Catalog: open add-to-stock dialog
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
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
        Station Products
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Products for {user?.station?.name || 'your station'}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
        <Tab label={`My Products (${products.length})`} />
        <Tab label="Product Catalog" />
      </Tabs>

      {/* TAB 0: My Products */}
      {activeTab === 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
              Add New Product
            </Button>
          </Box>

          {productsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {product.imageUrl && (
                            <Box
                              component="img"
                              src={product.imageUrl}
                              sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover' }}
                              onError={(e: any) => { e.target.style.display = 'none'; }}
                            />
                          )}
                          <Box>
                            <Typography fontWeight={600}>{product.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {product.description}
                            </Typography>
                          </Box>
                        </Box>
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
                        <IconButton onClick={() => openEdit(product)} size="small">
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton onClick={() => deleteProduct(product.id)} size="small" color="error">
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {products.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No products at this station. Use the Catalog tab to add from predefined products, or create a new one.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* TAB 1: Product Catalog */}
      {activeTab === 1 && (
        <>
          {catalogLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Cylinders Section */}
              <Typography variant="h6" sx={{ mb: 2, mt: 1 }}>🔥 Gas Cylinders</Typography>
              <Grid container spacing={2} sx={{ mb: 4 }}>
                {cylinders.map((item) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                    <MuiCard sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ height: 140, bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.imageUrl ? (
                          <Box component="img" src={item.imageUrl} sx={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                        ) : (
                          <Inventory sx={{ fontSize: 48, color: '#bbb' }} />
                        )}
                      </Box>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight={700}>{item.name}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {item.description || 'No description'}
                        </Typography>
                        <Chip label={`UGX ${Number(item.defaultPrice).toLocaleString()}`} size="small" color="primary" />
                        {item.defaultSize && (
                          <Chip label={item.defaultSize} size="small" variant="outlined" sx={{ ml: 1 }} />
                        )}
                        {item.defaultWeight && (
                          <Chip label={`${item.defaultWeight}kg`} size="small" variant="outlined" sx={{ ml: 1 }} />
                        )}
                      </CardContent>
                      <Box sx={{ p: 2, pt: 0 }}>
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<Add />}
                          onClick={() => openCatalogAdd(item)}
                        >
                          Add to Stock
                        </Button>
                      </Box>
                    </MuiCard>
                  </Grid>
                ))}
                {cylinders.length === 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Alert severity="info">No cylinder templates in catalog yet.</Alert>
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Accessories Section */}
              <Typography variant="h6" sx={{ mb: 2 }}>🔧 Accessories</Typography>
              <Grid container spacing={2}>
                {accessories.map((item) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                    <MuiCard sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ height: 140, bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.imageUrl ? (
                          <Box component="img" src={item.imageUrl} sx={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                        ) : (
                          <Inventory sx={{ fontSize: 48, color: '#bbb' }} />
                        )}
                      </Box>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight={700}>{item.name}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {item.description || 'No description'}
                        </Typography>
                        <Chip label={`UGX ${Number(item.defaultPrice).toLocaleString()}`} size="small" color="primary" />
                      </CardContent>
                      <Box sx={{ p: 2, pt: 0 }}>
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<Add />}
                          onClick={() => openCatalogAdd(item)}
                        >
                          Add to Stock
                        </Button>
                      </Box>
                    </MuiCard>
                  </Grid>
                ))}
                {accessories.length === 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Alert severity="info">No accessory templates in catalog yet.</Alert>
                  </Grid>
                )}
              </Grid>
            </>
          )}
        </>
      )}

      {/* Add/Edit Product Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <TextField label="Name" fullWidth value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Description" fullWidth multiline rows={2} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField label="Price (UGX)" fullWidth type="number" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField label="Stock" fullWidth type="number" value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select value={form.type} label="Type"
                  onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <MenuItem value="cylinder">Cylinder</MenuItem>
                  <MenuItem value="accessory">Accessory</MenuItem>
                  <MenuItem value="burner">Burner</MenuItem>
                  <MenuItem value="regulator">Regulator</MenuItem>
                  <MenuItem value="hose">Hose</MenuItem>
                  <MenuItem value="grill">Grill</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField label="Size (e.g. 6kg, 12kg)" fullWidth value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Image URL" fullWidth value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                helperText="Paste image URL or upload via the upload endpoint" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingProduct ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Catalog Add-to-Stock Dialog */}
      <Dialog open={catalogDialogOpen} onClose={() => setCatalogDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add "{selectedCatalogItem?.name}" to Stock</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <TextField label="Price (UGX)" fullWidth type="number" value={catalogForm.price}
                onChange={(e) => setCatalogForm({ ...catalogForm, price: e.target.value })}
                helperText={`Default: UGX ${Number(selectedCatalogItem?.defaultPrice || 0).toLocaleString()}`} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Stock Quantity" fullWidth type="number" value={catalogForm.stock}
                onChange={(e) => setCatalogForm({ ...catalogForm, stock: e.target.value })} required />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Image URL" fullWidth value={catalogForm.imageUrl}
                onChange={(e) => setCatalogForm({ ...catalogForm, imageUrl: e.target.value })}
                helperText="Override catalog image if needed" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCatalogDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCatalogAddToStock}>
            Add to Stock
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}