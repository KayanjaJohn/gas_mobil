import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, Box, Button, Card, CardContent, CardMedia, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, Grid, Stack, TextField, Typography,
} from "@mui/material";
import { AddShoppingCart, Inventory2Outlined, Refresh } from "@mui/icons-material";
import api from "../services/api";

interface CatalogItem {
  id: string;
  name: string;
  description?: string | null;
  defaultPrice: number | string;
  defaultWeight?: number | string | null;
  defaultSize?: string | null;
  category: "cylinder" | "accessory";
  imageUrl?: string | null;
  isActive: boolean;
}

export default function Catalog() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [saving, setSaving] = useState(false);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/catalog");
      const data = response.data?.data;
      if (!Array.isArray(data)) throw new Error("The product catalogue response was incomplete.");
      setItems(data.filter((item: CatalogItem) => item.isActive));
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "We couldn't load the product catalogue. Please retry.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadCatalog(); }, [loadCatalog]);

  const openAdd = (item: CatalogItem) => {
    setSelected(item);
    setPrice(String(item.defaultPrice ?? ""));
    setStock("1");
    setError("");
    setNotice("");
  };

  const addToStation = async () => {
    if (!selected) return;
    const cleanPrice = Number(price);
    const cleanStock = Number(stock);
    if (!Number.isFinite(cleanPrice) || cleanPrice < 0) {
      setError("Enter a valid, non-negative selling price.");
      return;
    }
    if (!Number.isInteger(cleanStock) || cleanStock < 0) {
      setError("Enter a whole-number opening stock quantity (zero or greater).");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.post(`/catalog/${selected.id}/add-to-station`, {
        price: cleanPrice,
        stock: cleanStock,
        imageUrl: selected.imageUrl || undefined,
      });
      setSelected(null);
      setNotice(`${selected.name} was added to your station inventory.`);
      navigate("/products", { state: { catalogueAdded: selected.name } });
    } catch (err: any) {
      setError(err.response?.data?.error || "We couldn't add this catalogue item. Please retry or contact your administrator.");
    } finally {
      setSaving(false);
    }
  };

  const currency = (value: number | string) => `UGX ${Number(value || 0).toLocaleString("en-UG")}`;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1500, mx: "auto" }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Product Catalogue</Typography>
          <Typography color="text.secondary" sx={{ mt: .5 }}>Choose products approved by GasMobil administration and add them to your station.</Typography>
        </Box>
        <Button variant="outlined" startIcon={<Refresh />} onClick={() => void loadCatalog()} disabled={loading}>Refresh catalogue</Button>
      </Stack>

      {error && !selected && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice("")}>{notice}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : items.length === 0 ? (
        <Card variant="outlined">
          <CardContent sx={{ textAlign: "center", py: 7 }}>
            <Inventory2Outlined sx={{ fontSize: 52, color: "text.secondary", mb: 1 }} />
            <Typography variant="h6">No catalogue products available</Typography>
            <Typography color="text.secondary">Ask an administrator to publish products in the GasMobil catalogue.</Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {items.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
              <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                {item.imageUrl ? (
                  <CardMedia component="img" height="160" image={item.imageUrl} alt={item.name} sx={{ objectFit: "contain", bgcolor: "#FFF8EE", p: 1 }} />
                ) : (
                  <Box sx={{ height: 160, display: "grid", placeItems: "center", bgcolor: "action.hover" }}>
                    <Inventory2Outlined sx={{ fontSize: 54, color: "text.secondary" }} />
                  </Box>
                )}
                <CardContent sx={{ flex: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Chip size="small" label={item.category === "cylinder" ? "Gas cylinder" : "Accessory"} />
                    {item.defaultSize && <Chip size="small" variant="outlined" label={item.defaultSize} />}
                  </Stack>
                  <Typography variant="h6" fontWeight={800}>{item.name}</Typography>
                  {!!item.description && <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>{item.description}</Typography>}
                  <Typography variant="h6" color="success.main" sx={{ mt: 1 }}>{currency(item.defaultPrice)}</Typography>
                  {item.defaultWeight != null && <Typography variant="caption" color="text.secondary">{item.defaultWeight} kg</Typography>}
                </CardContent>
                <Box sx={{ p: 2, pt: 0 }}>
                  <Button fullWidth variant="contained" startIcon={<AddShoppingCart />} onClick={() => openAdd(item)}>Add to station</Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={Boolean(selected)} onClose={() => !saving && setSelected(null)} fullWidth maxWidth="xs">
        <DialogTitle>Add {selected?.name} to station</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Station selling price (UGX)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} inputProps={{ min: 0 }} fullWidth />
            <TextField label="Opening stock quantity" type="number" value={stock} onChange={(e) => setStock(e.target.value)} inputProps={{ min: 0, step: 1 }} fullWidth />
            <Typography variant="caption" color="text.secondary">This adds stock to your own station only. Existing matching stock will be increased.</Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelected(null)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={() => void addToStation()} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : "Add to inventory"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
