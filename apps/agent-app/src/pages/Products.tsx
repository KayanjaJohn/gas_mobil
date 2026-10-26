
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add,
  DeleteOutline,
  EditOutlined,
  Inventory2Outlined,
  Refresh,
  SearchOutlined,
} from "@mui/icons-material";
import api from "../services/api";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number | string;
  stock: number;
  type?: string;
  imageUrl?: string | null;
  weight?: number | string | null;
  size?: string | null;
  isAvailable: boolean;
  stationId?: string;
  createdAt?: string;
}

interface ProductForm {
  name: string;
  description: string;
  price: string;
  stock: string;
  type: string;
  weight: string;
  size: string;
  imageUrl: string;
}

const emptyForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  stock: "0",
  type: "cylinder",
  weight: "",
  size: "",
  imageUrl: "",
};

function getErrorMessage(error: unknown): string {
  const err = error as {
    response?: { data?: { error?: string; message?: string } };
    message?: string;
  };

  return (
    err.response?.data?.error ||
    err.response?.data?.message ||
    err.message ||
    "Something went wrong. Please try again."
  );
}

function unwrapProducts(response: unknown): Product[] {
  const body = response as {
    data?: Product[] | { data?: Product[] };
  };

  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.data?.data)) return body.data.data;
  return [];
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const response = await api.get("/agent/products");
      setProducts(unwrapProducts(response.data));
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const openCreateDialog = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name || "",
      description: product.description || "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? 0),
      type: product.type || "cylinder",
      weight: product.weight == null ? "" : String(product.weight),
      size: product.size || "",
      imageUrl: product.imageUrl || "",
    });
    setDialogOpen(true);
  };

  const updateField = (field: keyof ProductForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveProduct = async () => {
    const price = Number(form.price);
    const stock = Number(form.stock);
    const weight = form.weight.trim() ? Number(form.weight) : undefined;

    if (!form.name.trim()) {
      setNoticeError(true);
      setNotice("Enter a product name.");
      return;
    }

    if (!form.price.trim() || !Number.isFinite(price) || price < 0) {
      setNoticeError(true);
      setNotice("Enter a valid, non-negative price.");
      return;
    }

    if (!form.stock.trim() || !Number.isInteger(stock) || stock < 0) {
      setNoticeError(true);
      setNotice("Stock must be a non-negative whole number.");
      return;
    }

    if (
      weight !== undefined &&
      (!Number.isFinite(weight) || weight < 0)
    ) {
      setNoticeError(true);
      setNotice("Enter a valid product weight.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price,
      stock,
      type: form.type,
      weight,
      size: form.size.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
    };

    setSaving(true);

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
        setNotice("Product updated successfully.");
      } else {
        await api.post("/products", payload);
        setNotice("Product created successfully.");
      }

      setNoticeError(false);
      setDialogOpen(false);
      await loadProducts();
    } catch (error) {
      setNoticeError(true);
      setNotice(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (product: Product) => {
    try {
      await api.patch(`/products/${product.id}/availability`, {
        isAvailable: !product.isAvailable,
      });

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? { ...item, isAvailable: !item.isAvailable }
            : item
        )
      );

      setNotice(
        `${product.name} is now ${
          product.isAvailable ? "unavailable" : "available"
        }.`
      );
      setNoticeError(false);
    } catch (error) {
      setNoticeError(true);
      setNotice(getErrorMessage(error));
    }
  };

  const deleteProduct = async () => {
    if (!deleteTarget) return;

    setSaving(true);

    try {
      await api.delete(`/products/${deleteTarget.id}`);
      setProducts((current) =>
        current.filter((item) => item.id !== deleteTarget.id)
      );
      setNotice("Product deleted.");
      setNoticeError(false);
      setDeleteTarget(null);
    } catch (error) {
      setNoticeError(true);
      setNotice(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const query = search.trim().toLowerCase();
    return (
      !query ||
      product.name.toLowerCase().includes(query) ||
      (product.description || "").toLowerCase().includes(query) ||
      (product.type || "").toLowerCase().includes(query)
    );
  });

  const availableCount = products.filter((item) => item.isAvailable).length;
  const lowStockCount = products.filter(
    (item) => Number(item.stock) <= 5
  ).length;

  const currency = (value: number | string) =>
    `UGX ${Number(value || 0).toLocaleString("en-UG")}`;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1500, mx: "auto" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Products & Inventory
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Manage your station’s gas products, prices and stock.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => void loadProducts()}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreateDialog}
          >
            Add product
          </Button>
        </Stack>
      </Stack>

      {pageError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => void loadProducts()}>
              Retry
            </Button>
          }
        >
          {pageError}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Paper variant="outlined" sx={{ p: 2.5, height: "100%" }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Inventory2Outlined color="primary" />
              <Box>
                <Typography color="text.secondary" variant="body2">
                  Total products
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {products.length}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper variant="outlined" sx={{ p: 2.5, height: "100%" }}>
            <Typography color="text.secondary" variant="body2">
              Available products
            </Typography>
            <Typography variant="h5" fontWeight={700} color="success.main">
              {availableCount}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper variant="outlined" sx={{ p: 2.5, height: "100%" }}>
            <Typography color="text.secondary" variant="body2">
              Low stock (5 or fewer)
            </Typography>
            <Typography
              variant="h5"
              fontWeight={700}
              color={lowStockCount ? "warning.main" : "text.primary"}
            >
              {lowStockCount}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper variant="outlined">
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search products by name, description or type..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
            <CircularProgress />
          </Box>
        ) : filteredProducts.length === 0 ? (
          <Box sx={{ textAlign: "center", p: 6 }}>
            <Inventory2Outlined
              sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
            />
            <Typography variant="h6">
              {search ? "No matching products" : "No products yet"}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>
              {search
                ? "Try a different search term."
                : "Add your station’s first product to get started."}
            </Typography>
            {!search && (
              <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog}>
                Add product
              </Button>
            )}
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Stock</TableCell>
                  <TableCell>Availability</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        {product.imageUrl ? (
                          <Box
                            component="img"
                            src={product.imageUrl}
                            alt={product.name}
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 1,
                              objectFit: "cover",
                              bgcolor: "action.hover",
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 1,
                              display: "grid",
                              placeItems: "center",
                              bgcolor: "action.hover",
                            }}
                          >
                            <Inventory2Outlined color="action" />
                          </Box>
                        )}
                        <Box>
                          <Typography fontWeight={600}>{product.name}</Typography>
                          {product.size && (
                            <Typography variant="caption" color="text.secondary">
                              {product.size}
                              {product.weight ? ` · ${product.weight} kg` : ""}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={product.type || "cylinder"}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {currency(product.price)}
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        size="small"
                        label={product.stock}
                        color={Number(product.stock) <= 5 ? "warning" : "default"}
                        variant={Number(product.stock) <= 5 ? "filled" : "outlined"}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Switch
                          size="small"
                          checked={Boolean(product.isAvailable)}
                          onChange={() => void toggleAvailability(product)}
                          inputProps={{
                            "aria-label": `Toggle availability for ${product.name}`,
                          }}
                        />
                        <Typography variant="body2">
                          {product.isAvailable ? "Available" : "Unavailable"}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit product">
                        <IconButton
                          aria-label={`Edit ${product.name}`}
                          onClick={() => openEditDialog(product)}
                        >
                          <EditOutlined />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete product">
                        <IconButton
                          aria-label={`Delete ${product.name}`}
                          color="error"
                          onClick={() => setDeleteTarget(product)}
                        >
                          <DeleteOutline />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingProduct ? "Edit product" : "Add product"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Product name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              multiline
              minRows={2}
              fullWidth
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Price (UGX)"
                  type="number"
                  value={form.price}
                  onChange={(event) => updateField("price", event.target.value)}
                  inputProps={{ min: 0, step: "any" }}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Stock quantity"
                  type="number"
                  value={form.stock}
                  onChange={(event) => updateField("stock", event.target.value)}
                  inputProps={{ min: 0, step: 1 }}
                  required
                  fullWidth
                />
              </Grid>
            </Grid>
            <FormControl fullWidth>
              <InputLabel id="product-type-label">Product type</InputLabel>
              <Select
                labelId="product-type-label"
                label="Product type"
                value={form.type}
                onChange={(event) => updateField("type", event.target.value)}
              >
                <MenuItem value="cylinder">Gas cylinder</MenuItem>
                <MenuItem value="accessory">Accessory</MenuItem>
              </Select>
            </FormControl>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Weight (kg)"
                  type="number"
                  value={form.weight}
                  onChange={(event) => updateField("weight", event.target.value)}
                  inputProps={{ min: 0, step: "any" }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Size / variant"
                  value={form.size}
                  onChange={(event) => updateField("size", event.target.value)}
                  fullWidth
                />
              </Grid>
            </Grid>
            <TextField
              label="Image URL (optional)"
              value={form.imageUrl}
              onChange={(event) => updateField("imageUrl", event.target.value)}
              helperText="Paste an image URL. Image upload can be connected separately."
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void saveProduct()}
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} /> : editingProduct ? "Save changes" : "Create product"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => !saving && setDeleteTarget(null)}
      >
        <DialogTitle>Delete product?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{" "}
            <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={saving}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void deleteProduct()}
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={5000}
        onClose={() => setNotice("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setNotice("")}
          severity={noticeError ? "error" : "success"}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {notice}
        </Alert>
      </Snackbar>
    </Box>
  );
}
