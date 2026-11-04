import { useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, CircularProgress, FormControl, InputLabel,
  MenuItem, Paper, Select, Snackbar, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField,
  Typography,
} from "@mui/material";
import { Delete, Refresh } from "@mui/icons-material";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "/api";

interface Station {
  id: string;
  name: string;
  city?: string | null;
}
interface Activity {
  id: string;
  eventType: string;
  title: string;
  description: string;
  orderId?: string | null;
  createdAt: string;
  data?: any;
}

export default function StationHistory() {
  const { token } = useAuth();
  const [stations, setStations] = useState<Station[]>([]);
  const [stationId, setStationId] = useState("");
  const [history, setHistory] = useState<Activity[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const auth = { headers: { Authorization: `Bearer ${token || ""}` } };

  const selectedStation = useMemo(
    () => stations.find((station) => station.id === stationId),
    [stations, stationId]
  );

  const fetchStations = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/stations`, auth);
      const items = response.data?.data || [];
      setStations(items);
      if (!stationId && items.length) setStationId(items[0].id);
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not load stations.");
    }
  };

  const fetchHistory = async () => {
    if (!stationId) {
      setHistory([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const response = await axios.get(
        `${API_URL}/admin/stations/${stationId}/history`,
        { ...auth, params }
      );
      setHistory(response.data?.data?.history || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not load station history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchStations(); }, []);
  useEffect(() => { void fetchHistory(); }, [stationId]);

  const clearHistory = async () => {
    if (!stationId || !selectedStation) return;
    const confirmed = window.confirm(
      `Permanently clear all recorded history for ${selectedStation.name}? This does not delete orders, stock or customer records.`
    );
    if (!confirmed) return;

    setClearing(true);
    setError("");
    try {
      const response = await axios.delete(
        `${API_URL}/admin/stations/${stationId}/history`,
        auth
      );
      setHistory([]);
      setNotice(response.data?.message || "Station history cleared.");
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not clear station history.");
    } finally {
      setClearing(false);
    }
  };

  return (
    <Box>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Station History</Typography>
          <Typography variant="body2" color="text.secondary">
            Stock changes, customer orders and delivery events recorded for each station.
          </Typography>
        </Box>
        <Button
          color="error"
          variant="outlined"
          startIcon={<Delete />}
          disabled={!stationId || clearing}
          onClick={() => void clearHistory()}
        >
          {clearing ? "Clearing…" : "Clear station history"}
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
          <FormControl fullWidth sx={{ maxWidth: 360 }}>
            <InputLabel>Station</InputLabel>
            <Select value={stationId} label="Station" onChange={(event) => setStationId(event.target.value)}>
              {stations.map((station) => (
                <MenuItem key={station.id} value={station.id}>
                  {station.name}{station.city ? ` · ${station.city}` : ""}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="From" type="date" InputLabelProps={{ shrink: true }} value={from} onChange={(event) => setFrom(event.target.value)} />
          <TextField label="To" type="date" InputLabelProps={{ shrink: true }} value={to} onChange={(event) => setTo(event.target.value)} />
          <Button variant="contained" startIcon={<Refresh />} onClick={() => void fetchHistory()} disabled={!stationId || loading}>
            Apply filters
          </Button>
        </Stack>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date / Time</TableCell>
              <TableCell>Activity</TableCell>
              <TableCell>Details</TableCell>
              <TableCell>Order</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} align="center"><CircularProgress sx={{ my: 4 }} /></TableCell></TableRow>
            ) : history.length ? history.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  {new Date(item.createdAt).toLocaleString()}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{item.title}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>{item.orderId ? `#${item.orderId.slice(0, 8)}` : "—"}</TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 5, color: "text.secondary" }}>
                {stationId ? "No station activity recorded for this selection." : "Select a station to view its history."}
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar open={!!notice} autoHideDuration={5000} onClose={() => setNotice("")}>
        <Alert severity="success" onClose={() => setNotice("")}>{notice}</Alert>
      </Snackbar>
    </Box>
  );
}
