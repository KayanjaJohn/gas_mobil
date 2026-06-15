import { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Typography, Switch, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Grid
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Products() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '', description: '', price: '', stock: '', type: 'cylinder'
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await axios.get(`${API_URL}/products`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setProducts(res.data.data);
  };

  const toggleAvailability = async (id: string, current: boolean) => {
    await axios.patch(`${API_URL}/products/${id}/availability`, {
      isAvailable: !current
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchProducts();
  };

  const createProduct = async () => {
    await axios.post(`${API_URL}/products`, {
      ...newProduct,
      price: Number(newProduct.price),
      stock: Number(newProduct.stock),
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setOpen(false);
    setNewProduct({ name: '', description: '', price: '', stock: '', type: 'cylinder' });
    fetchProducts();
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Products</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Add Product
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Available</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product: any) => (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>UGX {Number(product.price).toLocaleString()}</TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell>{product.type}</TableCell>
                <TableCell>
                  <Switch
                    checked={product.isAvailable}
                    onChange={() => toggleAvailability(product.id, product.isAvailable)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Product</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Name" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Price" type="number" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Stock" type="number" value={newProduct.stock} onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={createProduct} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}